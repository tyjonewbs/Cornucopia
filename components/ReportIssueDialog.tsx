"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

const ISSUE_TYPES = [
  { value: "NOT_DELIVERED", label: "Item Not Delivered" },
  { value: "WRONG_ITEMS", label: "Wrong Items Received" },
  { value: "DAMAGED", label: "Item Arrived Damaged" },
  { value: "POOR_QUALITY", label: "Poor Quality" },
  { value: "LATE", label: "Late Delivery" },
  { value: "OTHER", label: "Other" },
] as const;

interface ReportIssueDialogProps {
  orderId: string;
  orderNumber: string;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function ReportIssueDialog({
  orderId,
  orderNumber,
  onSuccess,
  children,
}: ReportIssueDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!issueType) {
      toast.error("Please select an issue type");
      return;
    }

    if (description.length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/orders/${orderId}/report-issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueType, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to report issue");
        return;
      }

      toast.success("Issue reported successfully", {
        description: "We'll look into this and get back to you.",
      });

      setIssueType("");
      setDescription("");
      setIsOpen(false);
      onSuccess?.();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            Let us know about a problem with order #{orderNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="issueType">Issue Type *</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger>
                <SelectValue placeholder="Select an issue type" />
              </SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Please describe the issue in detail (min 10 characters)..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/10 characters minimum
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
