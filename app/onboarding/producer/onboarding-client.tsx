"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Check, Store, Truck, Package } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import { DEFAULT_WEEKLY_HOURS } from "@/types/hours";
import Image from "next/image";
import { X } from "lucide-react";
import { SellProduct, State } from "@/app/actions";
import { CreateMarketStand } from "@/app/actions/market-stand";
import { createDeliveryZone } from "@/app/actions/delivery-zones";

interface MarketStand {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  latitude: number;
  longitude: number;
  createdAt: Date;
  userId: string | null;
}

interface DeliveryZone {
  id: string;
  name: string;
  deliveryDays: string[];
}

interface ProducerOnboardingWizardProps {
  userId: string;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  userProfileImage: string;
  existingMarketStands: MarketStand[];
  existingDeliveryZones: DeliveryZone[];
}

type Step = "product" | "fulfillment" | "stand" | "delivery" | "complete";
type FulfillmentType = "stand" | "delivery" | "both";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function ProducerOnboardingWizard({
  userId,
  userEmail,
  userFirstName,
  userLastName,
  userProfileImage,
  existingMarketStands,
  existingDeliveryZones,
}: ProducerOnboardingWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("product");

  // Product state
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productTags, setProductTags] = useState<string[]>([]);
  const [productInventory, setProductInventory] = useState("10");
  const [currentTag, setCurrentTag] = useState("");

  // Fulfillment selection
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType | null>(null);

  // Market Stand state
  const [standName, setStandName] = useState("");
  const [standDescription, setStandDescription] = useState("");
  const [standLocationName, setStandLocationName] = useState("");
  const [standLocationGuide, setStandLocationGuide] = useState("");
  const [standLatitude, setStandLatitude] = useState("");
  const [standLongitude, setStandLongitude] = useState("");
  const [standImages, setStandImages] = useState<string[]>([]);
  const [standId, setStandId] = useState<string | null>(null);

  // Delivery Zone state
  const [zoneName, setZoneName] = useState("");
  const [zoneZipCodes, setZoneZipCodes] = useState<string[]>([]);
  const [currentZipCode, setCurrentZipCode] = useState("");
  const [zoneDeliveryFee, setZoneDeliveryFee] = useState("");
  const [zoneDeliveryDays, setZoneDeliveryDays] = useState<string[]>([]);
  const [zoneId, setZoneId] = useState<string | null>(null);

  const handleAddTag = () => {
    const tag = currentTag.trim();
    if (tag) {
      const capitalizedTag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
      if (!productTags.includes(capitalizedTag)) {
        setProductTags([...productTags, capitalizedTag]);
        setCurrentTag("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setProductTags(productTags.filter((tag) => tag !== tagToRemove));
  };

  const handleAddZipCode = () => {
    const input = currentZipCode.trim();
    if (!input) return;

    const potentialZips = input.split(/[\s,]+/).filter((z) => z);
    const validZips: string[] = [];
    const invalidZips: string[] = [];

    potentialZips.forEach((zipCode) => {
      if (/^\d{5}$/.test(zipCode)) {
        if (!zoneZipCodes.includes(zipCode)) {
          validZips.push(zipCode);
        }
      } else {
        invalidZips.push(zipCode);
      }
    });

    if (validZips.length > 0) {
      setZoneZipCodes([...zoneZipCodes, ...validZips]);
      setCurrentZipCode("");
    }

    if (invalidZips.length > 0) {
      toast.error(`Invalid ZIP code(s): ${invalidZips.join(", ")}`);
    }
  };

  const handleRemoveZipCode = (zipCode: string) => {
    setZoneZipCodes(zoneZipCodes.filter((z) => z !== zipCode));
  };

  const handleDayToggle = (day: string) => {
    setZoneDeliveryDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const validateProductStep = (): boolean => {
    if (!productName.trim()) {
      toast.error("Please enter a product name");
      return false;
    }
    if (!productPrice || parseFloat(productPrice) <= 0) {
      toast.error("Please enter a valid price");
      return false;
    }
    if (!productInventory || parseInt(productInventory) < 1) {
      toast.error("Please enter how many units you have available");
      return false;
    }
    if (productDescription.length < 10) {
      toast.error("Please provide a detailed description (at least 10 characters)");
      return false;
    }
    if (productImages.length === 0) {
      toast.error("Please upload at least one product image");
      return false;
    }
    return true;
  };

  const validateStandStep = (): boolean => {
    if (!standName.trim()) {
      toast.error("Please enter a stand name");
      return false;
    }
    if (standLocationGuide.length < 10) {
      toast.error("Please provide location directions (at least 10 characters)");
      return false;
    }
    // Images optional during onboarding — can be added later from dashboard
    return true;
  };

  const validateDeliveryStep = (): boolean => {
    if (!zoneName.trim()) {
      toast.error("Please enter a zone name");
      return false;
    }
    if (zoneZipCodes.length === 0) {
      toast.error("Please add at least one ZIP code");
      return false;
    }
    if (zoneDeliveryDays.length === 0) {
      toast.error("Please select at least one delivery day");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === "product") {
      if (!validateProductStep()) return;
      setStep("fulfillment");
    } else if (step === "fulfillment") {
      if (!fulfillmentType) {
        toast.error("Please select how you'll sell your product");
        return;
      }
      if (fulfillmentType === "stand" || fulfillmentType === "both") {
        setStep("stand");
      } else {
        setStep("delivery");
      }
    } else if (step === "stand") {
      if (!validateStandStep()) return;
      startTransition(async () => {
        await handleCreateStand();
      });
    } else if (step === "delivery") {
      if (!validateDeliveryStep()) return;
      startTransition(async () => {
        await handleCreateDeliveryZone();
      });
    }
  };

  const handleBack = () => {
    if (step === "fulfillment") {
      setStep("product");
    } else if (step === "stand") {
      setStep("fulfillment");
    } else if (step === "delivery") {
      if (fulfillmentType === "both" && standId) {
        setStep("stand");
      } else {
        setStep("fulfillment");
      }
    }
  };

  const handleCreateStand = async () => {
    const formData = new FormData();
    formData.append("name", standName);
    formData.append("description", standDescription);
    formData.append("locationName", standLocationName || standName);
    formData.append("locationGuide", standLocationGuide);
    formData.append("latitude", standLatitude);
    formData.append("longitude", standLongitude);
    formData.append("images", JSON.stringify(standImages.length > 0 ? standImages : ["https://placehold.co/800x600/0B4D2C/white?text=Market+Stand"]));
    formData.append("tags", JSON.stringify([]));
    formData.append("socialMedia", JSON.stringify([]));
    formData.append("hours", JSON.stringify(DEFAULT_WEEKLY_HOURS));
    formData.append("website", "");
    formData.append("streetAddress", "");
    formData.append("city", "");
    formData.append("zipCode", "");
    formData.append("userId", userId);
    formData.append("userEmail", userEmail);
    formData.append("userFirstName", userFirstName);
    formData.append("userLastName", userLastName);
    formData.append("userProfileImage", userProfileImage);

    const result = await CreateMarketStand({ status: undefined, message: null }, formData);

    if (result.success && result.marketStand) {
      setStandId(result.marketStand.id);
      toast.success("Market stand created!");

      if (fulfillmentType === "both") {
        setStep("delivery");
      } else {
        await handleCreateProduct(result.marketStand.id, null);
      }
    } else {
      toast.error(result.error || "Failed to create market stand");
    }
  };

  const handleCreateDeliveryZone = async () => {
    const formData = new FormData();
    formData.append("name", zoneName);
    formData.append("description", "");
    formData.append("zipCodes", JSON.stringify(zoneZipCodes));
    formData.append("cities", JSON.stringify([]));
    formData.append("states", JSON.stringify([]));
    formData.append("deliveryFee", Math.round(parseFloat(zoneDeliveryFee || "0") * 100).toString());
    formData.append("deliveryType", "RECURRING");
    formData.append("deliveryDays", JSON.stringify(zoneDeliveryDays));
    formData.append("isActive", "true");

    const result = await createDeliveryZone(formData);

    if (result.success && result.zone) {
      setZoneId(result.zone.id);
      toast.success("Delivery zone created!");
      await handleCreateProduct(standId, result.zone.id);
    } else {
      toast.error(result.error || "Failed to create delivery zone");
    }
  };

  const handleCreateProduct = async (marketStandId: string | null, deliveryZoneId: string | null) => {
    const formData = new FormData();
    formData.append("name", productName);
    formData.append("price", productPrice);
    formData.append("description", productDescription);
    formData.append("images", JSON.stringify(productImages));
    formData.append("tags", JSON.stringify(productTags));

    // Stand listings
    const inventory = parseInt(productInventory) || 10;
    const standListings = marketStandId ? [{ marketStandId, inventory }] : [];
    formData.append("standListings", JSON.stringify(standListings));

    // Delivery listings
    const deliveryListings = deliveryZoneId
      ? zoneDeliveryDays.map((day) => ({ deliveryZoneId, dayOfWeek: day, inventory }))
      : [];
    formData.append("deliveryListings", JSON.stringify(deliveryListings));

    const initialState: State = { message: null, status: undefined };
    const result = await SellProduct(initialState, formData);

    if (typeof result !== "object" || !("status" in result)) {
      toast.error("Unexpected error creating product");
      return;
    }

    const state = result as State;

    if (state.status === "success") {
      toast.success("Product created successfully!");
      setStep("complete");
    } else {
      toast.error(state.message || "Failed to create product");
    }
  };

  const getStepProgress = () => {
    const steps: Step[] = ["product", "fulfillment"];
    if (fulfillmentType === "stand" || fulfillmentType === "both") steps.push("stand");
    if (fulfillmentType === "delivery" || fulfillmentType === "both") steps.push("delivery");
    steps.push("complete");

    const currentIndex = steps.indexOf(step);
    return { current: currentIndex + 1, total: steps.length };
  };

  const progress = getStepProgress();

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Indicator */}
      {step !== "complete" && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Step {progress.current} of {progress.total}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((progress.current / progress.total) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8B4513] transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <Card>
        {/* Step 1: Product Details */}
        {step === "product" && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Tell us about your product</CardTitle>
              <CardDescription>
                We'll help you set up how to sell it in the next steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  placeholder="e.g., Organic Tomatoes (1 lb)"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productPrice">Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="productPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5.99"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productInventory">Available Quantity *</Label>
                <Input
                  id="productInventory"
                  type="number"
                  min="1"
                  placeholder="10"
                  value={productInventory}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setProductInventory(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">How many units do you have ready to sell?</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescription">Description *</Label>
                <Textarea
                  id="productDescription"
                  placeholder="Describe your product in detail..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Product Images *</Label>
                {productImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {productImages.map((url, index) => (
                      <div key={index} className="relative w-full h-32 group">
                        <Image
                          src={url}
                          alt={`Product ${index + 1}`}
                          fill
                          className="rounded-lg object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          onClick={() => setProductImages(productImages.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <ImageUpload
                  onUploadComplete={(urls) => {
                    setProductImages([...productImages, ...urls]);
                    toast.success("Images uploaded");
                  }}
                  maxFiles={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags (Optional)</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {productTags.map((tag, index) => (
                    <div key={index} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md">
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
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} disabled={!currentTag.trim()}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleNext} size="lg" className="bg-[#8B4513] hover:bg-[#6B3410]">
                  Next: Choose how to sell <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Fulfillment Selection */}
        {step === "fulfillment" && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">How will you sell it?</CardTitle>
              <CardDescription>Choose where customers can get your product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setFulfillmentType("stand")}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    fulfillmentType === "stand"
                      ? "border-[#8B4513] bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Store className="h-8 w-8 mb-3 text-[#8B4513]" />
                  <h3 className="font-semibold text-lg mb-2">At a market stand</h3>
                  <p className="text-sm text-gray-600">
                    Sell at a physical location like a farmers market or roadside stand
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType("delivery")}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    fulfillmentType === "delivery"
                      ? "border-[#8B4513] bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Truck className="h-8 w-8 mb-3 text-[#8B4513]" />
                  <h3 className="font-semibold text-lg mb-2">Home delivery</h3>
                  <p className="text-sm text-gray-600">
                    Deliver directly to customers in your area
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType("both")}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${
                    fulfillmentType === "both"
                      ? "border-[#8B4513] bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Package className="h-8 w-8 mb-3 text-[#8B4513]" />
                  <h3 className="font-semibold text-lg mb-2">Both</h3>
                  <p className="text-sm text-gray-600">
                    List at a stand AND offer delivery
                  </p>
                </button>
              </div>

              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline" size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!fulfillmentType}
                  size="lg"
                  className="bg-[#8B4513] hover:bg-[#6B3410]"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3a: Market Stand Setup */}
        {step === "stand" && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Set up your market stand</CardTitle>
              <CardDescription>Tell customers where to find you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="standName">Stand Name *</Label>
                <Input
                  id="standName"
                  placeholder="e.g., Green Valley Farm Stand"
                  value={standName}
                  onChange={(e) => setStandName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="standDescription">Description (Optional)</Label>
                <Textarea
                  id="standDescription"
                  placeholder="Brief description of your stand..."
                  value={standDescription}
                  onChange={(e) => setStandDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="standLocationName">Location Name (Optional)</Label>
                <Input
                  id="standLocationName"
                  placeholder="e.g., Downtown Farmers Market"
                  value={standLocationName}
                  onChange={(e) => setStandLocationName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="standLocationGuide">Directions *</Label>
                <Textarea
                  id="standLocationGuide"
                  placeholder="e.g., Turn left at the red barn, follow the gravel path..."
                  value={standLocationGuide}
                  onChange={(e) => setStandLocationGuide(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="standLatitude">Latitude (Optional)</Label>
                  <Input
                    id="standLatitude"
                    type="number"
                    step="any"
                    placeholder="40.7128"
                    value={standLatitude}
                    onChange={(e) => setStandLatitude(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="standLongitude">Longitude (Optional)</Label>
                  <Input
                    id="standLongitude"
                    type="number"
                    step="any"
                    placeholder="-74.0060"
                    value={standLongitude}
                    onChange={(e) => setStandLongitude(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Stand Images *</Label>
                {standImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {standImages.map((url, index) => (
                      <div key={index} className="relative w-full h-32 group">
                        <Image
                          src={url}
                          alt={`Stand ${index + 1}`}
                          fill
                          className="rounded-lg object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          onClick={() => setStandImages(standImages.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <ImageUpload
                  onUploadComplete={(urls) => {
                    setStandImages([...standImages, ...urls]);
                    toast.success("Images uploaded");
                  }}
                  maxFiles={5}
                  bucket="market-stand-images"
                />
              </div>

              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline" size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={isPending}
                  size="lg"
                  className="bg-[#8B4513] hover:bg-[#6B3410]"
                >
                  {isPending ? "Creating..." : fulfillmentType === "both" ? "Next: Delivery" : "Create Product"}{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3b: Delivery Zone Setup */}
        {step === "delivery" && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl">Set up delivery zone</CardTitle>
              <CardDescription>Define where you deliver and your schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="zoneName">Zone Name *</Label>
                <Input
                  id="zoneName"
                  placeholder="e.g., Austin Metro Area"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>ZIP Codes *</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {zoneZipCodes.map((zipCode) => (
                    <div key={zipCode} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md">
                      <span>{zipCode}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveZipCode(zipCode)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., 78701"
                    value={currentZipCode}
                    onChange={(e) => setCurrentZipCode(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddZipCode())}
                  />
                  <Button type="button" onClick={handleAddZipCode}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zoneDeliveryFee">Delivery Fee *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                    id="zoneDeliveryFee"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5.00"
                    value={zoneDeliveryFee}
                    onChange={(e) => setZoneDeliveryFee(e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Delivery Days *</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Which days do you deliver to this area?
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={day}
                        checked={zoneDeliveryDays.includes(day)}
                        onChange={() => handleDayToggle(day)}
                        className="h-4 w-4 rounded border-gray-300 text-[#8B4513] focus:ring-[#8B4513] cursor-pointer"
                      />
                      <label htmlFor={day} className="text-sm font-medium cursor-pointer">
                        {day}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <Button onClick={handleBack} variant="outline" size="lg">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={isPending}
                  size="lg"
                  className="bg-[#8B4513] hover:bg-[#6B3410]"
                >
                  {isPending ? "Creating..." : "Create Product"} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">You're all set!</CardTitle>
              <CardDescription className="text-center">
                Your product is now live and pending review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-700">
                  Your product will be reviewed by our team and published within 24 hours. You'll receive an
                  email notification when it's approved.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => router.push("/dashboard")}
                  size="lg"
                  className="w-full bg-[#8B4513] hover:bg-[#6B3410]"
                >
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => router.push("/dashboard/products")}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  View My Products
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
