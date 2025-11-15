"use client";

import { SellProduct, type State } from "@/app/actions";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { Submitbutton } from "@/components/SubmitButtons";
import Image from "next/image";
import { ProductAvailabilityManager } from "@/components/form/ProductAvailabilityManager";
import { DeleteProductButton } from "@/components/form/DeleteProductButton";

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

interface StandListing {
  marketStandId: string;
  inventory: number;
}

interface DeliveryListing {
  deliveryZoneId: string;
  dayOfWeek: string;
  inventory: number;
}

interface SellFormProps {
  marketStand?: MarketStand;
  marketStands?: MarketStand[];
  deliveryZones?: DeliveryZone[];
  initialData?: {
    name: string;
    price: number;
    description: string;
    images: string[];
    tags: string[];
    standListings?: StandListing[];
    deliveryListings?: DeliveryListing[];
  };
  productId?: string;
  userId?: string;
  productName?: string;
}

function isState(state: State | Response): state is State {
  return (state as State).status !== undefined;
}

const sellProductAction = async (state: State | Response, formData: FormData) => {
  const result = await SellProduct(state as State, formData);
  return result;
};

export function SellForm({ marketStand, marketStands = [], deliveryZones = [], initialData, productId, userId, productName }: SellFormProps) {
  const initialState: State = { message: null, status: undefined };
  const [state, formAction] = useFormState(sellProductAction, initialState);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [currentTag, setCurrentTag] = useState('');
  const [standListings, setStandListings] = useState<StandListing[]>(initialData?.standListings || []);
  const [deliveryListings, setDeliveryListings] = useState<DeliveryListing[]>(initialData?.deliveryListings || []);

  const handleAddTag = () => {
    const tag = currentTag.trim();
    if (tag) {
      const capitalizedTag = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
      if (!tags.includes(capitalizedTag)) {
        setTags(prev => [...prev, capitalizedTag]);
        setCurrentTag('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const router = useRouter();

  useEffect(() => {
    if (isState(state) && state.status === "success" && state.message) {
      toast.success(state.message);
      router.push('/dashboard/products');
    } else if (isState(state) && state.status === "error" && state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction}>
      <CardHeader>
        <CardTitle>{productId ? 'Edit your product' : 'Sell your product with ease'}</CardTitle>
        <CardDescription>
          Please describe your product here in detail so that it can be sold
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-8">
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Name of your Product"
            required
            minLength={3}
            defaultValue={initialData?.name}
            aria-label="Product name"
          />
          {isState(state) && state.errors?.name?.[0] && (
            <p className="text-sm font-medium text-destructive mt-1.5">{state.errors.name[0]}</p>
          )}
        </div>

        {productId && <input type="hidden" name="productId" value={productId} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              placeholder="29.99"
              type="text"
              pattern="^\d*\.?\d{0,2}$"
              name="price"
              required
              defaultValue={initialData ? (initialData.price / 100).toFixed(2) : undefined}
              aria-label="Product price"
              title="Enter a valid price with up to 2 decimal places"
            />
            {isState(state) && state.errors?.price?.[0] && (
              <p className="text-sm font-medium text-destructive mt-1.5">{state.errors.price[0]}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Please describe your product in detail..."
            required
            minLength={10}
            defaultValue={initialData?.description}
            aria-label="Product description"
          />
          {isState(state) && state.errors?.description?.[0] && (
            <p className="text-sm font-medium text-destructive mt-1.5">
              {state.errors.description[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-y-2 mb-8">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, index) => (
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
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={handleTagKeyPress}
            />
            <Button
              type="button"
              onClick={handleAddTag}
              disabled={!currentTag.trim()}
            >
              Add
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <input type="hidden" name="images" value={JSON.stringify(images)} />
          <input type="hidden" name="tags" value={JSON.stringify(tags)} />
          <Label>Product Images</Label>
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {images.map((url, index) => (
                <div key={index} className="relative w-full h-48 group">
                  <Image
                    src={url}
                    alt={`Product image ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="rounded-lg object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                    aria-label={`Remove image ${index + 1}`}
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
          />
          {isState(state) && state.errors?.images?.[0] && (
            <p className="text-sm font-medium text-destructive mt-1.5">{state.errors.images[0]}</p>
          )}
        </div>

        {/* New Availability Manager */}
        <div className="border-t pt-6">
          <ProductAvailabilityManager
            marketStands={marketStands}
            deliveryZones={deliveryZones}
            standListings={standListings}
            deliveryListings={deliveryListings}
            onStandListingsChange={setStandListings}
            onDeliveryListingsChange={setDeliveryListings}
          />
          {/* Hidden fields to pass listings data to form */}
          <input type="hidden" name="standListings" value={JSON.stringify(standListings)} />
          <input type="hidden" name="deliveryListings" value={JSON.stringify(deliveryListings)} />
        </div>
      </CardContent>
      <CardFooter className="mt-5">
        <div className="flex-1 flex justify-between items-center">
          {productId && userId && productName && (
            <DeleteProductButton
              productId={productId}
              productName={productName}
              userId={userId}
            />
          )}
          <div className={productId ? '' : 'ml-auto'}>
            <Submitbutton title={productId ? "Save Changes" : "Create your Product"} />
          </div>
        </div>
      </CardFooter>
    </form>
  );
}
