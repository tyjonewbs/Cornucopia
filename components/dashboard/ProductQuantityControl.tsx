"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";

interface ProductQuantityControlProps {
  quantity: number;
  onUpdate: (newQuantity: number) => void;
  min?: number;
  max?: number;
}

export function ProductQuantityControl({
  quantity,
  onUpdate,
  min = 0,
  max = Infinity,
}: ProductQuantityControlProps) {
  const [isEditing, setIsEditing] = useState(false);
  const safeQuantity = quantity ?? 0;
  const [currentQuantity, setCurrentQuantity] = useState(safeQuantity);
  const [inputValue, setInputValue] = useState(safeQuantity.toString());

  useEffect(() => {
    setCurrentQuantity(safeQuantity);
    setInputValue(safeQuantity.toString());
  }, [safeQuantity]);

  const handleIncrement = () => {
    const newValue = Math.min(currentQuantity + 1, max);
    setCurrentQuantity(newValue);
    setInputValue(newValue.toString());
  };

  const handleDecrement = () => {
    const newValue = Math.max(currentQuantity - 1, min);
    setCurrentQuantity(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleInputBlur = () => {
    const newValue = parseInt(inputValue, 10);
    if (!isNaN(newValue)) {
      const clampedValue = Math.min(Math.max(newValue, min), max);
      setCurrentQuantity(clampedValue);
      setInputValue(clampedValue.toString());
    } else {
      setInputValue(currentQuantity.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  const handleUpdate = () => {
    onUpdate(currentQuantity);
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={currentQuantity <= min}
        className="h-8 w-8"
      >
        <Minus className="h-4 w-4" />
      </Button>

      {isEditing ? (
        <Input
          type="number"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          className="w-16 h-8 text-center"
          autoFocus
        />
      ) : (
        <Button
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="w-16 h-8 px-2"
        >
          {currentQuantity}
        </Button>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={currentQuantity >= max}
        className="h-8 w-8"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        variant="default"
        onClick={handleUpdate}
        className="h-8"
      >
        Update
      </Button>
    </div>
  );
}
