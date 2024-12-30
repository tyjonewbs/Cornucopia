"use client";

import { SellProduct, type State } from "app/actions";
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
import { redirect } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "components/ui/textarea";
import { UploadDropzone } from "lib/uploadthing";
import { Submitbutton } from "../SubmitButtons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "components/ui/select";

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

interface SellFormProps {
  marketStand?: MarketStand;
  initialData?: {
    name: string;
    price: number;
    description: string;
    images: string[];
    marketStandId: string;
    inventory?: number;
    inventoryUpdatedAt?: Date | null;
  };
  productId?: string;
}

// Helper function to check if the state is a State type
function isState(state: State | Response): state is State {
  return (state as State).status !== undefined;
}

// Wrapper for the server action to handle the correct types
const sellProductAction = async (state: State | Response, formData: FormData) => {
  const result = await SellProduct(state as State, formData);
  return result;
};

export function SellForm({ marketStand, initialData, productId }: SellFormProps) {
  const initialState: State = { message: null, status: undefined };
  const [state, formAction] = useFormState(sellProductAction, initialState);
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  
  useEffect(() => {
    if (isState(state) && state.status === "success" && state.message) {
      toast.success(state.message);
    } else if (isState(state) && state.status === "error" && state.message) {
      if (state.message.includes("Stripe account")) {
        toast.error(
          <div className="flex flex-col gap-2">
            <p>{state.message}</p>
            <Link href="/billing" className="text-sm text-blue-500 hover:underline">
              Go to billing settings
            </Link>
          </div>
        );
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <form action={formAction}>
      <CardHeader>
        <CardTitle>{productId ? 'Edit your product' : 'Sell your product with ease'}</CardTitle>
        <CardDescription>
          Please describe your product here in detail so that it can be sold
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-10">
        <div className="flex flex-col gap-y-2">
          <Label>Name</Label>
          <Input
            name="name"
            type="text"
            placeholder="Name of your Product"
            required
            minLength={3}
            defaultValue={initialData?.name}
          />
          {isState(state) && state.errors?.name?.[0] && (
            <p className="text-destructive">{state.errors.name[0]}</p>
          )}
        </div>

        {productId && <input type="hidden" name="productId" value={productId} />}
        <input 
          type="hidden" 
          name="marketStandId" 
          value={initialData?.marketStandId || marketStand?.id} 
        />

        {marketStand && (
          <div className="flex flex-col gap-y-4">
            <Label>Market Stand</Label>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">{marketStand.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {marketStand.description || 'No description'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-y-2">
            <Label>Price</Label>
            <Input
              placeholder="29$"
              type="number"
              name="price"
              required
              min={1}
              defaultValue={initialData?.price}
            />
            {isState(state) && state.errors?.price?.[0] && (
              <p className="text-destructive">{state.errors.price[0]}</p>
            )}
          </div>

          <div className="flex flex-col gap-y-2">
            <Label>Initial Inventory</Label>
            <Input
              placeholder="0"
              type="number"
              name="inventory"
              min={0}
              defaultValue={initialData?.inventory ?? 0}
            />
          </div>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Description</Label>
          <Textarea
            name="description"
            placeholder="Please describe your product in detail..."
            required
            minLength={10}
            defaultValue={initialData?.description}
          />
          {isState(state) && state.errors?.description?.[0] && (
            <p className="text-destructive">
              {state.errors.description[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <input type="hidden" name="images" value={JSON.stringify(images)} />
          <Label>Product Images</Label>
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              {images.map((url, index) => (
                <div key={index} className="relative aspect-square">
                  <img
                    src={url}
                    alt={`Product image ${index + 1}`}
                    className="object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setImages(images.filter((_, i) => i !== index))}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
          <UploadDropzone
            endpoint="imageUploader"
            onClientUploadComplete={(res: { url: string }[]) => {
              setImages([...images, ...res.map((item: { url: string }) => item.url)]);
              toast.success("Your images have been uploaded");
            }}
            onUploadError={(error: Error) => {
              toast.error("Something went wrong, try again");
            }}
          />
          {isState(state) && state.errors?.images?.[0] && (
            <p className="text-destructive">{state.errors.images[0]}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-5">
        <Submitbutton title={productId ? "Save Changes" : "Create your Product"} />
      </CardFooter>
    </form>
  );
}
