-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('PICKUP', 'DELIVERY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_PRODUCTS', 'PRICE_CHANGES', 'BACK_IN_STOCK', 'SPECIAL_ANNOUNCEMENTS', 'ORDER_UPDATES', 'HOURS_CHANGES');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" VARCHAR(50) NOT NULL,
    "userId" TEXT NOT NULL,
    "marketStandId" TEXT NOT NULL,
    "type" "OrderType" NOT NULL DEFAULT 'PICKUP',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL,
    "fees" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "pickupTime" TIMESTAMP(3),
    "deliveryAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "priceAtTime" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedProduct" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketStandSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketStandId" TEXT NOT NULL,
    "notificationTypes" "NotificationType"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketStandSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "order_user_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "order_stand_idx" ON "Order"("marketStandId");

-- CreateIndex
CREATE INDEX "order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "order_created_idx" ON "Order"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "order_item_order_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "order_item_product_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "saved_product_user_idx" ON "SavedProduct"("userId");

-- CreateIndex
CREATE INDEX "saved_product_product_idx" ON "SavedProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "saved_product_unique" ON "SavedProduct"("userId", "productId");

-- CreateIndex
CREATE INDEX "subscription_user_idx" ON "MarketStandSubscription"("userId");

-- CreateIndex
CREATE INDEX "subscription_stand_idx" ON "MarketStandSubscription"("marketStandId");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_unique" ON "MarketStandSubscription"("userId", "marketStandId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_marketStandId_fkey" FOREIGN KEY ("marketStandId") REFERENCES "MarketStand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProduct" ADD CONSTRAINT "SavedProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProduct" ADD CONSTRAINT "SavedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketStandSubscription" ADD CONSTRAINT "MarketStandSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketStandSubscription" ADD CONSTRAINT "MarketStandSubscription_marketStandId_fkey" FOREIGN KEY ("marketStandId") REFERENCES "MarketStand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
