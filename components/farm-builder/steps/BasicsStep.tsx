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

export function BasicsStep({ formData, updateFormData }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>The Basics</CardTitle>
        <CardDescription>
          Start with the essentials - your farm's name and what makes you special
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">
            Farm/Ranch Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="e.g., Green Acres Farm"
            required
          />
          <p className="text-sm text-muted-foreground">
            This will be the main title on your page
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline (Optional)</Label>
          <Input
            id="tagline"
            value={formData.tagline || ""}
            onChange={(e) => updateFormData({ tagline: e.target.value })}
            placeholder="e.g., Organic vegetables grown with love since 1952"
            maxLength={255}
          />
          <p className="text-sm text-muted-foreground">
            A short, catchy phrase that captures your farm's essence
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">
            Short Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            value={formData.description || ""}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Tell visitors what you grow or raise in a few sentences..."
            rows={4}
            required
          />
          <p className="text-sm text-muted-foreground">
            A brief overview that appears at the top of your page (2-3 sentences)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
