'use client';

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductDashboardCardProps {
  id: string;
  name: string;
  images: string[];
  inventory: number;
  inventoryUpdatedAt: Date | null;
}

export function ProductDashboardCard({ id, name, images, inventory, inventoryUpdatedAt }: ProductDashboardCardProps) {
  const [currentInventory, setCurrentInventory] = useState(inventory);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/product`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          inventory: currentInventory,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update inventory");
      }

      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error("Error updating inventory:", error);
      setError("Failed to update inventory");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border bg-card text-card-foreground shadow-sm">
      <div className="relative h-[200px]">
        <Image
          alt={name}
          src={images[0]}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{name}</h3>
          <Link href={`/dashboard/edit-product/${id}`}>
            <Button variant="ghost" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Current Inventory:</span>
            <span>{inventory} units</span>
          </div>

          {inventoryUpdatedAt && (
            <div className="text-xs text-muted-foreground">
              Last updated: {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(inventoryUpdatedAt))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              value={currentInventory}
              onChange={(e) => setCurrentInventory(Number(e.target.value))}
              className="w-24"
            />
            <Button 
              onClick={handleUpdate} 
              disabled={isLoading || currentInventory === inventory}
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
