"use client";

import React from "react";
import { CreateEvent, UpdateEvent } from "@/app/actions/event";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EventType } from "@prisma/client";

interface EventFormProps {
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userProfileImage: string;
  event?: {
    id: string;
    name: string;
    description: string;
    shortDescription?: string | null;
    images: string[];
    tags: string[];
    eventType: string;
    startDate: string;
    endDate: string;
    isRecurring?: boolean;
    latitude: number;
    longitude: number;
    locationName?: string;
    locationGuide: string;
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    maxVendors?: number | null;
    maxAttendees?: number | null;
    vendorFee?: number | null;
    isVendorApplicationOpen?: boolean;
    website?: string | null;
    socialMedia?: string[];
    contactEmail?: string | null;
    contactPhone?: string | null;
  };
  onSuccess?: () => void;
}

interface FormState {
  values: {
    name: string;
    description: string;
    shortDescription: string;
    eventType: string;
    startDate: string;
    endDate: string;
    isRecurring: boolean;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    locationGuide: string;
    latitude: string;
    longitude: string;
    maxVendors: string;
    maxAttendees: string;
    vendorFee: string;
    isVendorApplicationOpen: boolean;
    tags: string[];
    currentTag: string;
    website: string;
    socialMedia: string[];
    currentSocialMedia: string;
    contactEmail: string;
    contactPhone: string;
  };
  errors: Record<string, string | undefined>;
}

const EVENT_TYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: "FARMERS_MARKET", label: "Farmers Market" },
  { value: "FARM_TOUR", label: "Farm Tour" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "FESTIVAL", label: "Festival" },
  { value: "POP_UP", label: "Pop-Up" },
  { value: "SEASONAL", label: "Seasonal" },
  { value: "OTHER", label: "Other" },
];

function toDatetimeLocal(isoString: string): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

const validateField = (
  name: string,
  value: string | string[] | boolean
): string | undefined => {
  if (Array.isArray(value) || typeof value === "boolean") return undefined;

  if (!value || value.trim() === "") {
    const optionalFields = [
      "website",
      "streetAddress",
      "city",
      "state",
      "zipCode",
      "shortDescription",
      "maxVendors",
      "maxAttendees",
      "vendorFee",
      "contactEmail",
      "contactPhone",
      "currentTag",
      "currentSocialMedia",
    ];
    if (optionalFields.includes(name)) return undefined;
    return "This field is required";
  }

  switch (name) {
    case "name":
      return value.length < 3
        ? "Name must be at least 3 characters long"
        : undefined;
    case "description":
      return value.length < 10
        ? "Must be at least 10 characters long"
        : undefined;
    case "locationGuide":
      return value.length < 10
        ? "Must provide detailed directions"
        : undefined;
    case "latitude": {
      const lat = parseFloat(value);
      if (isNaN(lat) || lat < -90 || lat > 90)
        return "Must be between -90 and 90";
      return undefined;
    }
    case "longitude": {
      const lng = parseFloat(value);
      if (isNaN(lng) || lng < -180 || lng > 180)
        return "Must be between -180 and 180";
      return undefined;
    }
    case "website":
      try {
        if (value) new URL(value);
        return undefined;
      } catch {
        return "Must be a valid URL";
      }
    case "contactEmail":
      if (value && !value.includes("@")) return "Must be a valid email";
      return undefined;
    default:
      return undefined;
  }
};

