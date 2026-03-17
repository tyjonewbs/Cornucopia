import prisma from "@/lib/db";
import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EventType, EventStatus } from "@prisma/client";

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  FARMERS_MARKET: "Farmers Market",
  FARM_TOUR: "Farm Tour",
  WORKSHOP: "Workshop",
  FESTIVAL: "Festival",
  POP_UP: "Pop-Up",
  SEASONAL: "Seasonal",
  OTHER: "Other",
};

async function getUpcomingEvents() {
  const events = await prisma.event.findMany({
    where: {
      isActive: true,
      status: EventStatus.APPROVED,
      endDate: { gte: new Date() },
    },
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
    orderBy: { startDate: "asc" },
    take: 50,
  });

  return events.map(({ _count, ...event }) => ({
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    vendorCount: _count.vendors,
  }));
}

export default async function EventsPage() {
  noStore();
  const events = await getUpcomingEvents();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
        <p className="text-muted-foreground mt-2">
          Discover local farm events, markets, and gatherings near you
        </p>
      </div>

      {events.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                {/* Image */}
                {event.images.length > 0 && (
                  <div className="relative w-full h-0 pb-[56.25%]">
                    <Image
                      src={event.images[0]}
                      alt={event.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {EVENT_TYPE_LABELS[event.eventType]}
                      </span>
                    </div>
                  </div>
                )}

                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold text-lg line-clamp-1">
                    {event.name}
                  </h3>

                  {event.shortDescription && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.shortDescription}
                    </p>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {new Date(event.startDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {new Date(event.startDate).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(event.endDate).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="line-clamp-1">
                        {event.locationName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {event.vendorCount} vendor
                        {event.vendorCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {event.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="bg-secondary px-2 py-0.5 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No upcoming events
            </h3>
            <p className="text-gray-600">
              Check back soon for new events in your area
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
