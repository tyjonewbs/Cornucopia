-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('FARMERS_MARKET', 'FARM_TOUR', 'WORKSHOP', 'FESTIVAL', 'POP_UP', 'SEASONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "EventVendorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255),
    "description" TEXT NOT NULL,
    "shortDescription" VARCHAR(500),
    "images" TEXT[],
    "tags" VARCHAR(50)[],
    "eventType" "EventType" NOT NULL DEFAULT 'FARMERS_MARKET',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringSchedule" JSONB,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "locationName" VARCHAR(255) NOT NULL,
    "locationGuide" TEXT NOT NULL,
    "streetAddress" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(50),
    "zipCode" VARCHAR(10),
    "location" geography,
    "maxVendors" INTEGER,
    "maxAttendees" INTEGER,
    "vendorFee" INTEGER,
    "isVendorApplicationOpen" BOOLEAN NOT NULL DEFAULT true,
    "website" TEXT,
    "socialMedia" TEXT[],
    "contactEmail" VARCHAR(255),
    "contactPhone" VARCHAR(20),
    "status" "EventStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventVendor" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "status" "EventVendorStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestMessage" TEXT,
    "respondedAt" TIMESTAMP(3),
    "responseNote" TEXT,
    "boothNumber" VARCHAR(50),
    "boothLocation" TEXT,
    "specialNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventMetrics" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueViews" INTEGER NOT NULL DEFAULT 0,
    "vendorApplications" INTEGER NOT NULL DEFAULT 0,
    "approvedVendors" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventStatusHistory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "oldStatus" "EventStatus" NOT NULL,
    "newStatus" "EventStatus" NOT NULL,
    "changedById" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "event_organizer_idx" ON "Event"("organizerId");

-- CreateIndex
CREATE INDEX "event_start_date_idx" ON "Event"("startDate");

-- CreateIndex
CREATE INDEX "event_end_date_idx" ON "Event"("endDate");

-- CreateIndex
CREATE INDEX "event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "event_active_idx" ON "Event"("isActive");

-- CreateIndex
CREATE INDEX "event_type_idx" ON "Event"("eventType");

-- CreateIndex
CREATE INDEX "event_location_idx" ON "Event"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "event_location_geo_idx" ON "Event" USING GIST ("location");

-- CreateIndex
CREATE INDEX "event_slug_idx" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "event_vendor_event_idx" ON "EventVendor"("eventId");

-- CreateIndex
CREATE INDEX "event_vendor_vendor_idx" ON "EventVendor"("vendorId");

-- CreateIndex
CREATE INDEX "event_vendor_status_idx" ON "EventVendor"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EventVendor_eventId_vendorId_key" ON "EventVendor"("eventId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "EventMetrics_eventId_key" ON "EventMetrics"("eventId");

-- CreateIndex
CREATE INDEX "event_metrics_event_idx" ON "EventMetrics"("eventId");

-- CreateIndex
CREATE INDEX "event_status_history_event_idx" ON "EventStatusHistory"("eventId");

-- CreateIndex
CREATE INDEX "event_status_history_user_idx" ON "EventStatusHistory"("changedById");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventVendor" ADD CONSTRAINT "EventVendor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventVendor" ADD CONSTRAINT "EventVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventMetrics" ADD CONSTRAINT "EventMetrics_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventStatusHistory" ADD CONSTRAINT "EventStatusHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "EventStatusHistory" ADD CONSTRAINT "EventStatusHistory_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
