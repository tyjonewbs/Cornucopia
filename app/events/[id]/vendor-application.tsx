"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ApplyAsEventVendor,
  WithdrawEventVendorApplication,
} from "@/app/actions/event-vendors";
import { Users, CheckCircle, Clock, XCircle, LogIn } from "lucide-react";
import Link from "next/link";

type VendorStatus = "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN" | null;

interface VendorApplicationProps {
  eventId: string;
  userId: string | null;
  organizerId: string;
  isVendorApplicationOpen: boolean;
  maxVendors: number | null;
  currentVendorCount: number;
  existingStatus: VendorStatus;
  existingResponseNote: string | null;
  vendorFee: number | null;
}

export default function VendorApplication({
  eventId,
  userId,
  organizerId,
  isVendorApplicationOpen,
  maxVendors,
  currentVendorCount,
  existingStatus,
  existingResponseNote,
  vendorFee,
}: VendorApplicationProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOrganizer = userId === organizerId;
  const isFull = maxVendors !== null && currentVendorCount >= maxVendors;

  async function handleApply() {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const result = await ApplyAsEventVendor(
      eventId,
      userId,
      message || undefined
    );

    setLoading(false);
    if (result.success) {
      setShowForm(false);
      setMessage("");
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
  }

  async function handleWithdraw() {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const result = await WithdrawEventVendorApplication(eventId, userId);

    setLoading(false);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || "Something went wrong");
    }
  }

  // Not logged in
  if (!userId) {
    if (!isVendorApplicationOpen) return null;
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3">Vendor Application</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sign in to apply as a vendor for this event.
          </p>
          <Button asChild className="w-full">
            <Link href="/login">
              <LogIn className="h-4 w-4 mr-2" />
              Sign in to apply
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Organizer sees nothing here (they manage from dashboard)
  if (isOrganizer) return null;

  // Already has an application
  if (existingStatus) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3">Your Application</h3>

          {existingStatus === "PENDING" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Application pending</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The organizer will review your application.
              </p>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleWithdraw}
                disabled={loading}
              >
                {loading ? "Withdrawing..." : "Withdraw Application"}
              </Button>
            </div>
          )}

          {existingStatus === "APPROVED" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Approved</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You&apos;re confirmed as a vendor for this event.
              </p>
              {existingResponseNote && (
                <p className="text-sm mt-2 p-2 bg-muted rounded">
                  <span className="font-medium">Organizer note:</span>{" "}
                  {existingResponseNote}
                </p>
              )}
            </div>
          )}

          {existingStatus === "REJECTED" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Not approved</span>
              </div>
              {existingResponseNote && (
                <p className="text-sm mt-2 p-2 bg-muted rounded">
                  <span className="font-medium">Organizer note:</span>{" "}
                  {existingResponseNote}
                </p>
              )}
            </div>
          )}

          {existingStatus === "WITHDRAWN" && isVendorApplicationOpen && !isFull && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You previously withdrew your application. You can apply again.
              </p>
              <Button onClick={() => setShowForm(true)} className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Re-apply as Vendor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // No existing application — show apply option
  if (!isVendorApplicationOpen) return null;

  if (isFull) {
    return (
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3">Vendor Application</h3>
          <p className="text-sm text-muted-foreground">
            This event has reached its maximum number of vendors.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-3">Vendor Application</h3>

        {!showForm ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Interested in being a vendor at this event?
              {vendorFee !== null && vendorFee > 0 && (
                <> Vendor fee: <span className="font-medium">${vendorFee}</span></>
              )}
            </p>
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Apply as Vendor
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Message to organizer (optional)
              </label>
              <Textarea
                placeholder="Tell the organizer about yourself and what you'd like to sell..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>
            {vendorFee !== null && vendorFee > 0 && (
              <p className="text-sm text-muted-foreground">
                Vendor fee: <span className="font-medium">${vendorFee}</span>
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleApply}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Submitting..." : "Submit Application"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
