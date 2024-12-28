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
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { toast } from "sonner";
import { Textarea } from "components/ui/textarea";
import { UploadDropzone } from "lib/uploadthing";
import { Submitbutton } from "../SubmitButtons";
import { MapPin } from "lucide-react";

export function SellForm() {
  const initalState: State = { message: "", status: undefined };
  const [state, formAction] = useFormState(SellProduct, initalState);
  const [images, setImages] = useState<null | string[]>(null);
  const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    } else if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <CardHeader>
        <CardTitle>Sell your product with ease</CardTitle>
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
          />
          {state?.errors?.["name"]?.[0] && (
            <p className="text-destructive">{state?.errors?.["name"]?.[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Location</Label>
          <input type="hidden" name="latitude" value={location?.lat ?? ''} />
          <input type="hidden" name="longitude" value={location?.lng ?? ''} />
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setLocation({
                      lat: position.coords.latitude,
                      lng: position.coords.longitude
                    });
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
            }}
          >
            <MapPin className="h-4 w-4" />
            {location ? 'Update Location' : 'Get My Location'}
          </Button>
          {location && (
            <p className="text-sm text-muted-foreground mt-1">
              Location set: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Price</Label>
          <Input
            placeholder="29$"
            type="number"
            name="price"
            required
            min={1}
          />
          {state?.errors?.["price"]?.[0] && (
            <p className="text-destructive">{state?.errors?.["price"]?.[0]}</p>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <Label>Description</Label>
          <Textarea
            name="description"
            placeholder="Please describe your product in detail..."
            required
            minLength={10}
          />
          {state?.errors?.["description"]?.[0] && (
            <p className="text-destructive">
              {state?.errors?.["description"]?.[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-y-2">
          <input type="hidden" name="images" value={JSON.stringify(images)} />
          <Label>Product Images</Label>
          <UploadDropzone
            endpoint="imageUploader"
            onClientUploadComplete={(res: { url: string }[]) => {
              setImages(res.map((item: { url: string }) => item.url));
              toast.success("Your images have been uploaded");
            }}
            onUploadError={(error: Error) => {
              toast.error("Something went wrong, try again");
            }}
          />
          {state?.errors?.["images"]?.[0] && (
            <p className="text-destructive">{state?.errors?.["images"]?.[0]}</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-5">
        <Submitbutton title="Create your Product" />
      </CardFooter>
    </form>
  );
}
