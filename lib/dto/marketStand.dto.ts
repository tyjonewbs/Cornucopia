import { Status } from "@prisma/client";

// Weekly hours type
export interface DayHours {
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface WeeklyHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

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
