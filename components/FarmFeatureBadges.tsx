"use client";

import { Sprout, Leaf, Award, Sun, Heart, Apple, Wheat, TreeDeciduous } from "lucide-react";

interface FarmFeatureBadgesProps {
  tags: string[];
}

// Map tags to icons
const getIconForTag = (tag: string) => {
  const lowerTag = tag.toLowerCase();
  
  if (lowerTag.includes("seasonal") || lowerTag.includes("season")) {
    return Sun;
  } else if (lowerTag.includes("organic")) {
    return Leaf;
  } else if (lowerTag.includes("sustainable") || lowerTag.includes("eco")) {
    return TreeDeciduous;
  } else if (lowerTag.includes("local")) {
    return Heart;
  } else if (lowerTag.includes("fruit")) {
    return Apple;
  } else if (lowerTag.includes("grain") || lowerTag.includes("wheat")) {
    return Wheat;
  } else if (lowerTag.includes("award") || lowerTag.includes("certified")) {
    return Award;
  }
  
  // Default icon
  return Sprout;
};

export function FarmFeatureBadges({ tags }: FarmFeatureBadgesProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {tags.map((tag, index) => {
        const Icon = getIconForTag(tag);
        return (
          <div
            key={index}
            className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg text-sm text-green-800"
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{tag}</span>
          </div>
        );
      })}
    </div>
  );
}
