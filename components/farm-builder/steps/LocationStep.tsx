"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MapViewEditable from "@/components/MapViewEditable";
import { FarmFormData } from "../FarmBuilderWizard";
import { MapPin } from "lucide-react";

interface StepProps {
  formData: Partial<FarmFormData>;
  updateFormData: (data: Partial<FarmFormData>) => void;
}

export function LocationStep({ formData, updateFormData }: StepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Find Us
          </CardTitle>
          <CardDescription>
            Help customers locate your farm
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="locationName">
              Location Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="locationName"
              value={formData.locationName || ""}
              onChange={(e) => updateFormData({ locationName: e.target.value })}
              placeholder="e.g., 123 Farm Road, Austin, TX"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationGuide">
              Directions/Parking Instructions <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="locationGuide"
              value={formData.locationGuide || ""}
              onChange={(e) => updateFormData({ locationGuide: e.target.value })}
              placeholder="Provide helpful directions, parking instructions, or what visitors should look for..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Pin Your Location on Map</Label>
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <MapViewEditable
                latitude={formData.latitude || 30.2672}
                longitude={formData.longitude || -97.7431}
                locationName={formData.locationName || ""}
                onLocationChange={(lat: number, lng: number) => {
                  updateFormData({ latitude: lat, longitude: lng });
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Click on the map to set your farm's location
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="wholesaleInfo">Wholesale Information</Label>
            <Textarea
              id="wholesaleInfo"
              value={formData.wholesaleInfo || ""}
              onChange={(e) => updateFormData({ wholesaleInfo: e.target.value })}
              placeholder="Information for restaurants, retailers, or other wholesale buyers..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
