/**
 * One-time data migration script
 * Backfills Delivery records from existing DeliveryZone data.
 *
 * Run: npx ts-node prisma/scripts/backfill-deliveries.ts
 */

import { PrismaClient } from '@prisma/client';
import { addDays, startOfDay, getDay } from 'date-fns';

const prisma = new PrismaClient();

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dayMap: Record<string, number> = {
  'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
  'Thursday': 4, 'Friday': 5, 'Saturday': 6
};

async function backfillDeliveries() {
  console.log('Starting delivery backfill...');

  const zones = await prisma.deliveryZone.findMany({
    include: {
      productListings: true,
    },
  });

  console.log(`Found ${zones.length} delivery zones`);

  let deliveryCount = 0;
  let productCount = 0;

  for (const zone of zones) {
    console.log(`\nProcessing zone: ${zone.name} (${zone.deliveryType})`);

    if (zone.deliveryType === 'RECURRING' && zone.deliveryDays.length > 0) {
      // Generate deliveries for next 8 weeks
      const today = startOfDay(new Date());

      for (const dayName of zone.deliveryDays) {
        const targetDay = dayMap[dayName];
        if (targetDay === undefined) continue;

        let current = new Date(today);
        const daysUntil = (targetDay + 7 - current.getDay()) % 7;
        current.setDate(current.getDate() + (daysUntil === 0 ? 0 : daysUntil));

        for (let week = 0; week < 8; week++) {
          const deliveryDate = new Date(current);
          deliveryDate.setDate(deliveryDate.getDate() + week * 7);

          if (deliveryDate < today) continue;

          try {
            const delivery = await prisma.delivery.upsert({
              where: {
                userId_date: {
                  userId: zone.userId,
                  date: deliveryDate,
                }
              },
              create: {
                userId: zone.userId,
                date: deliveryDate,
                status: 'SCHEDULED',
                zones: { connect: [{ id: zone.id }] },
              },
              update: {
                zones: { connect: [{ id: zone.id }] },
              },
            });

            deliveryCount++;

            // Create DeliveryProduct records from ProductDeliveryListings
            const listingsForDay = zone.productListings.filter(
              l => l.dayOfWeek.toLowerCase() === dayName.toLowerCase()
            );

            for (const listing of listingsForDay) {
              try {
                await prisma.deliveryProduct.upsert({
                  where: {
                    deliveryId_productId: {
                      deliveryId: delivery.id,
                      productId: listing.productId,
                    }
                  },
                  create: {
                    deliveryId: delivery.id,
                    productId: listing.productId,
                    cap: null,
                  },
                  update: {},
                });
                productCount++;
              } catch {
                // Skip conflicts
              }
            }
          } catch (e) {
            console.log(`  Skipping date ${deliveryDate.toISOString()}: ${e}`);
          }
        }
      }
    } else if (zone.deliveryType === 'ONE_TIME' && zone.scheduledDates) {
      // Create delivery for each scheduled date
      const scheduledDates = zone.scheduledDates as Array<{
        date: string;
        timeWindow?: string;
        note?: string;
      }>;

      for (const sd of scheduledDates) {
        const deliveryDate = startOfDay(new Date(sd.date));

        if (deliveryDate < startOfDay(new Date())) continue;

        try {
          await prisma.delivery.upsert({
            where: {
              userId_date: {
                userId: zone.userId,
                date: deliveryDate,
              }
            },
            create: {
              userId: zone.userId,
              date: deliveryDate,
              status: 'SCHEDULED',
              timeWindow: sd.timeWindow || null,
              note: sd.note || null,
              zones: { connect: [{ id: zone.id }] },
            },
            update: {
              zones: { connect: [{ id: zone.id }] },
            },
          });
          deliveryCount++;
        } catch (e) {
          console.log(`  Skipping scheduled date ${sd.date}: ${e}`);
        }
      }
    }
  }

  console.log(`\nBackfill complete:`);
  console.log(`  Deliveries created/updated: ${deliveryCount}`);
  console.log(`  DeliveryProducts created/updated: ${productCount}`);
}

backfillDeliveries()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
