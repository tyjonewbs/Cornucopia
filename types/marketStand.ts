/**
 * Market Stand types
 */

import { Status } from '@prisma/client';
import { WeeklyHours } from './hours';

export interface MarketStand {
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
  hours: WeeklyHours | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  averageRating: number | null;
  totalReviews: number;
}

export interface MarketStandWithDistance extends MarketStand {
  distanceKm: number;
}

export interface MarketStandWithProducts extends MarketStand {
  products: Array<{
    id: string;
    name: string;
    price: number;
    images: string[];
    inventory: number;
  }>;
  productCount: number;
}

export interface CreateMarketStandInput {
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
}

export interface UpdateMarketStandInput {
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

export interface MarketStandFilters {
  userId?: string;
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  tags?: string[];
  search?: string;
}

export interface MarketStandListResponse {
  marketStands: MarketStand[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}