export function EventForm({
  userId,
  userEmail,
  userFirstName,
  userLastName,
  userProfileImage,
  event,
  onSuccess,
}: EventFormProps): React.JSX.Element {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(event?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    values: {
      name: event?.name || "",
      description: event?.description || "",
      shortDescription: event?.shortDescription || "",
      eventType: event?.eventType || "FARMERS_MARKET",
      startDate: event?.startDate ? toDatetimeLocal(event.startDate) : "",
      endDate: event?.endDate ? toDatetimeLocal(event.endDate) : "",
      isRecurring: event?.isRecurring || false,
      streetAddress: event?.streetAddress || "",
      city: event?.city || "",
      state: event?.state || "",
      zipCode: event?.zipCode || "",
      locationGuide: event?.locationGuide || "",
      latitude: event?.latitude?.toString() || "",
      longitude: event?.longitude?.toString() || "",
      maxVendors: event?.maxVendors?.toString() || "",
      maxAttendees: event?.maxAttendees?.toString() || "",
      vendorFee: event?.vendorFee?.toString() || "",
      isVendorApplicationOpen: event?.isVendorApplicationOpen ?? true,
      tags: event?.tags || [],
      currentTag: "",
      website: event?.website || "",
      socialMedia: event?.socialMedia || [],
      currentSocialMedia: "",
      contactEmail: event?.contactEmail || "",
      contactPhone: event?.contactPhone || "",
    },
    errors: {},
  });

  const handleFieldChange = (name: string, value: string | boolean) => {
    setFormState((prev) => {
      const newErrors = { ...prev.errors };
      if (typeof value === "string") {
        const error = validateField(name, value);
        if (error) {
          newErrors[name] = error;
        } else {
          delete newErrors[name];
        }
      }
      return {
        ...prev,
        values: { ...prev.values, [name]: value },
        errors: newErrors,
      };
    });
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const addTag = () => {
    const tag = formState.values.currentTag.trim();
    if (tag && !formState.values.tags.includes(tag)) {
      setFormState((prev) => ({
        ...prev,
        values: {
          ...prev.values,
          tags: [...prev.values.tags, tag],
          currentTag: "",
        },
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        tags: prev.values.tags.filter((t) => t !== tagToRemove),
      },
    }));
  };

  const addSocialMedia = () => {
    const url = formState.values.currentSocialMedia.trim();
    if (url && !formState.values.socialMedia.includes(url)) {
      try {
        new URL(url);
        setFormState((prev) => ({
          ...prev,
          values: {
            ...prev.values,
            socialMedia: [...prev.values.socialMedia, url],
            currentSocialMedia: "",
          },
        }));
      } catch {
        toast.error("Please enter a valid URL");
      }
    }
  };

  const removeSocialMedia = (urlToRemove: string) => {
    setFormState((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        socialMedia: prev.values.socialMedia.filter((u) => u !== urlToRemove),
      },
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {};
    let isValid = true;

    const requiredFields = [
      "name",
      "description",
      "locationGuide",
      "startDate",
      "endDate",
    ];
    requiredFields.forEach((name) => {
      const value =
        formState.values[name as keyof typeof formState.values];
      const error = validateField(name, value as string);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    // Validate location
    const hasLatitude = formState.values.latitude.trim() !== "";
    const hasLongitude = formState.values.longitude.trim() !== "";
    if (!hasLatitude || !hasLongitude) {
      newErrors.latitude = "Latitude and longitude are required";
      isValid = false;
    }

    // Validate images
    if (images.length === 0) {
      newErrors.images = "At least one image is required";
      isValid = false;
    }

    // Validate dates
    if (formState.values.startDate && formState.values.endDate) {
      if (
        new Date(formState.values.endDate) <=
        new Date(formState.values.startDate)
      ) {
        newErrors.endDate = "End date must be after start date";
        isValid = false;
      }
    }

    setFormState((prev) => ({ ...prev, errors: newErrors }));
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      if (event?.id) {
        formData.append("id", event.id);
      }

      formData.append("organizerId", userId);
      formData.append("userEmail", userEmail);
      formData.append("userFirstName", userFirstName);
      formData.append("userLastName", userLastName);
      formData.append("userProfileImage", userProfileImage);

      formData.append("name", formState.values.name);
      formData.append("description", formState.values.description);
      formData.append("shortDescription", formState.values.shortDescription);
      formData.append("eventType", formState.values.eventType);
      formData.append(
        "startDate",
        new Date(formState.values.startDate).toISOString()
      );
      formData.append(
        "endDate",
        new Date(formState.values.endDate).toISOString()
      );
      formData.append(
        "isRecurring",
        formState.values.isRecurring.toString()
      );
      formData.append("latitude", formState.values.latitude);
      formData.append("longitude", formState.values.longitude);
      formData.append("locationName", formState.values.name);
      formData.append("locationGuide", formState.values.locationGuide);
      formData.append("streetAddress", formState.values.streetAddress);
      formData.append("city", formState.values.city);
      formData.append("state", formState.values.state);
      formData.append("zipCode", formState.values.zipCode);
      if (formState.values.maxVendors)
        formData.append("maxVendors", formState.values.maxVendors);
      if (formState.values.maxAttendees)
        formData.append("maxAttendees", formState.values.maxAttendees);
      if (formState.values.vendorFee)
        formData.append("vendorFee", formState.values.vendorFee);
      formData.append(
        "isVendorApplicationOpen",
        formState.values.isVendorApplicationOpen.toString()
      );
      formData.append("website", formState.values.website);
      formData.append("contactEmail", formState.values.contactEmail);
      formData.append("contactPhone", formState.values.contactPhone);
      formData.append("images", JSON.stringify(images));
      formData.append("tags", JSON.stringify(formState.values.tags));
      formData.append(
        "socialMedia",
        JSON.stringify(formState.values.socialMedia)
      );

      const action = event?.id ? UpdateEvent : CreateEvent;
      const result = await action(
        { status: undefined, message: null },
        formData
      );

      if (result.success) {
        toast.success(
          event?.id ? "Event updated successfully" : "Event created successfully"
        );
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard/events");
          router.refresh();
        }
      } else {
        toast.error(result.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("An error occurred while saving the event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardHeader>
        <CardTitle>{event?.id ? "Edit Event" : "Create Event"}</CardTitle>
        <CardDescription>
          {event?.id
            ? "Update the details for your event"
            : "Fill in the details to create a new event"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Basic Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>

          <div>
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              value={formState.values.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="e.g., Saturday Farmers Market"
            />
            {formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">
                {formState.errors.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={formState.values.shortDescription}
              onChange={(e) =>
                handleFieldChange("shortDescription", e.target.value)
              }
              placeholder="A brief one-liner about your event"
              maxLength={500}
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formState.values.description}
              onChange={(e) =>
                handleFieldChange("description", e.target.value)
              }
              placeholder="Describe your event in detail..."
              rows={4}
            />
            {formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">
                {formState.errors.description}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="eventType">Event Type</Label>
            <select
              id="eventType"
              value={formState.values.eventType}
              onChange={(e) =>
                handleFieldChange("eventType", e.target.value)
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {EVENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Time */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Date & Time</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date & Time *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={formState.values.startDate}
                onChange={(e) =>
                  handleFieldChange("startDate", e.target.value)
                }
              />
              {formState.errors.startDate && (
                <p className="text-sm text-red-500 mt-1">
                  {formState.errors.startDate}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="endDate">End Date & Time *</Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={formState.values.endDate}
                onChange={(e) =>
                  handleFieldChange("endDate", e.target.value)
                }
              />
              {formState.errors.endDate && (
                <p className="text-sm text-red-500 mt-1">
                  {formState.errors.endDate}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formState.values.isRecurring}
              onChange={(e) =>
                handleFieldChange("isRecurring", e.target.checked)
              }
              className="rounded border-gray-300"
            />
            <Label htmlFor="isRecurring">This is a recurring event</Label>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Location</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="streetAddress">Street Address</Label>
              <Input
                id="streetAddress"
                value={formState.values.streetAddress}
                onChange={(e) =>
                  handleFieldChange("streetAddress", e.target.value)
                }
                placeholder="123 Main St"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formState.values.city}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                placeholder="Springfield"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formState.values.state}
                onChange={(e) => handleFieldChange("state", e.target.value)}
                placeholder="IL"
              />
            </div>
            <div>
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                value={formState.values.zipCode}
                onChange={(e) =>
                  handleFieldChange("zipCode", e.target.value)
                }
                placeholder="62701"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude *</Label>
              <Input
                id="latitude"
                value={formState.values.latitude}
                onChange={(e) =>
                  handleFieldChange("latitude", e.target.value)
                }
                placeholder="39.7817"
              />
              {formState.errors.latitude && (
                <p className="text-sm text-red-500 mt-1">
                  {formState.errors.latitude}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="longitude">Longitude *</Label>
              <Input
                id="longitude"
                value={formState.values.longitude}
                onChange={(e) =>
                  handleFieldChange("longitude", e.target.value)
                }
                placeholder="-89.6501"
              />
              {formState.errors.longitude && (
                <p className="text-sm text-red-500 mt-1">
                  {formState.errors.longitude}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="locationGuide">Location Guide *</Label>
            <Textarea
              id="locationGuide"
              value={formState.values.locationGuide}
              onChange={(e) =>
                handleFieldChange("locationGuide", e.target.value)
              }
              placeholder="Detailed directions to help visitors find the event..."
              rows={3}
            />
            {formState.errors.locationGuide && (
              <p className="text-sm text-red-500 mt-1">
                {formState.errors.locationGuide}
              </p>
            )}
          </div>
        </div>

        {/* Vendor Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Vendor Settings</h3>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isVendorApplicationOpen"
              checked={formState.values.isVendorApplicationOpen}
              onChange={(e) =>
                handleFieldChange(
                  "isVendorApplicationOpen",
                  e.target.checked
                )
              }
              className="rounded border-gray-300"
            />
            <Label htmlFor="isVendorApplicationOpen">
              Accept vendor applications
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxVendors">Max Vendors</Label>
              <Input
                id="maxVendors"
                type="number"
                value={formState.values.maxVendors}
                onChange={(e) =>
                  handleFieldChange("maxVendors", e.target.value)
                }
                placeholder="No limit"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                value={formState.values.maxAttendees}
                onChange={(e) =>
                  handleFieldChange("maxAttendees", e.target.value)
                }
                placeholder="No limit"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="vendorFee">Vendor Fee (cents)</Label>
              <Input
                id="vendorFee"
                type="number"
                value={formState.values.vendorFee}
                onChange={(e) =>
                  handleFieldChange("vendorFee", e.target.value)
                }
                placeholder="0"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Images *</h3>
          {formState.errors.images && (
            <p className="text-sm text-red-500">{formState.errors.images}</p>
          )}

          <ImageUpload
            bucket="event-images"
            onUploadComplete={(urls) => setImages((prev) => [...prev, ...urls])}
          />

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <div className="relative w-full h-0 pb-[75%] rounded-lg overflow-hidden">
                    <Image
                      src={img}
                      alt={`Event image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Tags</h3>

          <div className="flex gap-2">
            <Input
              value={formState.values.currentTag}
              onChange={(e) =>
                handleFieldChange("currentTag", e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Add a tag..."
            />
            <Button type="button" variant="outline" onClick={addTag}>
              Add
            </Button>
          </div>

          {formState.values.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formState.values.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-secondary px-3 py-1 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Contact & Links */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Contact & Links</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formState.values.contactEmail}
                onChange={(e) =>
                  handleFieldChange("contactEmail", e.target.value)
                }
                placeholder="events@example.com"
              />
              {formState.errors.contactEmail && (
                <p className="text-sm text-red-500 mt-1">
                  {formState.errors.contactEmail}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={formState.values.contactPhone}
                onChange={(e) =>
                  handleFieldChange("contactPhone", e.target.value)
                }
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formState.values.website}
              onChange={(e) => handleFieldChange("website", e.target.value)}
              placeholder="https://example.com"
            />
            {formState.errors.website && (
              <p className="text-sm text-red-500 mt-1">
                {formState.errors.website}
              </p>
            )}
          </div>

          <div>
            <Label>Social Media</Label>
            <div className="flex gap-2">
              <Input
                value={formState.values.currentSocialMedia}
                onChange={(e) =>
                  handleFieldChange("currentSocialMedia", e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSocialMedia();
                  }
                }}
                placeholder="https://instagram.com/..."
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSocialMedia}
              >
                Add
              </Button>
            </div>
            {formState.values.socialMedia.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formState.values.socialMedia.map((url) => (
                  <span
                    key={url}
                    className="bg-secondary px-3 py-1 rounded-full text-xs flex items-center gap-1 max-w-xs truncate"
                  >
                    {url}
                    <button
                      type="button"
                      onClick={() => removeSocialMedia(url)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : event?.id
            ? "Update Event"
            : "Create Event"}
        </Button>
      </CardFooter>
    </form>
  );
}
