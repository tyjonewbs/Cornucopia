"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  Edit,
  Calendar,
  MapPin,
  Users,
  ChevronDown,
  Clock,
  Check,
  X,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ApproveEventVendor, RejectEventVendor } from "@/app/actions/event-vendors";
import { DeleteEvent } from "@/app/actions/event";
import { EventStatus, EventType, EventVendorStatus } from "@prisma/client";

interface VendorUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
}

interface EventVendor {
  id: string;
  eventId: string;
  vendorId: string;
  status: EventVendorStatus;
  requestedAt: string;
  requestMessage: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  boothNumber: string | null;
  boothLocation: string | null;
  specialNotes: string | null;
  createdAt: string;
  updatedAt: string;
  vendor: VendorUser;
}

interface EventItem {
  id: string;
  name: string;
  slug: string | null;
  description: string;
  shortDescription: string | null;
  images: string[];
  tags: string[];
  eventType: EventType;
  startDate: string;
  endDate: string;
  isRecurring: boolean;
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  status: EventStatus;
  isActive: boolean;
  maxVendors: number | null;
  isVendorApplicationOpen: boolean;
  organizerId: string;
  vendors: EventVendor[];
  approvedVendorCount: number;
}

interface VendorEventItem {
  id: string;
  eventId: string;
  vendorId: string;
  status: EventVendorStatus;
  requestedAt: string;
  requestMessage: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  boothNumber: string | null;
  boothLocation: string | null;
  event: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    locationName: string;
    eventType: EventType;
    status: EventStatus;
    approvedVendorCount: number;
    organizer: VendorUser;
  };
}

interface EventsDashboardClientProps {
  initialEvents: EventItem[];
  vendorEvents: VendorEventItem[];
  userId: string;
}

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  FARMERS_MARKET: "Farmers Market",
  FARM_TOUR: "Farm Tour",
  WORKSHOP: "Workshop",
  FESTIVAL: "Festival",
  POP_UP: "Pop-Up",
  SEASONAL: "Seasonal",
  OTHER: "Other",
};

const STATUS_COLORS: Record<EventStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  COMPLETED: "bg-blue-100 text-blue-700",
};

const VENDOR_STATUS_COLORS: Record<EventVendorStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

