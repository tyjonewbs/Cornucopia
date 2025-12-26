"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FarmFormData } from "../FarmBuilderWizard";
import { Users } from "lucide-react";

interface StepProps {
  formData: Partial<FarmFormData>;
  updateFormData: (data: Partial<FarmFormData>) => void;
}

export function TeamStep({ formData, updateFormData }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Meet Our Team (Optional)
        </CardTitle>
        <CardDescription>
          Introduce the people behind your farm - Coming soon! Skip this step for now
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            Team member management will be added in a future update. For now, you can skip this step.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
