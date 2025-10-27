import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTestStands() {
  try {
    console.log('🧹 Starting cleanup of "Test Stand" market stands...\n');

    // First, let's see what we're about to delete
    console.log('📊 Analyzing data to be deleted:');
    
    const testStands = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM "MarketStand" 
      WHERE name = 'Test Stand'
    `;
    console.log(`   - Market Stands: ${testStands[0].count}`);

    const testProducts = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM "Product" 
      WHERE "marketStandId" IN (
        SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
      )
    `;
    console.log(`   - Products: ${testProducts[0].count}`);

    const standReviews = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM "StandReview" 
      WHERE "marketStandId" IN (
        SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
      )
    `;
    console.log(`   - Stand Reviews: ${standReviews[0].count}`);

    const productReviews = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM "ProductReview" 
      WHERE "productId" IN (
        SELECT id FROM "Product" 
        WHERE "marketStandId" IN (
          SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
        )
      )
    `;
    console.log(`   - Product Reviews: ${productReviews[0].count}\n`);

    if (Number(testStands[0].count) === 0) {
      console.log('✅ No test stands found to delete!');
      return;
    }

    console.log('🗑️  Executing cleanup in proper order...\n');

    // Execute deletions in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete ProductDailyMetrics
      const deletedProductDailyMetrics = await tx.$executeRaw`
        DELETE FROM "ProductDailyMetrics"
        WHERE "productMetricId" IN (
          SELECT id FROM "ProductMetrics"
          WHERE "productId" IN (
            SELECT id FROM "Product" 
            WHERE "marketStandId" IN (
              SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
            )
          )
        )
      `;
      console.log(`   ✓ Deleted ${deletedProductDailyMetrics} ProductDailyMetrics records`);

      // 2. Delete ProductMetrics
      const deletedProductMetrics = await tx.$executeRaw`
        DELETE FROM "ProductMetrics"
        WHERE "productId" IN (
          SELECT id FROM "Product" 
          WHERE "marketStandId" IN (
            SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
          )
        )
      `;
      console.log(`   ✓ Deleted ${deletedProductMetrics} ProductMetrics records`);

      // 3. Delete ProductReviews
      const deletedProductReviews = await tx.$executeRaw`
        DELETE FROM "ProductReview"
        WHERE "productId" IN (
          SELECT id FROM "Product" 
          WHERE "marketStandId" IN (
            SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
          )
        )
      `;
      console.log(`   ✓ Deleted ${deletedProductReviews} ProductReview records`);

      // 4. Delete ProductStatusHistory
      const deletedProductStatusHistory = await tx.$executeRaw`
        DELETE FROM "ProductStatusHistory"
        WHERE "productId" IN (
          SELECT id FROM "Product" 
          WHERE "marketStandId" IN (
            SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
          )
        )
      `;
      console.log(`   ✓ Deleted ${deletedProductStatusHistory} ProductStatusHistory records`);

      // 5. Delete Products
      const deletedProducts = await tx.$executeRaw`
        DELETE FROM "Product"
        WHERE "marketStandId" IN (
          SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
        )
      `;
      console.log(`   ✓ Deleted ${deletedProducts} Product records`);

      // 6. Delete StandDailyMetrics
      const deletedStandDailyMetrics = await tx.$executeRaw`
        DELETE FROM "StandDailyMetrics"
        WHERE "standMetricId" IN (
          SELECT id FROM "StandMetrics"
          WHERE "marketStandId" IN (
            SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
          )
        )
      `;
      console.log(`   ✓ Deleted ${deletedStandDailyMetrics} StandDailyMetrics records`);

      // 7. Delete StandMetrics
      const deletedStandMetrics = await tx.$executeRaw`
        DELETE FROM "StandMetrics"
        WHERE "marketStandId" IN (
          SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
        )
      `;
      console.log(`   ✓ Deleted ${deletedStandMetrics} StandMetrics records`);

      // 8. Delete StandReviews
      const deletedStandReviews = await tx.$executeRaw`
        DELETE FROM "StandReview"
        WHERE "marketStandId" IN (
          SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
        )
      `;
      console.log(`   ✓ Deleted ${deletedStandReviews} StandReview records`);

      // 9. Delete StandStatusHistory
      const deletedStandStatusHistory = await tx.$executeRaw`
        DELETE FROM "StandStatusHistory"
        WHERE "marketStandId" IN (
          SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
        )
      `;
      console.log(`   ✓ Deleted ${deletedStandStatusHistory} StandStatusHistory records`);

      // 10. Finally, delete the MarketStands themselves
      const deletedMarketStands = await tx.$executeRaw`
        DELETE FROM "MarketStand"
        WHERE name = 'Test Stand'
      `;
      console.log(`   ✓ Deleted ${deletedMarketStands} MarketStand records`);
    });

    console.log('\n✅ Cleanup completed successfully!\n');

    // Verify deletion
    const remainingStands = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM "MarketStand" 
      WHERE name = 'Test Stand'
    `;
    
    const remainingProducts = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count 
      FROM "Product" 
      WHERE "marketStandId" IN (
        SELECT id FROM "MarketStand" WHERE name = 'Test Stand'
      )
    `;

    console.log('🔍 Verification:');
    console.log(`   - Remaining Test Stands: ${remainingStands[0].count}`);
    console.log(`   - Remaining Products from Test Stands: ${remainingProducts[0].count}`);

    if (Number(remainingStands[0].count) === 0 && Number(remainingProducts[0].count) === 0) {
      console.log('\n✨ All test data has been successfully removed!');
    } else {
      console.log('\n⚠️  Warning: Some test data may still remain');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestStands()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
