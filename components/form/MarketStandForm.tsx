"use client";

import { CreateMarketStand, UpdateMarketStand } from "@/app/actions/market-stand";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WeeklyHours } from "@/lib/dto/marketStand.dto";
import { DEFAULT_WEEKLY_HOURS } from "@/types/hours";
import { HoursInput } from "./HoursInput";
import { DeleteMarketStandButton } from "./DeleteMarketStandButton";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SubmitStandButton } from "./SubmitStandButton";

interface MarketStandFormProps {
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userProfileImage: string;
  marketStand?: {
    id: string;
    name: string;
    description: string;
    images: string[];
    tags: string[];
    latitude: number;
    longitude: number;
    streetAddress?: string | null;
    city?: string | null;
    zipCode?: string | null;
    locationGuide: string;
    website?: string;
    socialMedia?: string[];
    hours?: WeeklyHours;
  };
  onSuccess?: () => void;
}

interface FormState {
  values: {
    name: string;
    description: string;
    streetAddress: string;
    city: string;
    zipCode: string;
    locationGuide: string;
    latitude: string;
    longitude: string;
    tags: string[];
    currentTag: string;
    website: string;
    socialMedia: string[];
    currentSocialMedia: string;
    hours: WeeklyHours;
  };
  errors: {
    name?: string;
    description?: string;
    streetAddress?: string;
    city?: string;
    zipCode?: string;
    locationGuide?: string;
    latitude?: string;
    longitude?: string;
    images?: string;
    website?: string;
    socialMedia?: string;
    hours?: string;
  };
}

const validateField = (name: string, value: string | string[] | WeeklyHours): string | undefined => {
  // Skip validation for array values and WeeklyHours
  if (Array.isArray(value) || typeof value === 'object') return undefined;
  
  if (!value || value.trim() === '') {
    // Optional fields
    if (name === 'website' || name === 'streetAddress' || name === 'city' || name === 'zipCode') return undefined;
    return "This field is required";
  }
  
  switch (name) {
    case "name":
      return value.length < 3 ? "Name must be at least 3 characters long" : undefined;
    case "description":
      return value.length < 10 ? "Must be at least 10 characters long" : undefined;
    case "streetAddress":
      return value.length > 255 ? "Street address is too long" : undefined;
    case "city":
      return value.length > 100 ? "City name is too long" : undefined;
    case "zipCode":
      return value.length > 10 ? "Zip code is too long" : undefined;
    case "locationGuide":
      return value.length < 10 ? "Must provide detailed directions" : undefined;
    case "latitude":
      const lat = parseFloat(value);
      if (isNaN(lat) || lat < -90 || lat > 90) return "Must be between -90 and 90";
      return undefined;
    case "longitude":
      const lng = parseFloat(value);
      if (isNaN(lng) || lng < -180 || lng > 180) return "Must be between -180 and 180";
      return undefined;
    case "website":
      try {
        if (value) {
          new URL(value);
        }
        return undefined;
      } catch {
        return "Must be a valid URL (e.g., https://example.com)";
      }
    default:
      return undefined;
  }
};