export function EventsDashboardClient({
  initialEvents,
  vendorEvents,
  userId,
}: EventsDashboardClientProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(
    new Set(initialEvents[0] ? [initialEvents[0].id] : [])
  );
  const [activeTab, setActiveTab] = useState<"organized" | "vendor">("organized");

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Events refreshed");
    }, 500);
  };

  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const handleApproveVendor = async (eventId: string, vendorId: string) => {
    const result = await ApproveEventVendor(eventId, vendorId, userId);
    if (result.success) {
      toast.success("Vendor approved");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to approve vendor");
    }
  };

  const handleRejectVendor = async (eventId: string, vendorId: string) => {
    const result = await RejectEventVendor(eventId, vendorId, userId);
    if (result.success) {
      toast.success("Vendor rejected");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to reject vendor");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    const result = await DeleteEvent(eventId, userId);
    if (result.success) {
      toast.success("Event deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete event");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Events</h1>
            <p className="text-sm text-gray-600 mt-1">
              Organize events and manage vendor applications
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/events/setup/new">
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Link>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("organized")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "organized"
                ? "bg-white shadow text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            My Events ({initialEvents.length})
          </button>
          <button
            onClick={() => setActiveTab("vendor")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "vendor"
                ? "bg-white shadow text-gray-900"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Vendor Events ({vendorEvents.length})
          </button>
        </div>

        {/* Organized Events Tab */}
        {activeTab === "organized" && (
          <>
            {initialEvents.map((event) => {
              const isExpanded = expandedEvents.has(event.id);
              const pendingVendors = event.vendors.filter(
                (v) => v.status === "PENDING"
              );
              const approvedVendors = event.vendors.filter(
                (v) => v.status === "APPROVED"
              );

              return (
                <Card key={event.id} className="overflow-hidden">
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleEvent(event.id)}
                  >
                    <CardHeader className="bg-amber-50">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="flex-1 justify-start hover:bg-amber-100 w-full md:w-auto"
                          >
                            <Calendar className="h-5 w-5 mr-2 text-amber-700 flex-shrink-0" />
                            <span className="font-semibold text-base sm:text-lg truncate">
                              {event.name}
                            </span>
                            <span
                              className={`ml-2 sm:ml-3 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                STATUS_COLORS[event.status]
                              }`}
                            >
                              {event.status}
                            </span>
                            {pendingVendors.length > 0 && (
                              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 flex-shrink-0">
                                {pendingVendors.length} pending
                              </span>
                            )}
                            <ChevronDown
                              className={`h-4 w-4 ml-2 flex-shrink-0 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </Button>
                        </CollapsibleTrigger>
                        <div className="flex items-center gap-2 justify-end">
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/dashboard/events/setup/edit/${event.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Event Summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-sm mt-2 ml-0 sm:ml-7">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-600 truncate">
                            {formatDate(event.startDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-600 truncate">
                            {event.locationName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-600">
                            {event.approvedVendorCount} vendor
                            {event.approvedVendorCount !== 1 ? "s" : ""}
                            {event.maxVendors
                              ? ` / ${event.maxVendors} max`
                              : ""}
                          </span>
                        </div>
                        <div>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            {EVENT_TYPE_LABELS[event.eventType]}
                          </span>
                        </div>
                      </div>
                    </CardHeader>

                    <CollapsibleContent>
                      <CardContent className="p-4 space-y-4">
                        {/* Pending Vendor Applications */}
                        {pendingVendors.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                              <UserPlus className="h-4 w-4" />
                              Pending Applications ({pendingVendors.length})
                            </h4>
                            <div className="space-y-2">
                              {pendingVendors.map((vendor) => (
                                <div
                                  key={vendor.id}
                                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    {vendor.vendor.profileImage ? (
                                      <Image
                                        src={vendor.vendor.profileImage}
                                        alt=""
                                        width={32}
                                        height={32}
                                        className="rounded-full flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium flex-shrink-0">
                                        {vendor.vendor.firstName?.[0] || "?"}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-sm truncate">
                                        {vendor.vendor.firstName}{" "}
                                        {vendor.vendor.lastName}
                                      </p>
                                      {vendor.requestMessage && (
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                          &ldquo;{vendor.requestMessage}&rdquo;
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                      onClick={() =>
                                        handleApproveVendor(
                                          event.id,
                                          vendor.vendorId
                                        )
                                      }
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() =>
                                        handleRejectVendor(
                                          event.id,
                                          vendor.vendorId
                                        )
                                      }
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Approved Vendors */}
                        {approvedVendors.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              Approved Vendors ({approvedVendors.length})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {approvedVendors.map((vendor) => (
                                <div
                                  key={vendor.id}
                                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100"
                                >
                                  {vendor.vendor.profileImage ? (
                                    <Image
                                      src={vendor.vendor.profileImage}
                                      alt=""
                                      width={32}
                                      height={32}
                                      className="rounded-full"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                                      {vendor.vendor.firstName?.[0] || "?"}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium text-sm">
                                      {vendor.vendor.firstName}{" "}
                                      {vendor.vendor.lastName}
                                    </p>
                                    {vendor.boothNumber && (
                                      <p className="text-xs text-gray-500">
                                        Booth: {vendor.boothNumber}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty vendor state */}
                        {event.vendors.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">No vendor applications yet</p>
                            {event.isVendorApplicationOpen ? (
                              <p className="text-xs mt-1">
                                Share your event to attract vendors
                              </p>
                            ) : (
                              <p className="text-xs mt-1 text-amber-600">
                                Vendor applications are currently closed
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}

            {/* Empty State - No Events */}
            {initialEvents.length === 0 && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No events yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Create your first event to start connecting with vendors and
                    customers
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/events/setup/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Event
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Vendor Events Tab */}
        {activeTab === "vendor" && (
          <>
            {vendorEvents.length > 0 ? (
              <div className="space-y-3">
                {vendorEvents.map((vendorship) => (
                  <Card key={vendorship.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/events/${vendorship.event.id}`}
                              className="font-semibold text-base sm:text-lg hover:underline truncate"
                            >
                              {vendorship.event.name}
                            </Link>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                VENDOR_STATUS_COLORS[vendorship.status]
                              }`}
                            >
                              {vendorship.status}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex-shrink-0 sm:hidden">
                              {EVENT_TYPE_LABELS[vendorship.event.eventType]}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{formatDate(vendorship.event.startDate)}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{vendorship.event.locationName}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 flex-shrink-0" />
                              {vendorship.event.approvedVendorCount} vendors
                            </span>
                          </div>
                          {vendorship.boothNumber && (
                            <p className="text-sm text-gray-500 mt-1">
                              Booth: {vendorship.boothNumber}
                            </p>
                          )}
                          {vendorship.responseNote && (
                            <p className="text-sm text-gray-500 mt-1">
                              Note: {vendorship.responseNote}
                            </p>
                          )}
                        </div>
                        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            {EVENT_TYPE_LABELS[vendorship.event.eventType]}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Not participating in any events
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Browse upcoming events to apply as a vendor
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/events">
                      <Calendar className="h-4 w-4 mr-2" />
                      Browse Events
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
