import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { EventsDashboardClient } from "./events-client";
import { unstable_noStore as noStore } from "next/cache";

async function getEventsWithVendors(userId: string) {
  const events = await prisma.event.findMany({
    where: { organizerId: userId },
    include: {
      vendors: {
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: { requestedAt: "asc" },
      },
      _count: {
        select: {
          vendors: { where: { status: "APPROVED" } },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  return events.map(({ vendors, _count, ...event }) => ({
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    vendors: vendors.map((v) => ({
      ...v,
      requestedAt: v.requestedAt.toISOString(),
      respondedAt: v.respondedAt?.toISOString() || null,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    })),
    approvedVendorCount: _count.vendors,
  }));
}

async function getVendorEvents(userId: string) {
  const vendorships = await prisma.eventVendor.findMany({
    where: { vendorId: userId },
    include: {
      event: {
        include: {
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          _count: {
            select: {
              vendors: { where: { status: "APPROVED" } },
            },
          },
        },
      },
    },
    orderBy: { event: { startDate: "desc" } },
  });

  return vendorships.map(({ event, ...vendorship }) => ({
    ...vendorship,
    requestedAt: vendorship.requestedAt.toISOString(),
    respondedAt: vendorship.respondedAt?.toISOString() || null,
    createdAt: vendorship.createdAt.toISOString(),
    updatedAt: vendorship.updatedAt.toISOString(),
    event: {
      ...event,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      approvedVendorCount: event._count.vendors,
    },
  }));
}

export default async function EventsDashboard() {
  noStore();
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const [organizedEvents, vendorEvents] = await Promise.all([
    getEventsWithVendors(user.id.toString()),
    getVendorEvents(user.id.toString()),
  ]);

  return (
    <EventsDashboardClient
      initialEvents={organizedEvents}
      vendorEvents={vendorEvents}
      userId={user.id.toString()}
    />
  );
}
