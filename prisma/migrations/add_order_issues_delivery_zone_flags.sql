-- Add Order Issues tracking and Delivery Zone flags
-- Migration for admin delivery oversight functionality

-- Create IssueType enum
CREATE TYPE "IssueType" AS ENUM (
  'NOT_DELIVERED',
  'WRONG_ITEMS',
  'DAMAGED',
  'POOR_QUALITY',
  'LATE',
  'OTHER'
);

-- Create IssueStatus enum
CREATE TYPE "IssueStatus" AS ENUM (
  'PENDING',
  'INVESTIGATING',
  'RESOLVED',
  'REFUNDED',
  'ESCALATED'
);

-- Add DELIVERED status to OrderStatus enum
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';

-- Create OrderIssue table
CREATE TABLE "OrderIssue" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "issueType" "IssueType" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "refundAmount" INTEGER,
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "adminNotes" TEXT,

    CONSTRAINT "OrderIssue_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys for OrderIssue
ALTER TABLE "OrderIssue" ADD CONSTRAINT "OrderIssue_orderId_fkey" 
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderIssue" ADD CONSTRAINT "OrderIssue_reportedById_fkey" 
    FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderIssue" ADD CONSTRAINT "OrderIssue_resolvedById_fkey" 
    FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for OrderIssue
CREATE INDEX "OrderIssue_orderId_idx" ON "OrderIssue"("orderId");
CREATE INDEX "OrderIssue_reportedById_idx" ON "OrderIssue"("reportedById");
CREATE INDEX "OrderIssue_status_idx" ON "OrderIssue"("status");
CREATE INDEX "OrderIssue_createdAt_idx" ON "OrderIssue"("createdAt" DESC);

-- Add flagging and suspension fields to DeliveryZone
ALTER TABLE "DeliveryZone" 
    ADD COLUMN "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "flagReason" TEXT,
    ADD COLUMN "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "suspendedAt" TIMESTAMP(3),
    ADD COLUMN "suspendedById" TEXT,
    ADD COLUMN "suspensionReason" TEXT;

-- Create indexes for DeliveryZone flags
CREATE INDEX "DeliveryZone_flaggedForReview_idx" ON "DeliveryZone"("flaggedForReview");
CREATE INDEX "DeliveryZone_isSuspended_idx" ON "DeliveryZone"("isSuspended");

-- Update the updatedAt trigger for OrderIssue if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_order_issue_updated_at BEFORE UPDATE ON "OrderIssue"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE "OrderIssue" IS 'Customer-reported issues with orders for admin resolution';
COMMENT ON COLUMN "DeliveryZone"."flaggedForReview" IS 'Admin flag for zones needing review';
COMMENT ON COLUMN "DeliveryZone"."isSuspended" IS 'Suspended delivery zones cannot receive new orders';
