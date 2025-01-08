'use client';

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2 } from "lucide-react";

interface InventoryManagerProps {
  productId: string;
  currentInventory: number;
  lastUpdated: Date | null;
  isOwner: boolean;
}

export function InventoryManager({ productId, currentInventory, lastUpdated, isOwner }: InventoryManagerProps) {
  const [inventory, setInventory] = useState(currentInventory);
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
          id: productId,
          inventory: inventory,
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
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Inventory:</h3>
        <span className="text-sm font-medium">{currentInventory} units</span>
      </div>

      {lastUpdated && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Last Updated:</h3>
          <span className="text-sm text-muted-foreground">
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(lastUpdated))}
          </span>
        </div>
      )}

      {isOwner && (
        <div className="space-y-4 border-t pt-4 mt-4">
          <h3 className="text-sm font-medium">Update Inventory</h3>
          <div className="flex items-center gap-4">
            <Input
              id="inventory-amount"
              type="number"
              min="0"
              value={inventory}
              onChange={(e) => setInventory(Number(e.target.value))}
              className="w-24"
              aria-label="New inventory amount"
              aria-describedby={error ? "inventory-error" : undefined}
            />
            <Button 
              onClick={handleUpdate} 
              disabled={isLoading || inventory === currentInventory}
              size="sm"
              aria-label={isLoading ? "Updating inventory..." : "Update inventory"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                "Update"
              )}
            </Button>
          </div>
          {error && (
            <p 
              id="inventory-error" 
              className="text-sm font-medium text-destructive mt-1.5"
            >
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
