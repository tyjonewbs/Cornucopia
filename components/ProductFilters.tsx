"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, X } from "lucide-react";

export interface ProductFilterState {
  categories: string[];
  distance: number;
  priceMin: number | null;
  priceMax: number | null;
  fulfillment: ("pickup" | "delivery")[];
}

export interface ProductFiltersProps {
  filters: ProductFilterState;
  onFiltersChange: (filters: ProductFilterState) => void;
  onApply?: () => void;
  onClear?: () => void;
}

const CATEGORIES = [
  { id: "vegetables", label: "Vegetables" },
  { id: "fruits", label: "Fruits" },
  { id: "dairy", label: "Dairy & Eggs" },
  { id: "meat", label: "Meat & Poultry" },
  { id: "baked-goods", label: "Baked Goods" },
  { id: "honey", label: "Honey & Preserves" },
  { id: "herbs", label: "Herbs & Spices" },
  { id: "flowers", label: "Flowers & Plants" },
  { id: "crafts", label: "Artisan Crafts" },
  { id: "other", label: "Other" },
];

const DISTANCE_PRESETS = [
  { value: 5, label: "5 mi" },
  { value: 10, label: "10 mi" },
  { value: 25, label: "25 mi" },
  { value: 50, label: "50 mi" },
  { value: 100, label: "100 mi" },
];

export const DEFAULT_FILTERS: ProductFilterState = {
  categories: [],
  distance: 100,
  priceMin: null,
  priceMax: null,
  fulfillment: [],
};

export function ProductFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
}: ProductFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    distance: true,
    price: true,
    fulfillment: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCategoryChange = useCallback(
    (categoryId: string, checked: boolean) => {
      const newCategories = checked
        ? [...filters.categories, categoryId]
        : filters.categories.filter((c) => c !== categoryId);
      onFiltersChange({ ...filters, categories: newCategories });
    },
    [filters, onFiltersChange]
  );

  const handleDistanceChange = useCallback(
    (value: number[]) => {
      onFiltersChange({ ...filters, distance: value[0] });
    },
    [filters, onFiltersChange]
  );

  const handlePriceChange = useCallback(
    (field: "priceMin" | "priceMax", value: string) => {
      const numValue = value === "" ? null : parseFloat(value);
      onFiltersChange({ ...filters, [field]: numValue });
    },
    [filters, onFiltersChange]
  );

  const handleFulfillmentChange = useCallback(
    (type: "pickup" | "delivery", checked: boolean) => {
      const newFulfillment = checked
        ? [...filters.fulfillment, type]
        : filters.fulfillment.filter((f) => f !== type);
      onFiltersChange({ ...filters, fulfillment: newFulfillment });
    },
    [filters, onFiltersChange]
  );

  const handleClear = () => {
    onFiltersChange(DEFAULT_FILTERS);
    onClear?.();
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.distance !== 100 ||
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.fulfillment.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Categories Section */}
        <div>
          <button
            onClick={() => toggleSection("categories")}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 mb-2"
          >
            <span>Categories</span>
            {expandedSections.categories ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.categories && (
            <div className="space-y-2">
              {CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(category.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`category-${category.id}`}
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distance Section */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => toggleSection("distance")}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 mb-2"
          >
            <span>Distance</span>
            {expandedSections.distance ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.distance && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Within</span>
                <span className="font-medium">{filters.distance} miles</span>
              </div>
              <Slider
                value={[filters.distance]}
                onValueChange={handleDistanceChange}
                max={100}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex flex-wrap gap-2">
                {DISTANCE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleDistanceChange([preset.value])}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      filters.distance === preset.value
                        ? "bg-[#0B4D2C] text-white border-[#0B4D2C]"
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price Range Section */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => toggleSection("price")}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 mb-2"
          >
            <span>Price Range</span>
            {expandedSections.price ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.price && (
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label htmlFor="price-min" className="sr-only">
                  Minimum price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <Input
                    id="price-min"
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin ?? ""}
                    onChange={(e) => handlePriceChange("priceMin", e.target.value)}
                    className="pl-7 h-9"
                    min={0}
                  />
                </div>
              </div>
              <span className="text-gray-400">-</span>
              <div className="flex-1">
                <Label htmlFor="price-max" className="sr-only">
                  Maximum price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <Input
                    id="price-max"
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax ?? ""}
                    onChange={(e) => handlePriceChange("priceMax", e.target.value)}
                    className="pl-7 h-9"
                    min={0}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fulfillment Section */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => toggleSection("fulfillment")}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 mb-2"
          >
            <span>Fulfillment</span>
            {expandedSections.fulfillment ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.fulfillment && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fulfillment-pickup"
                  checked={filters.fulfillment.includes("pickup")}
                  onCheckedChange={(checked) =>
                    handleFulfillmentChange("pickup", checked as boolean)
                  }
                />
                <Label
                  htmlFor="fulfillment-pickup"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Pickup Available
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fulfillment-delivery"
                  checked={filters.fulfillment.includes("delivery")}
                  onCheckedChange={(checked) =>
                    handleFulfillmentChange("delivery", checked as boolean)
                  }
                />
                <Label
                  htmlFor="fulfillment-delivery"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Delivery Available
                </Label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 p-4 space-y-2">
        {onApply && (
          <Button
            onClick={onApply}
            className="w-full bg-[#0B4D2C] hover:bg-[#0B4D2C]/90"
          >
            Apply Filters
          </Button>
        )}
        {hasActiveFilters && (
          <Button
            onClick={handleClear}
            variant="outline"
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}
