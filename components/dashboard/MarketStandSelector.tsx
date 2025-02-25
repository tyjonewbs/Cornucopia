"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MarketStand {
  id: string;
  name: string;
}

interface MarketStandSelectorProps {
  marketStands: MarketStand[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function MarketStandSelector({
  marketStands,
  selectedId,
  onSelect,
}: MarketStandSelectorProps) {
  return (
    <div className="w-full max-w-xs">
      <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select a market stand" />
        </SelectTrigger>
        <SelectContent>
          {marketStands.map((stand) => (
            <SelectItem key={stand.id} value={stand.id}>
              {stand.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
