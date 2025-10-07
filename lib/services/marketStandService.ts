import { marketStandRepository } from "@/lib/repositories/marketStandRepository";
import {
  createMarketStandSchema,
  updateMarketStandSchema,
  getMarketStandsQuerySchema,
  marketStandIdSchema,
  type CreateMarketStandInput,
  type UpdateMarketStandInput,
  type GetMarketStandsQuery,
} from "@/lib/validators/marketStandSchemas";
import { MarketStandDTO, MarketStandQueryFilters } from "@/lib/dto/marketStand.dto";
import { handleDatabaseError } from "@/lib/error-handler";
import { ZodError } from "zod";

/**
 * Market Stand Service - Contains business logic for market stand operations
 * Uses repository for data access and validators for input validation
 */
export class MarketStandService {
  /**
   * Get multiple market stands with filtering
   */
  async getMarketStands(query: GetMarketStandsQuery): Promise<MarketStandDTO[]> {
    try {
      // Validate query parameters
      const validatedQuery = getMarketStandsQuerySchema.parse(query);

      // If location-based search is requested
      if (
        validatedQuery.latitude !== undefined &&
        validatedQuery.longitude !== undefined &&
        validatedQuery.radiusKm !== undefined
      ) {
        return await marketStandRepository.findByLocation(
          validatedQuery.latitude,
          validatedQuery.longitude,
          validatedQuery.radiusKm,
          {
            limit: validatedQuery.limit,
            isActive: validatedQuery.isActive,
          }
        );
      }

      // Use repository to fetch data
      return await marketStandRepository.findMany(validatedQuery);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }

      const errorData = handleDatabaseError(error, "Failed to fetch market stands", {
        query,
      });
      console.error('Error fetching market stands:', errorData);
      return [];
    }
  }

  /**
   * Get a single market stand by ID
   */
  async getMarketStandById(id: string): Promise<MarketStandDTO | null> {
    try {
      // Validate ID
      const validatedId = marketStandIdSchema.parse(id);

      // Use repository to fetch data
      return await marketStandRepository.findById(validatedId);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Invalid market stand ID: ${error.errors[0].message}`);
      }

      const errorData = handleDatabaseError(error, "Failed to fetch market stand", {
        marketStandId: id,
      });
      console.error('Error fetching market stand:', errorData);
      return null;
    }
  }

  /**
   * Create a new market stand
   */
  async createMarketStand(input: CreateMarketStandInput): Promise<MarketStandDTO> {
    try {
      // Validate input
      const validatedData = createMarketStandSchema.parse(input);

      // Business logic validations could go here
      // For example: Check if user already has a market stand, validate location, etc.

      // Use repository to create market stand
      return await marketStandRepository.create(validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }

      const errorData = handleDatabaseError(error, "Failed to create market stand", {
        name: input.name,
        userId: input.userId,
      });
      throw new Error(errorData.error);
    }
  }

  /**
   * Update an existing market stand
   */
  async updateMarketStand(
    id: string,
    input: UpdateMarketStandInput
  ): Promise<MarketStandDTO> {
    try {
      // Validate ID and input
      const validatedId = marketStandIdSchema.parse(id);
      const validatedData = updateMarketStandSchema.parse(input);

      // Check if market stand exists
      const exists = await marketStandRepository.exists(validatedId);
      if (!exists) {
        throw new Error(`Market stand with ID ${validatedId} not found`);
      }

      // Use repository to update market stand
      return await marketStandRepository.update(validatedId, validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }

      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }

      const errorData = handleDatabaseError(error, "Failed to update market stand", {
        marketStandId: id,
      });
      throw new Error(errorData.error);
    }
  }

  /**
   * Delete a market stand
   */
  async deleteMarketStand(id: string): Promise<void> {
    try {
      // Validate ID
      const validatedId = marketStandIdSchema.parse(id);

      // Check if market stand exists
      const exists = await marketStandRepository.exists(validatedId);
      if (!exists) {
        throw new Error(`Market stand with ID ${validatedId} not found`);
      }

      // Business logic: Check if there are associated products
      // (You might want to prevent deletion if products exist, or cascade delete)

      // Use repository to delete market stand
      await marketStandRepository.delete(validatedId);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Invalid market stand ID: ${error.errors[0].message}`);
      }

      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }

      const errorData = handleDatabaseError(error, "Failed to delete market stand", {
        marketStandId: id,
      });
      throw new Error(errorData.error);
    }
  }

  /**
   * Get market stands by user ID
   */
  async getMarketStandsByUserId(
    userId: string,
    filters?: Omit<MarketStandQueryFilters, 'userId'>
  ): Promise<MarketStandDTO[]> {
    try {
      return await marketStandRepository.findByUserId(userId);
    } catch (error) {
      const errorData = handleDatabaseError(error, "Failed to fetch user market stands", {
        userId,
      });
      console.error('Error fetching user market stands:', errorData);
      return [];
    }
  }

  /**
   * Get market stands near a location
   */
  async getMarketStandsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10
  ): Promise<MarketStandDTO[]> {
    try {
      return await marketStandRepository.findByLocation(latitude, longitude, radiusKm);
    } catch (error) {
      const errorData = handleDatabaseError(error, "Failed to fetch nearby market stands", {
        latitude,
        longitude,
        radiusKm,
      });
      console.error('Error fetching nearby market stands:', errorData);
      return [];
    }
  }

  /**
   * Check if user owns market stand
   */
  async checkMarketStandOwnership(marketStandId: string, userId: string): Promise<boolean> {
    try {
      const marketStand = await marketStandRepository.findByIdAndUserId(marketStandId, userId);
      return marketStand !== null;
    } catch (error) {
      console.error('Error checking market stand ownership:', error);
      return false;
    }
  }

  /**
   * Count market stands with optional filters
   */
  async countMarketStands(filters: Omit<MarketStandQueryFilters, 'limit' | 'cursor'>): Promise<number> {
    try {
      return await marketStandRepository.count(filters);
    } catch (error) {
      const errorData = handleDatabaseError(error, "Failed to count market stands", {
        filters,
      });
      console.error('Error counting market stands:', errorData);
      return 0;
    }
  }
}

// Export singleton instance
export const marketStandService = new MarketStandService();
