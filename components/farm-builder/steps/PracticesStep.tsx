"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FarmFormData } from "../FarmBuilderWizard";
import { Leaf } from "lucide-react";

interface StepProps {
  formData: Partial<FarmFormData>;
  updateFormData: (data: Partial<FarmFormData>) => void;
}

export function PracticesStep({ formData, updateFormData }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          Our Farming Practices
        </CardTitle>
        <CardDescription>
          Share how you farm - organic methods, sustainability practices, animal welfare, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="farmingPractices">
            Farming Practices <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="farmingPractices"
            value={formData.farmingPractices || ""}
            onChange={(e) => updateFormData({ farmingPractices: e.target.value })}
            placeholder="Describe your farming methods, sustainability practices, certifications, animal welfare standards, etc..."
            rows={10}
            required
          />
          <p className="text-sm text-muted-foreground">
            This helps customers understand your values and methods
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Tips:</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Mention specific practices (no-till, crop rotation, composting)</li>
            <li>Describe how you care for soil health</li>
            <li>Talk about pest management approaches</li>
            <li>Share animal welfare standards if applicable</li>
            <li>Mention any certifications (organic, non-GMO, etc.)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
