"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, X, Search, Package, Store, Sprout, MapPin } from "lucide-react";
import { useLocation } from "@/components/providers/LocationProvider";
import { useRouter } from "next/navigation";

export type ResultType = 'all' | 'products' | 'stands' | 'farms';

export interface SearchFilterState {
  resultType: ResultType;
  categories: string[];
  distance: number;
  priceMin: number | null;
  priceMax: number | null;
  fulfillment: ("pickup" | "delivery")[];
}

export interface SearchFiltersProps {
  searchQuery: string;
  onSearchClear: () => void;
  zipCode: string;
  filters: SearchFilterState;
  onFiltersChange: (filters: SearchFilterState) => void;
  counts: {
    all: number;
    products: number;
    stands: number;
    farms: number;
  };
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

const RESULT_TYPES: { value: ResultType; label: string; icon: typeof Package }[] = [
  { value: "all", label: "All Results", icon: Search },
  { value: "products", label: "Products", icon: Package },
  { value: "stands", label: "Market Stands", icon: Store },
  { value: "farms", label: "Farms", icon: Sprout },
];

export const DEFAULT_SEARCH_FILTERS: SearchFilterState = {
  resultType: 'all',
  categories: [],
  distance: 100,
  priceMin: null,
  priceMax: null,
  fulfillment: [],
};

export function SearchFilters({
  searchQuery,
  onSearchClear,
  zipCode,
  filters,
  onFiltersChange,
  counts,
}: SearchFiltersProps) {
  const router = useRouter();
  const { setZipCode: setLocationZipCode, useMyLocation, searchByZip, isLoading } = useLocation();
  
  const [expandedSections, setExpandedSections] = useState({
    resultType: true,
    categories: true,
    distance: true,
    price: true,
    fulfillment: true,
  });
  
  const [localZip, setLocalZip] = useState(zipCode);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync local state with props when URL changes
  useEffect(() => {
    setLocalZip(zipCode);
  }, [zipCode]);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Sync LocationProvider with current zip code
  useEffect(() => {
    if (zipCode && zipCode.length === 5) {
      setLocationZipCode(zipCode);
    }
  }, [zipCode, setLocationZipCode]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setLocalZip(value);
  };
  
  const handleZipSearch = () => {
    if (localZip && localZip.length === 5) {
      setLocationZipCode(localZip);
      const params = new URLSearchParams();
      params.set('zip', localZip);
      if (searchQuery) {
        params.set('q', searchQuery);
      }
      router.push(`/search?${params.toString()}`);
    }
  };
  
  const handleZipKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localZip.length === 5) {
      handleZipSearch();
    }
  };
  
  const handleUseMyLocation = async () => {
    await useMyLocation();
    // Wait a moment for location to update, then trigger search
    setTimeout(() => {
      const params = new URLSearchParams();
      const currentZip = localZip;
      if (currentZip) {
        params.set('zip', currentZip);
      }
      if (searchQuery) {
        params.set('q', searchQuery);
      }
      router.push(`/search?${params.toString()}`);
    }, 1000);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  };
  
  const handleSearchSubmit = () => {
    const params = new URLSearchParams();
    params.set('zip', zipCode);
    if (localSearch.trim()) {
      params.set('q', localSearch.trim());
    }
    router.push(`/search?${params.toString()}`);
  };
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };
  
  const handleSearchClear = () => {
    setLocalSearch('');
    const params = new URLSearchParams();
    params.set('zip', zipCode);
    router.push(`/search?${params.toString()}`);
  };

  const handleResultTypeChange = useCallback(
    (type: ResultType) => {
      onFiltersChange({ ...filters, resultType: type });
    },
    [filters, onFiltersChange]
  );

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
    onFiltersChange(DEFAULT_SEARCH_FILTERS);
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
        {/* Zip Code Input Section */}
        <div>
          <Label htmlFor="sidebar-zip" className="text-sm font-semibold text-gray-900 mb-2 block">
            Location
          </Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="sidebar-zip"
                type="text"
                inputMode="numeric"
                placeholder="Zip Code"
                value={localZip}
                onChange={handleZipChange}
                onKeyDown={handleZipKeyDown}
                className="pl-9 h-10"
                maxLength={5}
              />
            </div>
            <Button
              onClick={handleUseMyLocation}
              variant="outline"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              title="Use my location"
              disabled={isLoading}
            >
              <MapPin className="h-4 w-4" />
            </Button>
            {localZip.length === 5 && localZip !== zipCode && (
              <Button
                onClick={handleZipSearch}
                size="icon"
                className="h-10 w-10 flex-shrink-0 bg-[#E07A2D] hover:bg-[#C96A20]"
                title="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search Input Section */}
        <div>
          <Label htmlFor="sidebar-search" className="text-sm font-semibold text-gray-900 mb-2 block">
            Search Term
          </Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="sidebar-search"
                type="text"
                placeholder="Search products, stands, farms..."
                value={localSearch}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 h-10"
              />
            </div>
            {localSearch && (
              <Button
                onClick={handleSearchClear}
                variant="outline"
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {localSearch !== searchQuery && (
              <Button
                onClick={handleSearchSubmit}
                size="icon"
                className="h-10 w-10 flex-shrink-0 bg-[#E07A2D] hover:bg-[#C96A20]"
                title="Search"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Result Type Section */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => toggleSection("resultType")}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 mb-2"
          >
            <span>Show Results</span>
            {expandedSections.resultType ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.resultType && (
            <div className="space-y-1">
              {RESULT_TYPES.map((type) => {
                const Icon = type.icon;
                const count = counts[type.value];
                const isActive = filters.resultType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleResultTypeChange(type.value)}
                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-[#0B4D2C] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{type.label}</span>
                    </div>
                    <span className={`text-xs ${isActive ? "text-white/80" : "text-gray-500"}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Categories Section */}
        <div className="border-t border-gray-200 pt-4">
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
                    id={`search-category-${category.id}`}
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={(checked) =>
                      handleCategoryChange(category.id, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`search-category-${category.id}`}
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
                <Label htmlFor="search-price-min" className="sr-only">
                  Minimum price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <Input
                    id="search-price-min"
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
                <Label htmlFor="search-price-max" className="sr-only">
                  Maximum price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    $
                  </span>
                  <Input
                    id="search-price-max"
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
                  id="search-fulfillment-pickup"
                  checked={filters.fulfillment.includes("pickup")}
                  onCheckedChange={(checked) =>
                    handleFulfillmentChange("pickup", checked as boolean)
                  }
                />
                <Label
                  htmlFor="search-fulfillment-pickup"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Pickup Available
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="search-fulfillment-delivery"
                  checked={filters.fulfillment.includes("delivery")}
                  onCheckedChange={(checked) =>
                    handleFulfillmentChange("delivery", checked as boolean)
                  }
                />
                <Label
                  htmlFor="search-fulfillment-delivery"
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
      {hasActiveFilters && (
        <div className="border-t border-gray-200 p-4">
          <Button
            onClick={handleClear}
            variant="outline"
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
