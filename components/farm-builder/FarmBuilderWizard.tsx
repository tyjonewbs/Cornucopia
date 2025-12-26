"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Local } from "@prisma/client";

// Import step components (we'll create these next)
import { BasicsStep } from "./steps/BasicsStep";
import { StoryStep } from "./steps/StoryStep";
import { MediaStep } from "./steps/MediaStep";
import { PracticesStep } from "./steps/PracticesStep";
import { TeamStep } from "./steps/TeamStep";
import { CertificationsStep } from "./steps/CertificationsStep";
import { SocialStep } from "./steps/SocialStep";
import { LocationStep } from "./steps/LocationStep";
import { PreviewStep } from "./steps/PreviewStep";

interface FarmBuilderWizardProps {
  initialData?: any; // Using any to handle new fields until types refresh
  onSubmit: (data: FormData) => Promise<void>;
  isEdit?: boolean;
}

export interface FarmFormData {
  // Basics
  name: string;
  tagline: string;
  description: string;
  
  // Story
  story: string;
  missionStatement: string;
  foundedYear?: number;
  acreage?: number;
  generationNumber?: number;
  
  // Media
  images: string[];
  videoUrl: string;
  
  // Practices
  farmingPractices: string;
  
  // Team
  teamMembers: Array<{
    name: string;
    role: string;
    bio?: string;
    image?: string;
  }>;
  
  // Certifications
  certifications: Array<{
    name: string;
    description?: string;
    icon?: string;
  }>;
  
  values: Array<{
    name: string;
    description: string;
    icon?: string;
  }>;
  
  // Social
  instagramHandle: string;
  facebookPageUrl: string;
  website: string;
  
  // Location
  latitude: number;
  longitude: number;
  locationName: string;
  locationGuide: string;
  operatingHours: any;
  wholesaleInfo: string;
  contactForm: boolean;
}

const STEPS = [
  { id: 1, name: "Basics", component: BasicsStep },
  { id: 2, name: "Story", component: StoryStep },
  { id: 3, name: "Media", component: MediaStep },
  { id: 4, name: "Practices", component: PracticesStep },
  { id: 5, name: "Team", component: TeamStep },
  { id: 6, name: "Certifications", component: CertificationsStep },
  { id: 7, name: "Social", component: SocialStep },
  { id: 8, name: "Location", component: LocationStep },
  { id: 9, name: "Preview", component: PreviewStep },
];

export function FarmBuilderWizard({ initialData, onSubmit, isEdit = false }: FarmBuilderWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<FarmFormData>>({
    name: initialData?.name || "",
    tagline: initialData?.tagline || "",
    description: initialData?.description || "",
    story: initialData?.story || "",
    missionStatement: initialData?.missionStatement || "",
    foundedYear: initialData?.foundedYear || undefined,
    acreage: initialData?.acreage || undefined,
    generationNumber: initialData?.generationNumber || undefined,
    images: initialData?.images || [],
    videoUrl: initialData?.videoUrl || "",
    farmingPractices: initialData?.farmingPractices || "",
    teamMembers: (initialData?.teamMembers as any) || [],
    certifications: (initialData?.certifications as any) || [],
    values: (initialData?.values as any) || [],
    instagramHandle: initialData?.instagramHandle || "",
    facebookPageUrl: initialData?.facebookPageUrl || "",
    website: initialData?.website || "",
    latitude: initialData?.latitude || 0,
    longitude: initialData?.longitude || 0,
    locationName: initialData?.locationName || "",
    locationGuide: initialData?.locationGuide || "",
    operatingHours: initialData?.operatingHours || {},
    wholesaleInfo: initialData?.wholesaleInfo || "",
    contactForm: initialData?.contactForm ?? true,
  });

  const progress = (currentStep / STEPS.length) * 100;
  const CurrentStepComponent = STEPS[currentStep - 1].component;

  const updateFormData = (data: Partial<FarmFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const formDataToSubmit = new FormData();
    
    // Convert all form data to FormData format
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof value === 'object') {
          formDataToSubmit.append(key, JSON.stringify(value));
        } else {
          formDataToSubmit.append(key, value.toString());
        }
      }
    });

    await onSubmit(formDataToSubmit);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">
            Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].name}
          </h2>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Navigation Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {STEPS.map((step) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              step.id === currentStep
                ? "bg-green-700 text-white"
                : step.id < currentStep
                ? "bg-green-100 text-green-800 hover:bg-green-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {step.name}
          </button>
        ))}
      </div>

      {/* Current Step Content */}
      <div className="mb-8">
        <CurrentStepComponent
          formData={formData}
          updateFormData={updateFormData}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {currentStep === STEPS.length ? (
          <Button
            type="button"
            onClick={handleSubmit}
            className="bg-green-700 hover:bg-green-800"
          >
            {isEdit ? "Save Changes" : "Publish Farm Page"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNext}
            className="bg-green-700 hover:bg-green-800"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
