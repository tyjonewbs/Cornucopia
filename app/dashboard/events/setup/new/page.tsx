import { Card } from "@/components/ui/card";
import { unstable_noStore as noStore } from "next/cache";
import { EventForm } from "@/components/form/EventForm";
import { getUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function NewEventPage() {
  noStore();

  try {
    const user = await getUser();

    if (!user) {
      redirect("/");
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
          <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
          <p className="text-muted-foreground">
            Set up your event and start accepting vendor applications.
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
          />
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error in NewEventPage:", error);

    return (
      <div>
        <div className="mb-8">
          <Link href="/dashboard/events">
            <Button variant="ghost" className="gap-2 pl-0 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Error Loading Page</h1>
          <p className="text-muted-foreground">
            There was an error loading this page. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
