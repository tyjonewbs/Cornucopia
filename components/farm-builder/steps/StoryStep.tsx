"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FarmFormData } from "../FarmBuilderWizard";

interface StepProps {
  formData: Partial<FarmFormData>;
  updateFormData: (data: Partial<FarmFormData>) => void;
}

export function StoryStep({ formData, updateFormData }: StepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Story</CardTitle>
          <CardDescription>
            Share your farm's journey and what drives you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="story">
              Our Story <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="story"
              value={formData.story || ""}
              onChange={(e) => updateFormData({ story: e.target.value })}
              placeholder="Tell customers your farm's story - how you started, your passion, your journey..."
              rows={8}
              required
            />
            <p className="text-sm text-muted-foreground">
              This is your chance to connect with customers on a personal level
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="missionStatement">Mission Statement (Optional)</Label>
            <Textarea
              id="missionStatement"
              value={formData.missionStatement || ""}
              onChange={(e) => updateFormData({ missionStatement: e.target.value })}
              placeholder="e.g., To provide our community with the freshest, most sustainably grown produce while stewarding the land for future generations"
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              Will be displayed as a highlighted callout on your page
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Farm Stats (Optional)</CardTitle>
          <CardDescription>
            Add some key facts that build credibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="foundedYear">Founded Year</Label>
              <Input
                id="foundedYear"
                type="number"
                value={formData.foundedYear || ""}
                onChange={(e) => updateFormData({ foundedYear: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="1952"
                min="1800"
                max={new Date().getFullYear()}
              />
              <p className="text-xs text-muted-foreground">
                Displays as "Since 1952"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="acreage">Farm Size (acres)</Label>
              <Input
                id="acreage"
                type="number"
                step="0.1"
                value={formData.acreage || ""}
                onChange={(e) => updateFormData({ acreage: e.target.value ? parseFloat(e.target.value) : undefined })}
                placeholder="50"
              />
              <p className="text-xs text-muted-foreground">
                Displays as "50 acres"
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="generationNumber">Generation</Label>
              <Input
                id="generationNumber"
                type="number"
                value={formData.generationNumber || ""}
                onChange={(e) => updateFormData({ generationNumber: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="3"
                min="1"
                max="10"
              />
              <p className="text-xs text-muted-foreground">
                Displays as "3rd generation"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
