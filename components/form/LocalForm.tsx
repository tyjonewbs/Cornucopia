"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ImageUpload";
import MapViewEditable from "@/components/MapViewEditable";
import { Local } from "@prisma/client";

interface LocalFormProps {
  initialData?: Partial<Local>;
  onSubmit: (data: FormData) => Promise<void>;
  buttonText?: string;
}

export function LocalForm({
  initialData,
  onSubmit,
  buttonText = "Create Profile"
}: LocalFormProps) {
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [latitude, setLatitude] = useState(initialData?.latitude || 0);
  const [longitude, setLongitude] = useState(initialData?.longitude || 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("images", JSON.stringify(images));
    formData.append("latitude", latitude.toString());
    formData.append("longitude", longitude.toString());
    formData.append("teamMembers", JSON.stringify({}));
    formData.append("certifications", JSON.stringify({}));
    formData.append("seasonalSchedule", JSON.stringify({}));
    formData.append("events", JSON.stringify({}));
    formData.append("operatingHours", JSON.stringify({}));
    await onSubmit(formData);
  };

  const handleImageUpload = (urls: string[]) => {
    setImages([...images, ...urls]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Farm/Ranch Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialData?.name || ""}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description || ""}
              required
            />
          </div>

          <div>
            <Label htmlFor="story">Our Story</Label>
            <Textarea
              id="story"
              name="story"
              defaultValue={initialData?.story || ""}
              required
            />
          </div>

          <div>
            <Label htmlFor="farmingPractices">Farming Practices</Label>
            <Textarea
              id="farmingPractices"
              name="farmingPractices"
              defaultValue={initialData?.farmingPractices || ""}
              required
            />
          </div>

          <div>
            <Label htmlFor="wholesaleInfo">Wholesale Information</Label>
            <Textarea
              id="wholesaleInfo"
              name="wholesaleInfo"
              defaultValue={initialData?.wholesaleInfo || ""}
            />
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={initialData?.website || ""}
            />
          </div>

          <div>
            <Label htmlFor="socialMedia">Social Media Links (one per line)</Label>
            <Textarea
              id="socialMedia"
              name="socialMedia"
              defaultValue={initialData?.socialMedia?.join("\n") || ""}
              onChange={(e) => {
                const links = e.target.value.split("\n").filter(Boolean);
                e.currentTarget.value = links.join("\n");
              }}
            />
          </div>

          <div>
            <Label>Location</Label>
            <div className="mt-2 space-y-4">
              <Input
                name="locationName"
                placeholder="Location Name"
                defaultValue={initialData?.locationName || ""}
                required
              />
              <Textarea
                name="locationGuide"
                placeholder="Location Guide/Instructions"
                defaultValue={initialData?.locationGuide || ""}
                required
              />
              <div className="h-[400px] rounded-lg overflow-hidden">
                <MapViewEditable
                  latitude={latitude}
                  longitude={longitude}
                  locationName={initialData?.locationName || ""}
                  onLocationChange={(lat: number, lng: number) => {
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Images</Label>
            <div className="mt-2">
              <ImageUpload
                onUploadComplete={handleImageUpload}
                maxFiles={5}
              />
              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Button type="submit" className="ml-auto">
        {buttonText}
      </Button>
    </form>
  );
}
