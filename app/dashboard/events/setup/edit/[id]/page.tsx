import { Card } from "@/components/ui/card";
import { unstable_noStore as noStore } from "next/cache";
import { EventForm } from "@/components/form/EventForm";
import { getUser } from "@/lib/auth";
import prisma from "@/lib/db";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

async function getEvent(id: string, userId: string) {
  const event = await prisma.event.findFirst({
    where: { id, organizerId: userId },
  });
  if (!event) return null;

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
  };
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  const { id } = await params;

  const user = await getUser();
  if (!user) {
    redirect("/");
  }

  const event = await getEvent(id, user.id.toString());
  if (!event) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/dashboard/events">
          <Button variant="ghost" className="gap-2 pl-0 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Edit Event</h1>
        <p className="text-muted-foreground">
          Update the details for your event.
        </p>
      </div>

      <Card className="mb-8">
        <EventForm
          userId={user.id.toString()}
          userEmail={user.email || ""}
          userFirstName={
            user.user_metadata?.first_name ||
            user.user_metadata?.firstName ||
            (user.user_metadata?.name
              ? String(user.user_metadata.name).split(" ")[0]
              : "") ||
            "User"
          }
          userLastName={
            user.user_metadata?.last_name ||
            user.user_metadata?.lastName ||
            (user.user_metadata?.name
              ? String(user.user_metadata.name).split(" ")[1]
              : "") ||
            ""
          }
          userProfileImage={
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            ""
          }
          event={event}
        />
      </Card>
    </div>
  );
}
