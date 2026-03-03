-- CreateEnum (idempotent)
DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED', 'PARTIALLY_REFUNDED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: Add new columns to Order (idempotent)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "platformFee" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stripeSessionId" VARCHAR(255);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" VARCHAR(255);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stripeTransferGroup" VARCHAR(255);

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "order_stripe_session_idx" ON "Order"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "order_stripe_pi_idx" ON "Order"("stripePaymentIntentId");

-- CreateTable (idempotent)
CREATE TABLE IF NOT EXISTS "PendingCheckout" (
    "id" TEXT NOT NULL,
    "stripeSessionId" VARCHAR(255) NOT NULL,
    "userId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "transferGroup" VARCHAR(100) NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL,
    "deliveryFees" INTEGER NOT NULL,
    "items" JSONB NOT NULL,
    "transfers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "PendingCheckout_stripeSessionId_key" ON "PendingCheckout"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "PendingCheckout_stripeSessionId_idx" ON "PendingCheckout"("stripeSessionId");
CREATE INDEX IF NOT EXISTS "PendingCheckout_expiresAt_idx" ON "PendingCheckout"("expiresAt");
