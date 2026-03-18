import prisma from "@/lib/db";
import { getUser } from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Navigation,
  Globe,
  Mail,
  Phone,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import MapView from "@/components/MapView";
import { Separator } from "@/components/ui/separator";
import { EventType } from "@prisma/client";
import VendorApplication from "./vendor-application";

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  FARMERS_MARKET: "Farmers Market",
  FARM_TOUR: "Farm Tour",
  WORKSHOP: "Workshop",
  FESTIVAL: "Festival",
  POP_UP: "Pop-Up",
  SEASONAL: "Seasonal",
  OTHER: "Other",
};

async function getData(encodedId: string, userId?: string | null) {
  try {
    const id = decodeURIComponent(encodedId);

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        vendors: {
          where: { status: "APPROVED" },
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
      },
    });

    if (!event) return null;

    // Fetch the current user's vendor application if logged in
    let userVendorApplication: {
      status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
      responseNote: string | null;
    } | null = null;

    if (userId) {
      const application = await prisma.eventVendor.findUnique({
        where: { eventId_vendorId: { eventId: id, vendorId: userId } },
        select: { status: true, responseNote: true },
      });
      if (application) {
        userVendorApplication = {
          status: application.status as "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN",
          responseNote: application.responseNote,
        };
      }
    }

    return {
      id: event.id,
      name: event.name,
      description: event.description,
      shortDescription: event.shortDescription,
      images: event.images,
      tags: event.tags,
      eventType: event.eventType,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      isRecurring: event.isRecurring,
      latitude: event.latitude,
      longitude: event.longitude,
      locationName: event.locationName,
      locationGuide: event.locationGuide,
      streetAddress: event.streetAddress,
      city: event.city,
      state: event.state,
      zipCode: event.zipCode,
      maxVendors: event.maxVendors,
      maxAttendees: event.maxAttendees,
      vendorFee: event.vendorFee,
      isVendorApplicationOpen: event.isVendorApplicationOpen,
      website: event.website,
      socialMedia: event.socialMedia,
      contactEmail: event.contactEmail,
      contactPhone: event.contactPhone,
      createdAt: event.createdAt.toISOString(),
      organizer: event.organizer,
      vendors: event.vendors.map((v) => ({
        id: v.id,
        boothNumber: v.boothNumber,
        vendor: v.vendor,
      })),
      userVendorApplication,
    };
  } catch {
    return null;
  }
}

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;
  const user = await getUser();
  const event = await getData(id, user?.id);

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <h1 className="text-2xl font-bold text-center">Event not found</h1>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isSameDay =
    startDate.toDateString() === endDate.toDateString();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Carousel */}
          {event.images && event.images.length > 0 && (
            <div className="relative">
              <Carousel className="w-full">
                <CarouselContent>
                  {event.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden">
                        <Image
                          src={image}
                          alt={`${event.name} ${index + 1}`}
                          fill
                          className="object-cover"
                          priority={index === 0}
                          sizes="(max-width: 1024px) 100vw, 66vw"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {event.images.length > 1 && (
                  <>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </>
                )}
              </Carousel>
            </div>
          )}

          {/* Name, Type Badge, and Tags */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold">{event.name}</h1>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                {EVENT_TYPE_LABELS[event.eventType]}
              </span>
            </div>
            {event.shortDescription && (
              <p className="text-lg text-muted-foreground">
                {event.shortDescription}
              </p>
            )}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="bg-secondary px-2 py-1 rounded-md text-xs"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Date & Time Card */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">When</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    {isSameDay ? (
                      <p className="font-medium">
                        {startDate.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    ) : (
                      <p className="font-medium">
                        {startDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        -{" "}
                        {endDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <p className="font-medium">
                    {startDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {endDate.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {event.isRecurring && (
                  <p className="text-sm text-muted-foreground ml-8">
                    This is a recurring event
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">About This Event</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </CardContent>
          </Card>

          {/* Vendors */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Vendors</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {event.vendors.length} vendor
                  {event.vendors.length !== 1 ? "s" : ""}
                  {event.maxVendors ? ` / ${event.maxVendors} max` : ""}
                </span>
              </div>
            </div>

            {event.vendors.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {event.vendors.map((v) => (
                  <Card key={v.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      {v.vendor.profileImage ? (
                        <Image
                          src={v.vendor.profileImage}
                          alt=""
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-medium text-amber-800">
                          {v.vendor.firstName?.[0] || "?"}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {v.vendor.firstName} {v.vendor.lastName}
                        </p>
                        {v.boothNumber && (
                          <p className="text-xs text-muted-foreground">
                            Booth {v.boothNumber}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No vendors confirmed yet</p>
                  {event.isVendorApplicationOpen && (
                    <p className="text-sm mt-1">
                      Vendor applications are open!
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organizer Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Organized By</h3>
              <div className="flex items-center gap-3">
                {event.organizer.profileImage ? (
                  <Image
                    src={event.organizer.profileImage}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-lg font-medium text-amber-800">
                    {event.organizer.firstName?.[0] || "?"}
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {event.organizer.firstName} {event.organizer.lastName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Location</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">{event.locationName}</p>
                    {event.streetAddress && (
                      <p className="text-sm text-muted-foreground">
                        {event.streetAddress}
                        {event.city && `, ${event.city}`}
                        {event.state && `, ${event.state}`}
                        {event.zipCode && ` ${event.zipCode}`}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.locationGuide}
                    </p>
                  </div>
                </div>
                <div className="aspect-video relative rounded-lg overflow-hidden">
                  <MapView
                    latitude={event.latitude}
                    longitude={event.longitude}
                    locationName={event.locationName}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Navigation className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Coordinates</p>
                    <p className="font-medium">
                      {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
                {event.isVendorApplicationOpen && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-green-600">
                        Accepting vendor applications
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vendor Application Card */}
          <VendorApplication
            eventId={event.id}
            userId={user?.id || null}
            organizerId={event.organizer.id}
            isVendorApplicationOpen={event.isVendorApplicationOpen}
            maxVendors={event.maxVendors}
            currentVendorCount={event.vendors.length}
            existingStatus={event.userVendorApplication?.status || null}
            existingResponseNote={event.userVendorApplication?.responseNote || null}
            vendorFee={event.vendorFee}
          />

          {/* Contact Card */}
          {(event.contactEmail ||
            event.contactPhone ||
            event.website ||
            (event.socialMedia && event.socialMedia.length > 0)) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Contact</h3>
                <div className="space-y-4">
                  {event.contactEmail && (
                    <a
                      href={`mailto:${event.contactEmail}`}
                      className="flex items-center gap-3 text-primary hover:underline"
                    >
                      <Mail className="h-5 w-5" />
                      <span>{event.contactEmail}</span>
                    </a>
                  )}
                  {event.contactPhone && (
                    <a
                      href={`tel:${event.contactPhone}`}
                      className="flex items-center gap-3 text-primary hover:underline"
                    >
                      <Phone className="h-5 w-5" />
                      <span>{event.contactPhone}</span>
                    </a>
                  )}
                  {event.website && (
                    <a
                      href={event.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-primary hover:underline"
                    >
                      <Globe className="h-5 w-5" />
                      <span>Visit website</span>
                    </a>
                  )}
                  {event.socialMedia &&
                    event.socialMedia.map((link, index) => {
                      let icon = <Globe className="h-5 w-5" />;
                      let platform = "Social Media";

                      if (link.includes("twitter.com") || link.includes("x.com")) {
                        icon = <Twitter className="h-5 w-5" />;
                        platform = "Twitter";
                      } else if (link.includes("instagram.com")) {
                        icon = <Instagram className="h-5 w-5" />;
                        platform = "Instagram";
                      } else if (link.includes("facebook.com")) {
                        icon = <Facebook className="h-5 w-5" />;
                        platform = "Facebook";
                      } else if (link.includes("youtube.com")) {
                        icon = <Youtube className="h-5 w-5" />;
                        platform = "YouTube";
                      } else if (link.includes("linkedin.com")) {
                        icon = <Linkedin className="h-5 w-5" />;
                        platform = "LinkedIn";
                      }

                      return (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 text-primary hover:underline"
                        >
                          {icon}
                          <span>{platform}</span>
                        </a>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
