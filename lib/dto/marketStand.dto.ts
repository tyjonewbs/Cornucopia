import { Status } from "@prisma/client";
import { WeeklyHours } from "@/types/hours";

// Re-export WeeklyHours for backward compatibility
export type { WeeklyHours };

// Base market stand DTO
export interface MarketStandDTO {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  tags: string[];
  latitude: number;
  longitude: number;
  locationName: string;
  streetAddress: string | null;
  city: string | null;
  zipCode: string | null;
  locationGuide: string;
  website: string | null;
  socialMedia: string[];
  status: Status;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  averageRating: number | null;
  totalReviews: number;
  hours: WeeklyHours | null;
}

// Market stand creation DTO
export interface CreateMarketStandDTO {
  userId: string;
  name: string;
  description: string;
  locationName: string;
  streetAddress?: string | null;
  city?: string | null;
  zipCode?: string | null;
  locationGuide: string;
  latitude: number;
  longitude: number;
  website?: string | null;
  images: string[];
  tags: string[];
  socialMedia: string[];
  hours: WeeklyHours;
  status: Status;
  isActive: boolean;
}

// Market stand update DTO
export interface UpdateMarketStandDTO {
  name?: string;
  description?: string;
  locationName?: string;
  streetAddress?: string | null;
  city?: string | null;
  zipCode?: string | null;
  locationGuide?: string;
  latitude?: number;
  longitude?: number;
  website?: string | null;
  images?: string[];
  tags?: string[];
  socialMedia?: string[];
  hours?: WeeklyHours;
  status?: Status;
  isActive?: boolean;
}

// Market stand query filters
export interface MarketStandQueryFilters {
  userId?: string;
  limit?: number;
  cursor?: string;
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
}

// Market stand list response
export interface MarketStandListDTO {
  marketStands: MarketStandDTO[];
  nextCursor?: string;
  hasMore: boolean;
}

// Market stand with distance (for location-based queries)
export interface MarketStandWithDistanceDTO extends MarketStandDTO {
  distanceKm: number;
}
