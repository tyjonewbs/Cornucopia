'use server';

import db from '@/lib/db';
import { addDays, startOfDay, getDay } from 'date-fns';
import type { SerializedDeliveryEligibilityResult, SerializedDeliveryOption } from '@/types/delivery';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface CheckEligibilityParams {
  productId: string;
  userZipCode?: string;
  userCity?: string;
  userState?: string;
}

export async function checkDeliveryEligibility({
  productId,
  userZipCode,
  userCity,
  userState,
}: CheckEligibilityParams): Promise<SerializedDeliveryEligibilityResult> {
  try {
    // Fetch product with delivery zone and delivery listings
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        deliveryZone: true,
        deliveryListings: {
          where: {
            deliveryZone: {
              isActive: true,
            },
          },
          include: {
            deliveryZone: true,
          },
        },
      },
    });

    if (!product) {
      return {
        isEligible: false,
        reason: 'Product not found',
        deliveryOptions: [],
      };
    }

    if (!product.deliveryAvailable) {
      return {
        isEligible: false,
        reason: 'Delivery not available for this product',
        deliveryOptions: [],
      };
    }

    if (!product.deliveryZone) {
      return {
        isEligible: false,
        reason: 'No delivery zone configured',
        deliveryOptions: [],
      };
    }

    // Check if user location matches delivery zone
    const zone = product.deliveryZone;
    let isEligible = false;
    let matchedZipCode: string | undefined;
    let matchedCity: string | undefined;

    // Check ZIP code match
    if (userZipCode && zone.zipCodes.includes(userZipCode)) {
      isEligible = true;
      matchedZipCode = userZipCode;
    }

    // Check city/state match
    if (
      !isEligible &&
      userCity &&
      userState &&
      zone.cities.some((c: string) => c.toLowerCase() === userCity.toLowerCase()) &&
      zone.states.some((s: string) => s.toLowerCase() === userState.toLowerCase())
    ) {
      isEligible = true;
      matchedCity = userCity;
    }

    if (!isEligible) {
      return {
        isEligible: false,
        reason: userZipCode
          ? `Delivery not available to ${userZipCode}`
          : 'Please provide your ZIP code to check delivery availability',
        deliveryOptions: [],
      };
    }

    // Generate delivery options based on delivery type
    const deliveryOptions: SerializedDeliveryOption[] = [];

    if (product.deliveryType === 'ONE_TIME' && product.deliveryDates) {
      // One-time delivery: use specific dates
      const timeWindows = (zone.deliveryTimeWindows as Record<string, string>) || {};
      
      for (const date of product.deliveryDates) {
        const deliveryDate = new Date(date);
        const dayName = DAYS_OF_WEEK[getDay(deliveryDate)];
        const timeWindow = timeWindows[dayName] || '9am - 5pm';

        deliveryOptions.push({
          date: deliveryDate.toISOString(),
          dayOfWeek: dayName,
          timeWindow,
          deliveryFee: zone.deliveryFee,
          freeDeliveryThreshold: zone.freeDeliveryThreshold || undefined,
          minimumOrder: zone.minimumOrder || undefined,
          inventory: product.inventory,
          isRecurring: false,
          deliveryZoneId: zone.id,
        });
      }
    } else if (product.deliveryType === 'RECURRING') {
      // Recurring delivery: generate next 8 weeks of dates based on delivery listings
      const today = startOfDay(new Date());
      const timeWindows = (zone.deliveryTimeWindows as Record<string, string>) || {};

      // Get delivery days from product delivery listings
      const deliveryDaysByZone = product.deliveryListings.filter(
        listing => listing.deliveryZoneId === zone.id
      );

      if (deliveryDaysByZone.length > 0) {
        // Generate dates for the next 8 weeks
        for (let i = 0; i < 56; i++) {
          const futureDate = addDays(today, i);
          const dayName = DAYS_OF_WEEK[getDay(futureDate)];
          
          // Check if this day has a delivery listing
          const listing = deliveryDaysByZone.find(
            (l: any) => l.dayOfWeek.toLowerCase() === dayName.toLowerCase()
          );

          if (listing && listing.inventory > 0) {
            const timeWindow = timeWindows[dayName] || '9am - 5pm';

            deliveryOptions.push({
              date: futureDate.toISOString(),
              dayOfWeek: dayName,
              timeWindow,
              deliveryFee: zone.deliveryFee,
              freeDeliveryThreshold: zone.freeDeliveryThreshold || undefined,
              minimumOrder: zone.minimumOrder || undefined,
              inventory: listing.inventory,
              isRecurring: true,
              deliveryZoneId: zone.id,
            });
          }
        }
      } else if (zone.deliveryDays && zone.deliveryDays.length > 0) {
        // Fallback: use zone's delivery days if no product listings
        for (let i = 0; i < 56; i++) {
          const futureDate = addDays(today, i);
          const dayName = DAYS_OF_WEEK[getDay(futureDate)];
          
          if (zone.deliveryDays.includes(dayName)) {
            const timeWindow = (timeWindows as Record<string, string>)[dayName] || '9am - 5pm';

            deliveryOptions.push({
              date: futureDate.toISOString(),
              dayOfWeek: dayName,
              timeWindow,
              deliveryFee: zone.deliveryFee,
              freeDeliveryThreshold: zone.freeDeliveryThreshold || undefined,
              minimumOrder: zone.minimumOrder || undefined,
              inventory: product.inventory,
              isRecurring: true,
              deliveryZoneId: zone.id,
            });
          }
        }
      }
    }

    // Sort by date
    deliveryOptions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      isEligible: true,
      matchedZipCode,
      matchedCity,
      deliveryOptions,
    };
  } catch (error) {
    console.error('Error checking delivery eligibility:', error);
    return {
      isEligible: false,
      reason: 'Error checking delivery availability',
      deliveryOptions: [],
    };
  }
}
