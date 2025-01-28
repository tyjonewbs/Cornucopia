'use client';

import { ProductRow } from "@/components/ProductRow";
import useUserLocation from "@/app/hooks/useUserLocation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SerializedProduct, getHomeProducts, UserLocation } from "./actions/home-products";
import { geocodeZipCode } from "./actions/geocode";
import { useState, useEffect } from "react";

interface HomeClientProps {
  initialProducts: SerializedProduct[];
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  const [zipCode, setZipCode] = useState("");
  const [zipError, setZipError] = useState<string | null>(null);
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userLocation, setManualLocation, clearLocation } = useUserLocation();

  const updateProducts = async (location: UserLocation | null) => {
    setError(null);
    setIsLoading(true);
    try {
      const updatedProducts = await getHomeProducts(location);
      if (updatedProducts.length === 0) {
        setError("No products found in your area");
      }
      setProducts(updatedProducts);
    } catch (error) {
      setError("Failed to load products. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) {
      updateProducts(userLocation);
    }
  }, [userLocation]);

  const handleZipSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setZipError(null);

    if (!zipCode.match(/^\d{5}$/)) {
      setZipError("Please enter a valid 5-digit zip code");
      return;
    }

    const coords = await geocodeZipCode(zipCode);
    if (!coords) {
      setZipError("Could not find location for this zip code");
      return;
    }

    const location = {
      coords: {
        lat: coords.lat,
        lng: coords.lng,
        accuracy: 0,
        timestamp: Date.now()
      }
    };
    setManualLocation(location);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-24">
      <div className="mb-8 p-4">
        <form onSubmit={handleZipSubmit} className="flex gap-3 max-w-sm">
          <div className="flex-1 space-y-2">
            <Input
              type="text"
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              maxLength={5}
              className={zipError ? "border-red-500" : ""}
            />
            {zipError && (
              <p className="text-red-500 text-sm mt-1">{zipError}</p>
            )}
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Search"}
          </Button>
          <Button 
            type="button" 
            variant="outline"
            disabled={isLoading || !userLocation}
            onClick={async () => {
              clearLocation();
              setZipCode("");
              setZipError(null);
              setError(null);
              await updateProducts(null);
            }}
          >
            Clear
          </Button>
        </form>
      </div>
      {error ? (
        <p className="text-red-500 mt-4">{error}</p>
      ) : (
        <ProductRow 
          title="Local Products" 
          initialProducts={products}
        />
      )}
    </section>
  );
}
