"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { FarmFormData } from "../FarmBuilderWizard";
import { Video } from "lucide-react";

interface StepProps {
  formData: Partial<FarmFormData>;
  updateFormData: (data: Partial<FarmFormData>) => void;
}

export function MediaStep({ formData, updateFormData }: StepProps) {
  const handleImageUpload = (urls: string[]) => {
    updateFormData({ images: [...(formData.images || []), ...urls] });
  };

  const removeImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    updateFormData({ images: newImages });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Photos & Video</CardTitle>
          <CardDescription>
            Visual content helps customers connect with your farm - Mobile-optimized images work best!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Farm Photos</Label>
            <ImageUpload
              onUploadComplete={handleImageUpload}
              maxFiles={10}
              bucket="local-images"
            />
            <p className="text-sm text-muted-foreground">
              Upload up to 10 photos. First image will be your hero/cover image.
            </p>
          </div>

          {formData.images && formData.images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {formData.images.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-green-700 text-white text-xs px-2 py-1 rounded">
                      Hero Image
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Farm Tour Video (Optional)
          </CardTitle>
          <CardDescription>
            Add a YouTube or Vimeo video to give customers a virtual tour
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL</Label>
            <Input
              id="videoUrl"
              type="url"
              value={formData.videoUrl || ""}
              onChange={(e) => updateFormData({ videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-sm text-muted-foreground">
              Paste a YouTube or Vimeo link
            </p>
          </div>

          {formData.videoUrl && (
            <div className="rounded-lg overflow-hidden bg-gray-100 p-4">
              <p className="text-sm text-green-700">✓ Video link added</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
