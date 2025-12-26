"use client";

import { createDeliveryZone, updateDeliveryZone } from "@/app/actions/delivery-zones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DeliveryZone, ScheduledDate } from "@/types/delivery";
import { Calendar, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface DeliveryZoneFormProps {
  deliveryZone?: DeliveryZone;
  onSuccess?: () => void;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const TIME_WINDOWS = [
  "Morning (8am - 12pm)",
  "Afternoon (12pm - 5pm)",
  "Evening (5pm - 8pm)",
  "All Day"
];

export function DeliveryZoneForm({ deliveryZone, onSuccess }: DeliveryZoneFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: deliveryZone?.name || "",
    deliveryFee: deliveryZone?.deliveryFee ? (deliveryZone.deliveryFee / 100).toFixed(2) : "",
    freeDeliveryThreshold: deliveryZone?.freeDeliveryThreshold ? (deliveryZone.freeDeliveryThreshold / 100).toFixed(2) : "",
    minimumOrder: deliveryZone?.minimumOrder ? (deliveryZone.minimumOrder / 100).toFixed(2) : "",
    deliveryDays: deliveryZone?.deliveryDays || [],
  });

  const [deliveryType, setDeliveryType] = useState<'RECURRING' | 'ONE_TIME'>(
    deliveryZone?.deliveryType || 'ONE_TIME'
  );
  const [isActive, setIsActive] = useState(deliveryZone?.isActive ?? true);
  const [description, setDescription] = useState(deliveryZone?.description || "");

  const [zipCodes, setZipCodes] = useState<string[]>(deliveryZone?.zipCodes || []);
  const [currentZipCode, setCurrentZipCode] = useState("");

  // One-time delivery date (single date per zone)
  const [newDate, setNewDate] = useState(
    deliveryZone?.scheduledDates?.[0]?.date || ""
  );
  const [newTimeWindow, setNewTimeWindow] = useState(
    deliveryZone?.scheduledDates?.[0]?.timeWindow || ""
  );
  const [newNote, setNewNote] = useState(
    deliveryZone?.scheduledDates?.[0]?.note || ""
  );

  const handleAddZipCode = () => {
    const input = currentZipCode.trim();
    if (!input) return;

    // Support comma or space separated ZIP codes
    const potentialZips = input.split(/[\s,]+/).filter(z => z);
    const validZips: string[] = [];
    const invalidZips: string[] = [];

    potentialZips.forEach(zipCode => {
      if (/^\d{5}$/.test(zipCode)) {
        if (!zipCodes.includes(zipCode)) {
          validZips.push(zipCode);
        }
      } else {
        invalidZips.push(zipCode);
      }
    });

    if (validZips.length > 0) {
      setZipCodes([...zipCodes, ...validZips]);
      setCurrentZipCode("");
    }

    if (invalidZips.length > 0) {
      toast.error(`Invalid ZIP code(s): ${invalidZips.join(', ')}`);
    }
  };

  const handleRemoveZipCode = (zipCode: string) => {
    setZipCodes(zipCodes.filter(z => z !== zipCode));
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      deliveryDays: prev.deliveryDays.includes(day)
        ? prev.deliveryDays.filter(d => d !== day)
        : [...prev.deliveryDays, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error("Please enter a zone name");
      return;
    }

    if (zipCodes.length === 0) {
      toast.error("Please add at least one ZIP code");
      return;
    }

    if (deliveryType === 'RECURRING' && formData.deliveryDays.length === 0) {
      toast.error("Please select at least one delivery day for recurring deliveries");
      return;
    }

    if (deliveryType === 'ONE_TIME' && !newDate) {
      toast.error("Please select a delivery date for one-time deliveries");
      return;
    }

    // Validate the date is in the future
    if (deliveryType === 'ONE_TIME' && newDate) {
      const date = new Date(newDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (date < today) {
        toast.error("Please select a future date");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("description", description);
      submitData.append("zipCodes", JSON.stringify(zipCodes));
      submitData.append("cities", JSON.stringify([]));
      submitData.append("states", JSON.stringify([]));
      submitData.append("deliveryFee", Math.round(parseFloat(formData.deliveryFee || "0") * 100).toString());
      
      if (formData.freeDeliveryThreshold) {
        submitData.append("freeDeliveryThreshold", Math.round(parseFloat(formData.freeDeliveryThreshold) * 100).toString());
      }
      
      if (formData.minimumOrder) {
        submitData.append("minimumOrder", Math.round(parseFloat(formData.minimumOrder) * 100).toString());
      }
      
      submitData.append("deliveryType", deliveryType);
      
      // Add delivery days for recurring or empty array for one-time
      submitData.append("deliveryDays", JSON.stringify(deliveryType === 'RECURRING' ? formData.deliveryDays : []));
      
      // Add scheduled dates for one-time or null for recurring
      if (deliveryType === 'ONE_TIME') {
        const scheduledDate: ScheduledDate = {
          date: newDate,
          timeWindow: newTimeWindow || undefined,
          note: newNote || undefined,
        };
        submitData.append("scheduledDates", JSON.stringify([scheduledDate]));
      }
      
      submitData.append("isActive", isActive.toString());

      let result;
      if (deliveryZone) {
        result = await updateDeliveryZone(deliveryZone.id, submitData);
      } else {
        result = await createDeliveryZone(submitData);
      }

      if (result.success) {
        toast.success(deliveryZone ? "Delivery zone updated successfully" : "Delivery zone created successfully");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/delivery-zones");
        }
      } else {
        // Log the full error for debugging
        console.error("Delivery zone save error:", result);
        
        // Show detailed error message
        if (result.issues && Array.isArray(result.issues)) {
          const errorMessages = result.issues.map((issue: any) => 
            `${issue.path?.join('.') || 'Field'}: ${issue.message}`
          ).join(', ');
          toast.error(`Validation failed: ${errorMessages}`);
        } else {
          toast.error(result.error || "Failed to save delivery zone");
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{deliveryZone ? "Edit Delivery Zone" : "Create Delivery Zone"}</CardTitle>
          <CardDescription>
            Define the areas where you offer delivery and set your delivery terms
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Zone Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Zone Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Austin Metro Area"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this delivery zone..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Coverage Areas */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Coverage ZIP Codes *</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enter one or more ZIP codes separated by commas or spaces (e.g., "78701, 78702, 78703")
              </p>
            </div>
            
            {/* ZIP Codes */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {zipCodes.map((zipCode) => (
                  <div key={zipCode} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md">
                    <span>{zipCode}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveZipCode(zipCode)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., 78701 or 78701, 78702, 78703"
                  value={currentZipCode}
                  onChange={(e) => setCurrentZipCode(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddZipCode())}
                  onBlur={handleAddZipCode}
                />
                <Button type="button" onClick={handleAddZipCode} variant="outline">
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Delivery Fee *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="deliveryFee"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.deliveryFee}
                    onChange={(e) => setFormData({ ...formData, deliveryFee: e.target.value })}
                    className="pl-7"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="freeDeliveryThreshold">Free Delivery Over (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="freeDeliveryThreshold"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.freeDeliveryThreshold}
                    onChange={(e) => setFormData({ ...formData, freeDeliveryThreshold: e.target.value })}
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumOrder">Minimum Order (Optional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="minimumOrder"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.minimumOrder}
                    onChange={(e) => setFormData({ ...formData, minimumOrder: e.target.value })}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Type Selector */}
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-2">
              <Label>Delivery Type *</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryType('RECURRING')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    deliveryType === 'RECURRING'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔄</div>
                    <div className="font-semibold">Recurring</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Weekly schedule
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('ONE_TIME')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    deliveryType === 'ONE_TIME'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📅</div>
                    <div className="font-semibold">One-Time</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Specific dates
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Conditional Content Based on Delivery Type */}
            {deliveryType === 'RECURRING' ? (
              <div className="space-y-2 p-4 bg-secondary/20 rounded-lg">
                <Label>Delivery Days *</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Which days do you regularly deliver to this area?
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={day}
                        checked={formData.deliveryDays.includes(day)}
                        onChange={() => handleDayToggle(day)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <label
                        htmlFor={day}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {day}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-secondary/20 rounded-lg">
                <div>
                  <Label>Scheduled Delivery Date *</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select the date when you'll be delivering to this area
                  </p>
                </div>

                {/* Date Input Fields */}
                <div className="grid gap-3">
                  <div>
                    <Label htmlFor="newDate" className="text-sm">Date *</Label>
                    <Input
                      id="newDate"
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newTimeWindow" className="text-sm">Time Window (Optional)</Label>
                    <select
                      id="newTimeWindow"
                      value={newTimeWindow}
                      onChange={(e) => setNewTimeWindow(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select time window...</option>
                      {TIME_WINDOWS.map((window) => (
                        <option key={window} value={window}>
                          {window}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="newNote" className="text-sm">Note (Optional)</Label>
                    <Input
                      id="newNote"
                      placeholder="e.g., City trip for farmer's market"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      maxLength={500}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium leading-none cursor-pointer"
            >
              Zone is active (customers can see and use this delivery zone)
            </label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : deliveryZone ? "Save Changes" : "Create Zone"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
