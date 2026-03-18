'use client';

import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Users, Store } from "lucide-react";

export interface EventTileData {
  id: string;
  name: string;
  slug: string | null;
  shortDescription: string | null;
  description: string | null;
  images: string[];
  tags: string[];
  eventType: 'FARMERS_MARKET' | 'FARM_TOUR' | 'WORKSHOP' | 'FESTIVAL' | 'POP_UP' | 'SEASONAL' | 'OTHER';
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  locationName: string;
  city: string | null;
  state: string | null;
  maxVendors: number | null;
  maxAttendees: number | null;
  isVendorApplicationOpen: boolean;
  distance?: number | null;
  vendorCount?: number;
}

interface EventTileProps {
  event: EventTileData;
}

const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  FARMERS_MARKET: { label: "Farmers Market", color: "bg-emerald-600" },
  FARM_TOUR: { label: "Farm Tour", color: "bg-amber-600" },
  WORKSHOP: { label: "Workshop", color: "bg-purple-600" },
  FESTIVAL: { label: "Festival", color: "bg-pink-600" },
  POP_UP: { label: "Pop-Up", color: "bg-orange-600" },
  SEASONAL: { label: "Seasonal", color: "bg-teal-600" },
  OTHER: { label: "Event", color: "bg-gray-600" },
};

function formatEventDate(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

  // If it starts today
  const isToday = start.toDateString() === now.toDateString();
  if (isToday) return 'Today';

  // If tomorrow
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (start.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  // If same day
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('en-US', options);
  }

  // Multi-day
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

function getTimeUntil(startDate: string): { label: string; urgent: boolean } | null {
  const start = new Date(startDate);
  const now = new Date();
  const diff = start.getTime() - now.getTime();

  if (diff < 0) return { label: 'Happening Now', urgent: true };
  if (diff < 24 * 60 * 60 * 1000) return { label: 'Starting Soon', urgent: true };
  if (diff < 3 * 24 * 60 * 60 * 1000) {
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return { label: `In ${days} day${days > 1 ? 's' : ''}`, urgent: false };
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) return { label: 'This Week', urgent: false };
  return null;
}

export function EventTile({ event }: EventTileProps) {
  const typeConfig = EVENT_TYPE_LABELS[event.eventType] || EVENT_TYPE_LABELS.OTHER;
  const dateLabel = formatEventDate(event.startDate, event.endDate);
  const timeUntil = getTimeUntil(event.startDate);
  const eventLink = event.slug ? `/events/${event.slug}` : `/events/${event.id}`;

  return (
    <Link
      href={eventLink}
      className="block group"
    >
      <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white border-2 border-orange-100">
        {/* Image / Header */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {/* Event type badge */}
          <div className={`absolute top-2 left-2 z-10 ${typeConfig.color}/90 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1`}>
            <Calendar className="w-3 h-3" />
            <span>{typeConfig.label}</span>
          </div>

          {/* Time urgency badge */}
          {timeUntil && (
            <div className={`absolute top-2 right-2 z-10 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold ${
              timeUntil.urgent
                ? 'bg-red-500/90 text-white animate-pulse'
                : 'bg-white/90 text-gray-700'
            }`}>
              {timeUntil.label}
            </div>
          )}

          {event.images[0] ? (
            <Image
              alt={event.name}
              src={event.images[0]}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={85}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-300 flex items-center justify-center">
              <Calendar className="w-12 h-12 text-orange-500" />
            </div>
          )}

          {/* Bottom gradient with date */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-2 px-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-white">
                <Calendar className="w-3 h-3" />
                <span className="text-xs font-semibold">{dateLabel}</span>
              </div>
              {event.isRecurring && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded-full">
                  Recurring
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-2.5 bg-gradient-to-b from-white to-orange-50/30">
          <h3 className="font-bold text-sm leading-tight line-clamp-1 text-gray-900">
            {event.name}
          </h3>

          {event.shortDescription && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
              {event.shortDescription}
            </p>
          )}

          {/* Location */}
          <div className="flex items-center gap-1 mt-1 text-gray-500">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="text-[10px] line-clamp-1">
              {event.locationName}
              {event.city && `, ${event.city}`}
              {event.distance != null && (
                <span className="text-orange-600 ml-1">
                  {Math.round(event.distance * 0.621371)} mi
                </span>
              )}
            </span>
          </div>

          {/* Info row */}
          <div className="flex items-center gap-2 mt-1.5">
            {event.vendorCount != null && event.vendorCount > 0 && (
              <div className="flex items-center gap-0.5 text-gray-500">
                <Store className="w-3 h-3" />
                <span className="text-[10px]">{event.vendorCount} vendors</span>
              </div>
            )}
            {event.maxAttendees && (
              <div className="flex items-center gap-0.5 text-gray-500">
                <Users className="w-3 h-3" />
                <span className="text-[10px]">Up to {event.maxAttendees}</span>
              </div>
            )}
            {event.isVendorApplicationOpen && (
              <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                Vendors Welcome
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
