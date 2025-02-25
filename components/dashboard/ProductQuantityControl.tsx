"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus } from "lucide-react";

interface ProductQuantityControlProps {
  quantity: number;
  onChange: (newQuantity: number) => void;
  min?: number;
  max?: number;
}

export function ProductQuantityControl({
  quantity,
  onChange,
  min = 0,
  max = Infinity,
}: ProductQuantityControlProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(quantity.toString());

  useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

  const handleIncrement = () => {
    const newValue = Math.min(quantity + 1, max);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(quantity - 1, min);
    onChange(newValue);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleInputBlur = () => {
    const newValue = parseInt(inputValue, 10);
    if (!isNaN(newValue)) {
      const clampedValue = Math.min(Math.max(newValue, min), max);
      onChange(clampedValue);
    } else {
      setInputValue(quantity.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={quantity <= min}
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
          {quantity}
        </Button>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={quantity >= max}
        className="h-8 w-8"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
