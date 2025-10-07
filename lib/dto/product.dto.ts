import { Status } from "@prisma/client";

// Base product DTO
export interface ProductDTO {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  inventory: number;
  inventoryUpdatedAt: string | null;
  status: Status;
  isActive: boolean;
  userId: string;
  marketStandId: string;
  createdAt: string;
  updatedAt: string;
  totalReviews: number;
  averageRating: number | null;
  tags: string[];
}

// Product with market stand details
export interface ProductWithMarketStandDTO extends ProductDTO {
  marketStand: {
    id: string;
    name: string;
    locationName?: string;
    latitude: number;
    longitude: number;
  };
  locationName?: string;
}

// Product creation DTO
export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  images: string[];
  inventory: number;
  inventoryUpdatedAt?: string | null;
  status: Status;
  isActive: boolean;
  userId: string;
  marketStandId: string;
  tags: string[];
}

// Product update DTO
export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  images?: string[];
  inventory?: number;
  inventoryUpdatedAt?: string | null;
  status?: Status;
  isActive?: boolean;
  tags?: string[];
}

// Product query filters
export interface ProductQueryFilters {
  userId?: string;
  marketStandId?: string;
  limit?: number;
  cursor?: string;
  isActive?: boolean;
}

// Product list response
export interface ProductListDTO {
  products: ProductWithMarketStandDTO[];
  nextCursor?: string;
  hasMore: boolean;
}
