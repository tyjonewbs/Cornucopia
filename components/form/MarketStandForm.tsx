"use client";

import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Button } from "components/ui/button";
import { useEffect, useState } from "react";
import { MapPin, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "components/ui/textarea";
import { UploadDropzone } from "lib/uploadthing";
import { Submitbutton } from "../SubmitButtons";
import { useFormState } from "react-dom";
import { CreateMarketStand, UpdateMarketStand } from "../../app/actions";
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from "@hello-pangea/dnd";

interface MarketStandFormProps {
  userId: string;
  marketStand?: {
    id: string;
    name: string;
    description?: string;
    images: string[];
    locationName: string;
    locationGuide: string;
    latitude: number;
    longitude: number;
  };
}

interface FormState {
  images: string[];
  location: { lat: number; lng: number } | null;
  isSubmitting: boolean;
  isDirty: boolean;
  modifiedFields: Set<string>;
  errors: {
    name?: string;
    description?: string;
    locationName?: string;
    locationGuide?: string;
    images?: string;
    location?: string;
  };
  touched: {
    [key: string]: boolean;
  };
}

const MAX_IMAGES = 5;

const validateField = (name: string, value: string | null | undefined): string | undefined => {
  if (!value || value.trim() === '') return "This field is required";
  
  switch (name) {
    case "name":
      return value.length < 3 ? "Name must be at least 3 characters long" : undefined;
    case "description":
    case "locationGuide":
      return value.length < 10 ? "Must be at least 10 characters long" : undefined;
    case "locationName":
      return value.length < 3 ? "Location name must be at least 3 characters long" : undefined;
    default:
      return undefined;
  }
};

export function MarketStandForm({ userId, marketStand }: MarketStandFormProps) {
  console.log('MarketStandForm mounted with props:', { userId, marketStand });

  const initialState: FormState = {
    images: marketStand?.images || [],
    location: marketStand 
      ? { lat: marketStand.latitude, lng: marketStand.longitude }
      : null,
    isSubmitting: false,
    isDirty: false,
    modifiedFields: new Set<string>(),
    errors: {},
    touched: {}
  };

  const [formState, setFormState] = useState<FormState>(initialState);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const updateFormState = (updates: Partial<FormState>, fieldName?: string) => {
    setFormState(prev => {
      const newModifiedFields = new Set(prev.modifiedFields);
      if (fieldName) {
        newModifiedFields.add(fieldName);
      }
      return {
        ...prev,
        ...updates,
        isDirty: true,
        modifiedFields: newModifiedFields
      };
    });
  };

  const resetForm = () => {
    if (!marketStand) return;
    
    setFormState({
      ...initialState,
      images: marketStand.images,
      location: { lat: marketStand.latitude, lng: marketStand.longitude }
    });

    // Reset form fields
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      form.reset();
      // Re-set default values
      const fields = ['name', 'locationName', 'locationGuide', 'description'];
      fields.forEach(field => {
        const input = form.elements.namedItem(field) as HTMLInputElement | HTMLTextAreaElement;
        if (input) {
          input.value = marketStand[field as keyof typeof marketStand]?.toString() || '';
        }
      });
    }
  };

  const handleFieldBlur = (name: string, value: string) => {
    const error = validateField(name, value);
    if (marketStand && value !== marketStand[name as keyof typeof marketStand]?.toString()) {
      updateFormState({
        touched: { ...formState.touched, [name]: true },
        errors: { ...formState.errors, [name]: error }
      }, name);
    } else {
      setFormState(prev => ({
        ...prev,
        touched: { ...prev.touched, [name]: true },
        errors: { ...prev.errors, [name]: error }
      }));
    }
  };

  const removeImage = (indexToRemove: number) => {
    updateFormState({
      images: formState.images.filter((_, index) => index !== indexToRemove)
    }, 'images');
  };

  const handleLocationUpdate = () => {
    if (formState.location && marketStand) {
      const confirmUpdate = window.confirm(
        "Are you sure you want to update the location? This will overwrite the existing coordinates."
      );
      if (!confirmUpdate) return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Only mark as modified if location actually changed
          if (marketStand && 
              (newLocation.lat !== marketStand.latitude || 
               newLocation.lng !== marketStand.longitude)) {
            updateFormState({ location: newLocation }, 'location');
          } else {
            updateFormState({ location: newLocation });
          }
          
          toast.success("Location set successfully");
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error("Failed to get location. Please try again.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(formState.images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    updateFormState({ images: items }, 'images');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission initiated', {
      isEdit: !!marketStand,
      marketStandId: marketStand?.id,
      isDirty: formState.isDirty,
      modifiedFields: Array.from(formState.modifiedFields)
    });

    if (marketStand && formState.isDirty) {
      setShowConfirmation(true);
    } else {
      console.log('Submitting form directly');
      (e.target as HTMLFormElement).requestSubmit();
    }
  };

  const [state, formAction] = useFormState(async (prevState: any, formData: FormData) => {
    console.log('Form submission started', { 
      isEdit: !!marketStand,
      marketStandId: marketStand?.id,
      formData: Object.fromEntries(formData.entries())
    });

    try {
      updateFormState({ isSubmitting: true });

      // Client-side validation
      if (!formState.images || formState.images.length === 0) {
        updateFormState({ 
          isSubmitting: false,
          errors: { ...formState.errors, images: "Please upload at least one image" }
        });
        toast.error("Please upload at least one image");
        return { error: "Please upload at least one image" };
      }
      if (!formState.location) {
        updateFormState({ 
          isSubmitting: false,
          errors: { ...formState.errors, location: "Please set a location for your market stand" }
        });
        toast.error("Please set a location for your market stand");
        return { error: "Please set a location for your market stand" };
      }

      // Get form fields
      const name = formData.get("name")?.toString();
      const description = formData.get("description")?.toString();
      const locationName = formData.get("locationName")?.toString();
      const locationGuide = formData.get("locationGuide")?.toString();

      // Validate all fields
      const errors: FormState['errors'] = {
        name: validateField('name', name || null),
        description: validateField('description', description || null),
        locationName: validateField('locationName', locationName || null),
        locationGuide: validateField('locationGuide', locationGuide || null)
      };

      // Check for validation errors
      const hasErrors = Object.values(errors).some(error => error !== undefined);
      if (hasErrors) {
        updateFormState({ 
          isSubmitting: false,
          errors,
          touched: { name: true, description: true, locationName: true, locationGuide: true }
        });
        toast.error("Please fix the validation errors");
        return { error: "Please fix the validation errors" };
      }

      // Create form data with modified fields only
      const newFormData = new FormData();
      
      if (marketStand) {
        // For update, only include modified fields
        console.log('Preparing update with ID:', marketStand.id);
        newFormData.append("id", marketStand.id);
        
        if (formState.modifiedFields.has('name')) {
          newFormData.append("name", name!);
        }
        if (formState.modifiedFields.has('description')) {
          newFormData.append("description", description!);
        }
        if (formState.modifiedFields.has('locationName')) {
          newFormData.append("locationName", locationName!);
        }
        if (formState.modifiedFields.has('locationGuide')) {
          newFormData.append("locationGuide", locationGuide!);
        }
        if (formState.modifiedFields.has('images')) {
          newFormData.append("images", JSON.stringify(formState.images));
        }
        if (formState.modifiedFields.has('location')) {
          newFormData.append("latitude", formState.location.lat.toString());
          newFormData.append("longitude", formState.location.lng.toString());
        }
      } else {
        // For create, include all fields
        newFormData.append("name", name!);
        newFormData.append("description", description!);
        newFormData.append("locationName", locationName!);
        newFormData.append("locationGuide", locationGuide!);
        newFormData.append("images", JSON.stringify(formState.images));
        newFormData.append("latitude", formState.location.lat.toString());
        newFormData.append("longitude", formState.location.lng.toString());
      }
      
      newFormData.append("userId", userId);
      
      // Submit form
      console.log('Submitting form with values:', {
        formData: Object.fromEntries(newFormData.entries()),
        isUpdate: !!marketStand,
        marketStandId: marketStand?.id
      });
      
      const result = await (marketStand 
        ? UpdateMarketStand(prevState, newFormData)
        : CreateMarketStand(prevState, newFormData));

      console.log('Action result:', result);
      
      // If it's a Response (redirect), return it
      if (result instanceof Response) {
        console.log('Redirecting...');
        updateFormState({ isSubmitting: false });
        return result;
      }
      
      // Otherwise, it's an error
      console.log('Error occurred:', result);
      updateFormState({ isSubmitting: false });
      if ('error' in result) {
        toast.error(result.error);
      }
      return result;
    } catch (error) {
      console.error('Form submission error:', error);
      updateFormState({ isSubmitting: false });
      return { error: "Failed to submit form. Please try again." };
    }
  }, null);

  useEffect(() => {
    if (state) {
      console.log('Form state updated:', state);
      if ('error' in state && state.error) {
        toast.error(state.error);
        updateFormState({ isSubmitting: false });
      }
    }
  }, [state]);

  return (
    <>
      <form action={formAction} onSubmit={handleSubmit} className="w-full">
        {/* Add hidden input for market stand ID */}
        {marketStand && (
          <input 
            type="hidden" 
            name="id" 
            value={marketStand.id}
          />
        )}
        
        <CardHeader>
          <CardTitle>{marketStand ? 'Edit your market stand' : 'Set up your market stand'}</CardTitle>
          <CardDescription>
            {marketStand ? 'Update your market stand details' : 'Create your market stand where your products will be available'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-y-10">
          <div className="flex flex-col gap-y-2">
            <Label>Market Stand Name</Label>
            <Input
              name="name"
              type="text"
              placeholder="Name of your market stand"
              required
              minLength={3}
              defaultValue={marketStand?.name}
              onBlur={(e) => handleFieldBlur('name', e.target.value)}
              className={formState.touched.name && formState.errors.name ? 'border-red-500' : ''}
            />
            {formState.touched.name && formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">{formState.errors.name}</p>
            )}
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Location Name</Label>
            <Input
              name="locationName"
              type="text"
              placeholder="e.g., Corner of Main St & Oak Ave"
              required
              defaultValue={marketStand?.locationName}
              onBlur={(e) => handleFieldBlur('locationName', e.target.value)}
              className={formState.touched.locationName && formState.errors.locationName ? 'border-red-500' : ''}
            />
            {formState.touched.locationName && formState.errors.locationName && (
              <p className="text-sm text-red-500 mt-1">{formState.errors.locationName}</p>
            )}
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Location Guide</Label>
            <Textarea
              name="locationGuide"
              placeholder="Provide specific directions to find your stand, e.g., 'Look for the red barn, stand is located at the front entrance'"
              required
              defaultValue={marketStand?.locationGuide}
              onBlur={(e) => handleFieldBlur('locationGuide', e.target.value)}
              className={formState.touched.locationGuide && formState.errors.locationGuide ? 'border-red-500' : ''}
            />
            {formState.touched.locationGuide && formState.errors.locationGuide && (
              <p className="text-sm text-red-500 mt-1">{formState.errors.locationGuide}</p>
            )}
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              placeholder="Describe your market stand..."
              required
              minLength={10}
              defaultValue={marketStand?.description}
              onBlur={(e) => handleFieldBlur('description', e.target.value)}
              className={formState.touched.description && formState.errors.description ? 'border-red-500' : ''}
            />
            {formState.touched.description && formState.errors.description && (
              <p className="text-sm text-red-500 mt-1">{formState.errors.description}</p>
            )}
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Images {formState.images.length > 0 && `(${formState.images.length}/${MAX_IMAGES})`}</Label>
            {formState.errors.images && (
              <p className="text-sm text-red-500 mb-2">{formState.errors.images}</p>
            )}
            {formState.images.length > 0 && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="images">
                  {(provided: DroppableProvided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="grid grid-cols-2 gap-4 mb-4"
                    >
                      {formState.images.map((image, index) => (
                        <Draggable key={image} draggableId={image} index={index}>
                          {(provided: DraggableProvided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="relative aspect-video group"
                            >
                              <div
                                {...provided.dragHandleProps}
                                className="absolute top-2 left-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
                              >
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <img
                                src={image}
                                alt={`Market stand image ${index + 1}`}
                                className="object-cover rounded-lg w-full h-full"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
            {formState.images.length < MAX_IMAGES && (
              <UploadDropzone
                endpoint="imageUploader"
                onClientUploadComplete={(res: { url: string }[]) => {
                  const newImages = res.map((item: { url: string }) => item.url);
                  updateFormState({
                    images: [...formState.images, ...newImages].slice(0, MAX_IMAGES),
                    errors: { ...formState.errors, images: undefined }
                  }, 'images');
                  toast.success("Images uploaded successfully");
                }}
                onUploadError={(error: Error) => {
                  toast.error("Something went wrong, try again");
                }}
              />
            )}
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Location</Label>
            {formState.errors.location && (
              <p className="text-sm text-red-500 mb-2">{formState.errors.location}</p>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleLocationUpdate}
            >
              <MapPin className="h-4 w-4" />
              {formState.location ? 'Update Location' : 'Get Location'}
            </Button>
            {formState.location && (
              <p className="text-sm text-muted-foreground mt-1">
                Location set: {formState.location.lat.toFixed(6)}, {formState.location.lng.toFixed(6)}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-5 flex justify-between">
          {marketStand && formState.isDirty && (
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="mr-2"
            >
              Reset Changes
            </Button>
          )}
          <div className="flex-1 flex justify-end">
            <Submitbutton 
              title={marketStand ? "Update Market Stand" : "Create Market Stand"}
              disabled={formState.isSubmitting || Object.keys(formState.errors).length > 0}
            />
          </div>
        </CardFooter>
      </form>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Changes</h3>
            <p className="mb-6">Are you sure you want to update your market stand? The following fields will be changed:</p>
            <ul className="list-disc pl-6 mb-6">
              {Array.from(formState.modifiedFields).map(field => (
                <li key={field} className="mb-1">
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowConfirmation(false);
                  const form = document.querySelector('form');
                  if (form) {
                    console.log('Submitting form after confirmation', {
                      marketStandId: marketStand?.id,
                      modifiedFields: Array.from(formState.modifiedFields)
                    });
                    form.requestSubmit();
                  }
                }}
              >
                Confirm Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
