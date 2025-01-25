"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

interface InventoryManagerProps {
  currentInventory: number;
  onUpdate: (newInventory: number) => Promise<void>;
}

export function InventoryManager({ 
  currentInventory,
  onUpdate 
}: InventoryManagerProps) {
  const [inventory, setInventory] = useState(currentInventory);
  const [pendingInventory, setPendingInventory] = useState(currentInventory);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (change: number) => {
    const newInventory = pendingInventory + change;
    if (newInventory < 0) return;
    setPendingInventory(newInventory);
  };

  const handleDirectInput = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setPendingInventory(num);
  };

  const handleSubmit = async () => {
    if (pendingInventory === inventory) return;
    
    setIsUpdating(true);
    try {
      await onUpdate(pendingInventory);
      setInventory(pendingInventory);
      toast.success("Inventory updated successfully");
    } catch {
      setPendingInventory(inventory); // Reset to last saved value
      toast.error("Failed to update inventory");
    } finally {
      setIsUpdating(false);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleChange(-1)}
        disabled={pendingInventory === 0 || isUpdating}
      >
        <Minus className="h-4 w-4" />
      </Button>
      {isEditing ? (
        <Input
          type="number"
          value={pendingInventory}
          onChange={(e) => handleDirectInput(e.target.value)}
          className="w-20 text-center"
          min="0"
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
              handleSubmit();
            }
          }}
          autoFocus
        />
      ) : (
        <Button
          variant="ghost"
          className="min-w-[3ch] px-2 h-9"
          onClick={() => setIsEditing(true)}
        >
          {pendingInventory}
        </Button>
      )}
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleChange(1)}
        disabled={isUpdating}
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={handleSubmit}
        disabled={pendingInventory === inventory || isUpdating}
      >
        Submit
      </Button>
    </div>
  );
}
