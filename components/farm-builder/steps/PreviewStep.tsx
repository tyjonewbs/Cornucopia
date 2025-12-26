"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FarmFormData } from "../FarmBuilderWizard";
import { Eye, MapPin, Instagram, Facebook, Globe } from "lucide-react";

interface StepProps {
  formData: Partial<FarmFormData>;
  updateFormData: (data: Partial<FarmFormData>) => void;
}

export function PreviewStep({ formData, updateFormData }: StepProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview Your Farm Page
          </CardTitle>
          <CardDescription>
            Here's a summary of what you've created. You can go back to any step to make changes.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Mobile Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile Preview</CardTitle>
          <CardDescription>How your page will look on mobile devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm mx-auto border-4 border-gray-300 rounded-2xl overflow-hidden bg-white shadow-xl">
            {/* Hero Image */}
            {formData.images && formData.images.length > 0 ? (
              <div className="relative h-48 bg-gradient-to-br from-green-600 to-green-800">
                <img src={formData.images[0]} alt="Farm hero" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h1 className="text-white text-2xl font-bold">{formData.name || "Your Farm Name"}</h1>
                  {formData.tagline && (
                    <p className="text-white/90 text-sm">{formData.tagline}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center">
                <div className="text-center text-white">
                  <h1 className="text-2xl font-bold">{formData.name || "Your Farm Name"}</h1>
                  {formData.tagline && <p className="text-sm mt-2">{formData.tagline}</p>}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Social Links */}
              {(formData.instagramHandle || formData.facebookPageUrl || formData.website) && (
                <div className="flex gap-2 justify-center pb-4 border-b">
                  {formData.instagramHandle && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Instagram className="h-4 w-4" />
                      <span>@{formData.instagramHandle}</span>
                    </div>
                  )}
                  {formData.facebookPageUrl && (
                    <Facebook className="h-5 w-5 text-gray-600" />
                  )}
                  {formData.website && (
                    <Globe className="h-5 w-5 text-gray-600" />
                  )}
                </div>
              )}

              {/* Description */}
              {formData.description && (
                <div>
                  <h3 className="font-semibold mb-2">About Us</h3>
                  <p className="text-sm text-gray-700 line-clamp-3">{formData.description}</p>
                </div>
              )}

              {/* Stats */}
              {(formData.foundedYear || formData.acreage || formData.generationNumber) && (
                <div className="flex gap-4 text-center py-2 bg-gray-50 rounded-lg">
                  {formData.foundedYear && (
                    <div className="flex-1">
                      <div className="text-xs text-gray-600">Since</div>
                      <div className="font-semibold">{formData.foundedYear}</div>
                    </div>
                  )}
                  {formData.acreage && (
                    <div className="flex-1">
                      <div className="text-xs text-gray-600">Acres</div>
                      <div className="font-semibold">{formData.acreage}</div>
                    </div>
                  )}
                  {formData.generationNumber && (
                    <div className="flex-1">
                      <div className="text-xs text-gray-600">Generation</div>
                      <div className="font-semibold">{formData.generationNumber}rd</div>
                    </div>
                  )}
                </div>
              )}

              {/* Location */}
              {formData.locationName && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-1 text-gray-600" />
                  <span className="text-gray-700">{formData.locationName}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ready to Publish?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">✓ What's included:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                {formData.name && <li>✓ Farm name and description</li>}
                {formData.story && <li>✓ Your farm story</li>}
                {formData.images && formData.images.length > 0 && <li>✓ {formData.images.length} photos</li>}
                {formData.videoUrl && <li>✓ Farm tour video</li>}
                {formData.farmingPractices && <li>✓ Farming practices</li>}
                {(formData.instagramHandle || formData.facebookPageUrl || formData.website) && <li>✓ Social media links</li>}
                {formData.locationName && <li>✓ Farm location and directions</li>}
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              Click "Publish Farm Page" below to make your page live. You can always edit it later from your dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
