import { productRepository } from "@/lib/repositories/productRepository";
import {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
  productIdSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type GetProductsQuery,
} from "@/lib/validators/productSchemas";
import {
  ProductWithMarketStandDTO,
  ProductQueryFilters,
} from "@/lib/dto/product.dto";
import { handleDatabaseError } from "@/lib/error-handler";
import { ZodError } from "zod";

/**
 * Product Service - Contains business logic for product operations
 * Uses repository for data access and validators for input validation
 */
export class ProductService {
  /**
   * Get multiple products with filtering
   */
  async getProducts(query: GetProductsQuery): Promise<ProductWithMarketStandDTO[]> {
    try {
      // Validate query parameters
      const validatedQuery = getProductsQuerySchema.parse(query);

      // Use repository to fetch data
      return await productRepository.findMany(validatedQuery);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }

      const errorData = handleDatabaseError(error, "Failed to fetch products", {
        query,
      });
      console.error('Error fetching products:', errorData);
      return [];
    }
  }

  /**
   * Get a single product by ID
   */
  async getProductById(id: string): Promise<ProductWithMarketStandDTO | null> {
    try {
      // Validate ID
      const validatedId = productIdSchema.parse(id);

      // Use repository to fetch data
      return await productRepository.findById(validatedId);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Invalid product ID: ${error.errors[0].message}`);
      }

      const errorData = handleDatabaseError(error, "Failed to fetch product", {
        productId: id,
      });
      console.error('Error fetching product:', errorData);
      return null;
    }
  }

  /**
   * Create a new product
   */
  async createProduct(input: CreateProductInput): Promise<ProductWithMarketStandDTO> {
    try {
      // Validate input
      const validatedData = createProductSchema.parse(input);

      // Convert inventoryUpdatedAt string to Date if provided
      const createData = {
        ...validatedData,
        inventoryUpdatedAt: validatedData.inventoryUpdatedAt
          ? new Date(validatedData.inventoryUpdatedAt)
          : null,
      };

      // Business logic: Ensure market stand exists before creating product
      // (This could be expanded with additional business rules)

      // Use repository to create product
      return await productRepository.create(createData);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }

      const errorData = handleDatabaseError(error, "Failed to create product", {
        name: input.name,
        userId: input.userId,
        marketStandId: input.marketStandId,
      });
      throw new Error(errorData.error);
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(
    id: string,
    input: UpdateProductInput
  ): Promise<ProductWithMarketStandDTO> {
    try {
      // Validate ID and input
      const validatedId = productIdSchema.parse(id);
      const validatedData = updateProductSchema.parse(input);

      // Check if product exists
      const exists = await productRepository.exists(validatedId);
      if (!exists) {
        throw new Error(`Product with ID ${validatedId} not found`);
      }

      // Convert inventoryUpdatedAt string to Date if provided
      const updateData = {
        ...validatedData,
        inventoryUpdatedAt:
          validatedData.inventoryUpdatedAt !== undefined
            ? validatedData.inventoryUpdatedAt
              ? new Date(validatedData.inventoryUpdatedAt)
              : null
            : undefined,
      };

      // Use repository to update product
      return await productRepository.update(validatedId, updateData);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
      }

      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }

      const errorData = handleDatabaseError(error, "Failed to update product", {
        productId: id,
      });
      throw new Error(errorData.error);
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string): Promise<void> {
    try {
      // Validate ID
      const validatedId = productIdSchema.parse(id);

      // Check if product exists
      const exists = await productRepository.exists(validatedId);
      if (!exists) {
        throw new Error(`Product with ID ${validatedId} not found`);
      }

      // Use repository to delete product
      await productRepository.delete(validatedId);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Invalid product ID: ${error.errors[0].message}`);
      }

      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }

      const errorData = handleDatabaseError(error, "Failed to delete product", {
        productId: id,
      });
      throw new Error(errorData.error);
    }
  }

  /**
   * Update product inventory
   */
  async updateProductInventory(
    id: string,
    inventory: number
  ): Promise<ProductWithMarketStandDTO> {
    try {
      // Validate ID and inventory
      const validatedId = productIdSchema.parse(id);

      if (inventory < 0) {
        throw new Error('Inventory cannot be negative');
      }

      // Check if product exists
      const exists = await productRepository.exists(validatedId);
      if (!exists) {
        throw new Error(`Product with ID ${validatedId} not found`);
      }

      // Use repository to update inventory
      return await productRepository.updateInventory(validatedId, inventory);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new Error(`Invalid product ID: ${error.errors[0].message}`);
      }

      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('cannot be negative'))) {
        throw error;
      }

      const errorData = handleDatabaseError(error, "Failed to update inventory", {
        productId: id,
        inventory,
      });
      throw new Error(errorData.error);
    }
  }

  /**
   * Get products by user ID
   */
  async getProductsByUserId(
    userId: string,
    filters?: Omit<ProductQueryFilters, 'userId'>
  ): Promise<ProductWithMarketStandDTO[]> {
    try {
      return await productRepository.findMany({
        ...filters,
        userId,
      });
    } catch (error) {
      const errorData = handleDatabaseError(error, "Failed to fetch user products", {
        userId,
      });
      console.error('Error fetching user products:', errorData);
      return [];
    }
  }

  /**
   * Get products by market stand ID
   */
  async getProductsByMarketStandId(
    marketStandId: string,
    filters?: Omit<ProductQueryFilters, 'marketStandId'>
  ): Promise<ProductWithMarketStandDTO[]> {
    try {
      return await productRepository.findMany({
        ...filters,
        marketStandId,
      });
    } catch (error) {
      const errorData = handleDatabaseError(error, "Failed to fetch market stand products", {
        marketStandId,
      });
      console.error('Error fetching market stand products:', errorData);
      return [];
    }
  }

  /**
   * Check if user owns product
   */
  async checkProductOwnership(productId: string, userId: string): Promise<boolean> {
    try {
      const product = await productRepository.findByIdAndUserId(productId, userId);
      return product !== null;
    } catch (error) {
      console.error('Error checking product ownership:', error);
      return false;
    }
  }
}

// Export singleton instance
export const productService = new ProductService();