export function MarketStandForm({ userId, userEmail, userFirstName, userLastName, userProfileImage, marketStand, onSuccess }: MarketStandFormProps): JSX.Element {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(marketStand?.images || []);
  const [formState, setFormState] = useState<FormState>({
    values: {
      name: marketStand?.name || '',
      description: marketStand?.description || '',
      streetAddress: marketStand?.streetAddress || '',
      city: marketStand?.city || '',
      zipCode: marketStand?.zipCode || '',
      locationGuide: marketStand?.locationGuide || '',
      latitude: marketStand?.latitude?.toString() || '',
      longitude: marketStand?.longitude?.toString() || '',
      tags: marketStand?.tags || [],
      currentTag: '',
      website: marketStand?.website || '',
      socialMedia: marketStand?.socialMedia || [],
      currentSocialMedia: '',
      hours: marketStand?.hours || DEFAULT_WEEKLY_HOURS
    },
    errors: {}
  });

  const handleFieldChange = (name: string, value: string) => {
    setFormState(prev => {
      const newErrors = { ...prev.errors };
      const error = validateField(name, value);
      
      if (error) {
        newErrors[name as keyof FormState['errors']] = error;
      } else {
        delete newErrors[name as keyof FormState['errors']];
      }

      return {
        ...prev,
        values: { ...prev.values, [name]: value },
        errors: newErrors
      };
    });
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const validateForm = (): boolean => {
    const newErrors: FormState['errors'] = {};
    let isValid = true;

    // Validate required fields
    const requiredFields = ['name', 'description', 'locationGuide', 'website'];
    requiredFields.forEach(name => {
      const value = formState.values[name as keyof typeof formState.values];
      const error = validateField(name, value);
      if (error) {
        newErrors[name as keyof FormState['errors']] = error;
        isValid = false;
      }
    });

    // Validate location: Either complete address OR lat/long is required
    const hasStreetAddress = formState.values.streetAddress.trim() !== '';
    const hasCity = formState.values.city.trim() !== '';
    const hasZipCode = formState.values.zipCode.trim() !== '';
    const hasLatitude = formState.values.latitude.trim() !== '';
    const hasLongitude = formState.values.longitude.trim() !== '';

    const hasCompleteAddress = hasStreetAddress && hasCity && hasZipCode;
    const hasCoordinates = hasLatitude && hasLongitude;

    // Check if we have either complete address or coordinates
    if (!hasCompleteAddress && !hasCoordinates) {
      newErrors.streetAddress = "Either provide a complete address (street, city, zip) OR GPS coordinates";
      newErrors.latitude = "Either provide GPS coordinates (lat & long) OR a complete address";
      isValid = false;
    } else {
      // If partial address provided, validate completeness
      const hasPartialAddress = hasStreetAddress || hasCity || hasZipCode;
      if (hasPartialAddress && !hasCompleteAddress) {
        if (!hasStreetAddress) newErrors.streetAddress = "Street address is required when providing an address";
        if (!hasCity) newErrors.city = "City is required when providing an address";
        if (!hasZipCode) newErrors.zipCode = "Zip code is required when providing an address";
        isValid = false;
      }

      // Validate lat/long values if provided
      if (hasLatitude || hasLongitude) {
        if (hasLatitude) {
          const latError = validateField('latitude', formState.values.latitude);
          if (latError) {
            newErrors.latitude = latError;
            isValid = false;
          }
        }
        if (hasLongitude) {
          const lngError = validateField('longitude', formState.values.longitude);
          if (lngError) {
            newErrors.longitude = lngError;
            isValid = false;
          }
        }
        // Both must be provided together
        if ((hasLatitude && !hasLongitude) || (!hasLatitude && hasLongitude)) {
          newErrors.latitude = "Both latitude and longitude are required";
          newErrors.longitude = "Both latitude and longitude are required";
          isValid = false;
        }
      }
    }

    // Validate images
    if (images.length === 0) {
      newErrors.images = "At least one image is required";
      isValid = false;
    }

    // Validate social media URLs
    const invalidSocialMedia = formState.values.socialMedia.some(url => {
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidSocialMedia) {
      newErrors.socialMedia = "All social media links must be valid URLs";
      isValid = false;
    }

    setFormState(prev => ({
      ...prev,
      errors: newErrors
    }));

    return isValid;
  };

  const handleAddTag = () => {
    const tag = formState.values.currentTag.trim();
    if (tag) {
      const capitalizedTag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
      if (!formState.values.tags.includes(capitalizedTag)) {
        setFormState(prev => ({
          ...prev,
          values: {
            ...prev.values,
            tags: [...prev.values.tags, capitalizedTag],
            currentTag: ''
          }
        }));
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        tags: prev.values.tags.filter(tag => tag !== tagToRemove)
      }
    }));
  };

  const handleAddSocialMedia = () => {
    const link = formState.values.currentSocialMedia.trim();
    if (link) {
      try {
        new URL(link);
        if (!formState.values.socialMedia.includes(link)) {
          setFormState(prev => ({
            ...prev,
            values: {
              ...prev.values,
              socialMedia: [...prev.values.socialMedia, link],
              currentSocialMedia: ''
            }
          }));
        }
      } catch {
        setFormState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            socialMedia: "Please enter a valid URL"
          }
        }));
      }
    }
  };

  const handleRemoveSocialMedia = (linkToRemove: string) => {
    setFormState(prev => ({
      ...prev,
      values: {
        ...prev.values,
        socialMedia: prev.values.socialMedia.filter(link => link !== linkToRemove)
      }
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSocialMediaKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSocialMedia();
    }
  };

  const createFormData = () => {
    const formData = new FormData();
    
    // Add all form values manually instead of relying on the form element
    formData.append('name', formState.values.name);
    formData.append('description', formState.values.description);
    formData.append('locationName', formState.values.name); // Auto-populate with name
    formData.append('streetAddress', formState.values.streetAddress);
    formData.append('city', formState.values.city);
    formData.append('zipCode', formState.values.zipCode);
    formData.append('locationGuide', formState.values.locationGuide);
    formData.append('latitude', formState.values.latitude);
    formData.append('longitude', formState.values.longitude);
    formData.append('images', JSON.stringify(images));
    formData.append('tags', JSON.stringify(formState.values.tags));
    formData.append('website', formState.values.website);
    formData.append('socialMedia', JSON.stringify(formState.values.socialMedia));
    formData.append('hours', JSON.stringify(formState.values.hours));
    formData.append('userId', userId);
    formData.append('userEmail', userEmail);
    formData.append('userFirstName', userFirstName);
    formData.append('userLastName', userLastName);
    formData.append('userProfileImage', userProfileImage);
    
    return formData;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, retryCount = 0) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    const formData = createFormData();

    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      if (marketStand) {
        formData.append("id", marketStand.id);
        const result = await UpdateMarketStand({ status: undefined, message: null }, formData);
        
        if (result.success) {
          toast.success("Market stand updated successfully");
          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/dashboard/market-stand/setup');
          }
        } else {
          console.error('Update failed:', result.error);
          if (retryCount < maxRetries) {
            toast.error(`Update failed, retrying... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            await handleSubmit(e, retryCount + 1);
            return;
          }
          toast.error(result.error || "Failed to update market stand");
          return;
        }
      } else {
        const result = await CreateMarketStand({ status: undefined, message: null }, formData);
        
        if (result.success) {
          toast.success("Market stand created successfully");
          if (onSuccess) {
            onSuccess();
          } else {
            router.push('/dashboard/market-stand/setup');
          }
        } else {
          console.error('Creation failed:', result.error);
          if (retryCount < maxRetries) {
            toast.error(`Creation failed, retrying... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            await handleSubmit(e, retryCount + 1);
            return;
          }
          toast.error(result.error || "Failed to create market stand");
          return;
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      if (retryCount < maxRetries) {
        toast.error(`An error occurred, retrying... (${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        await handleSubmit(e, retryCount + 1);
        return;
      }
      toast.error("An error occurred. Please try again.");
    }
  };

  // Validate images when they change
  useEffect(() => {
    if (images.length === 0) {
      setFormState(prev => ({
        ...prev,
        errors: { ...prev.errors, images: "At least one image is required" }
      }));
    } else {
      setFormState(prev => {
        const newErrors = { ...prev.errors };
        delete newErrors.images;
        return { ...prev, errors: newErrors };
      });
    }
  }, [images]);

  const isFormValid = Object.keys(formState.errors).length === 0;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardDescription>
          Please provide details about your market stand
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-8">
        <div className="flex flex-col gap-y-2">
          <Label>Name</Label>
          <Input
            name="name"
            type="text"
            placeholder="Name of your Market Stand"
            required
            minLength={3}
            value={formState.values.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            className={formState.errors.name ? 'border-destructive' : ''}
          />
          {formState.errors.name && (
            <p className="text-sm font-medium text-destructive mt-1.5">{formState.errors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Description</Label>
          <Textarea
            name="description"
            placeholder="Please describe your market stand..."
            required
            minLength={10}
            value={formState.values.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className={formState.errors.description ? 'border-destructive' : ''}
          />
          {formState.errors.description && (
            <p className="text-sm font-medium text-destructive mt-1.5">{formState.errors.description}</p>
          )}
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-2">Location Information</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Provide either a complete address (street, city, zip) OR GPS coordinates. You can provide both for maximum accuracy.
          </p>
          
          <div className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-2">
              <Label>Street Address (Optional)</Label>
              <Input
                name="streetAddress"
                type="text"
                placeholder="e.g., 123 Main Street"
                value={formState.values.streetAddress}
                onChange={(e) => handleFieldChange('streetAddress', e.target.value)}
                className={formState.errors.streetAddress ? 'border-destructive' : ''}
              />
              {formState.errors.streetAddress && (
                <p className="text-sm font-medium text-destructive mt-1.5">{formState.errors.streetAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="flex flex-col gap-y-2">
                <Label>City (Optional)</Label>
                <Input
                  name="city"
                  type="text"
                  placeholder="e.g., San Francisco"
                  value={formState.values.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  className={formState.errors.city ? 'border-destructive' : ''}
                />
                {formState.errors.city && (
                  <p className="text-sm font-medium text-destructive mt-1.5">{formState.errors.city}</p>
                )}
              </div>

              <div className="flex flex-col gap-y-2">
                <Label>Zip Code (Optional)</Label>
                <Input
                  name="zipCode"
                  type="text"
                  placeholder="e.g., 94102"
                  value={formState.values.zipCode}
                  onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                  className={formState.errors.zipCode ? 'border-destructive' : ''}
                />
                {formState.errors.zipCode && (
                  <p className="text-sm font-medium text-destructive mt-1.5">{formState.errors.zipCode}</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <Label className="text-base">GPS Coordinates (Optional)</Label>
              <p className="text-sm text-muted-foreground mt-1 mb-3">
                If an address doesn't accurately show where the market stand is (often in the countryside), please find the latitude/longitude and add it here.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="flex flex-col gap-y-2">
                  <Label>Latitude</Label>
                  <Input
                    name="latitude"
                    type="number"
                    step="any"
                    placeholder="e.g., 40.7128"
                    value={formState.values.latitude}
                    onChange={(e) => handleFieldChange('latitude', e.target.value)}
                    className={formState.errors.latitude ? 'border-destructive' : ''}
                  />
                  {formState.errors.latitude && (
                    <p className="text-sm font-medium text-destructive mt-1.5">{formState.errors.latitude}</p>
                  )}
                </div>

                <div className="flex flex-col gap-y-2">
                  <Label>Longitude</Label>
                  <Input
                    name="longitude"
                    type="number"
                    step="any"
                    placeholder="e.g., -74.0060"
                    value={formState.values.longitude}
                    onChange={(e) => handleFieldChange('longitude', e.target.value)}
                    className={formState.errors.longitude ? 'border-destructive' : ''}
                  />
                  {formState.errors.longitude && (
                    <p className="text-sm font-medium text-destructive mt-1.5">{formState.errors.longitude}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Location Guide & Directions</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Provide detailed directions to help people find your stand (e.g., "Come up the driveway, the dogs don't bite they just bark")
          </p>
          <Textarea
            name="locationGuide"
            placeholder="e.g., Turn left at the red barn, follow the gravel path for 100 yards..."
            required
            minLength={10}
            value={formState.values.locationGuide}
            onChange={(e) => handleFieldChange('locationGuide', e.target.value)}
            className={formState.errors.locationGuide ? 'border-destructive' : ''}
          />
          {formState.errors.locationGuide && (
            <p className="text-sm font-medium text-destructive mt-1.5">{formState.errors.locationGuide}</p>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Website (Optional)</Label>
          <Input
            name="website"
            type="url"
            placeholder="https://your-website.com"
            value={formState.values.website}
            onChange={(e) => handleFieldChange('website', e.target.value)}
            className={formState.errors.website ? 'border-destructive' : ''}
          />
          {formState.errors.website && (
            <p className="text-sm font-medium text-destructive mt-1.5">{formState.errors.website}</p>
          )}
        </div>

        <div className="flex flex-col gap-y-2 mb-8">
          <Label>Social Media Links</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formState.values.socialMedia.map((link, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md"
              >
                <span className="text-sm truncate max-w-[200px]">{link}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveSocialMedia(link)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-x-2">
            <Input
              type="url"
              placeholder="Add a social media link"
              value={formState.values.currentSocialMedia}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                values: { ...prev.values, currentSocialMedia: e.target.value }
              }))}
              onKeyPress={handleSocialMediaKeyPress}
            />
            <Button
              type="button"
              onClick={handleAddSocialMedia}
              disabled={!formState.values.currentSocialMedia.trim()}
            >
              Add
            </Button>
          </div>
          {formState.errors.socialMedia && (
            <p className="text-sm font-medium text-destructive mt-1.5">{formState.errors.socialMedia}</p>
          )}
        </div>

        <div className="flex flex-col gap-y-2 mb-8">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formState.values.tags.map((tag, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md"
              >
                <span>{tag}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => handleRemoveTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex gap-x-2">
            <Input
              type="text"
              placeholder="Add a tag"
              value={formState.values.currentTag}
              onChange={(e) => setFormState(prev => ({
                ...prev,
                values: { ...prev.values, currentTag: e.target.value }
              }))}
              onKeyPress={handleTagKeyPress}
            />
            <Button
              type="button"
              onClick={handleAddTag}
              disabled={!formState.values.currentTag.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Operating Hours</Label>
          <HoursInput
            value={formState.values.hours || DEFAULT_WEEKLY_HOURS}
            onChange={(hours) => {
              setFormState(prev => ({
                ...prev,
                values: { ...prev.values, hours }
              }));
            }}
          />
          {formState.errors.hours && (
            <p className="text-sm font-medium text-destructive mt-1.5">{formState.errors.hours}</p>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Market Stand Images</Label>
          {formState.errors.images && (
            <p className="text-sm font-medium text-destructive mb-2">{formState.errors.images}</p>
          )}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {images.map((url, index) => (
                <div key={index} className="relative w-full h-48 group">
                  <Image
                    src={url}
                    alt={`Market stand image ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="rounded-lg object-cover"
                      onError={(e) => {
                        // Replace with placeholder
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const placeholder = document.createElement('div');
                          placeholder.className = 'flex flex-col items-center justify-center h-full';
                          placeholder.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 text-muted-foreground">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <span class="text-sm text-muted-foreground">Image not available</span>
                          `;
                          parent.appendChild(placeholder);
                        }
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <ImageUpload
            onUploadComplete={(urls) => {
              setImages(prev => [...prev, ...urls]);
              toast.success("Images uploaded successfully");
            }}
            maxFiles={5}
            bucket="market-stand-images"
          />
        </div>
      </CardContent>
      <CardFooter className="mt-5">
        <div className="flex-1 flex justify-between items-center">
          {marketStand && (
            <DeleteMarketStandButton
              marketStandId={marketStand.id}
              marketStandName={marketStand.name}
              userId={userId}
            />
          )}
          <div className={marketStand ? '' : 'ml-auto'}>
            <SubmitStandButton 
              title={marketStand ? "Save Changes" : "Create Market Stand"}
              isFormValid={isFormValid}
            />
          </div>
        </div>
      </CardFooter>
    </form>
  );
}
