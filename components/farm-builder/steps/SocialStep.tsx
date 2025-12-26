"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FarmFormData } from "../FarmBuilderWizard";
import { Instagram, Facebook, Globe } from "lucide-react";

interface StepProps {
  formData: Partial<FarmFormData>;
  updateFormData: (data: Partial<FarmFormData>) => void;
}

export function SocialStep({ formData, updateFormData }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect With Us</CardTitle>
        <CardDescription>
          Add your social media and website links
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="instagramHandle" className="flex items-center gap-2">
            <Instagram className="h-4 w-4" />
            Instagram Handle (Optional)
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">@</span>
            <Input
              id="instagramHandle"
              value={formData.instagramHandle || ""}
              onChange={(e) => updateFormData({ instagramHandle: e.target.value.replace('@', '') })}
              placeholder="yourfarmname"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Just the username, without the @
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="facebookPageUrl" className="flex items-center gap-2">
            <Facebook className="h-4 w-4" />
            Facebook Page URL (Optional)
          </Label>
          <Input
            id="facebookPageUrl"
            type="url"
            value={formData.facebookPageUrl || ""}
            onChange={(e) => updateFormData({ facebookPageUrl: e.target.value })}
            placeholder="https://facebook.com/yourfarmname"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Website URL (Optional)
          </Label>
          <Input
            id="website"
            type="url"
            value={formData.website || ""}
            onChange={(e) => updateFormData({ website: e.target.value })}
            placeholder="https://yourfarmwebsite.com"
          />
          <p className="text-sm text-muted-foreground">
            If you have a separate website
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
