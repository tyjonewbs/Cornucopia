# Clean Architecture Implementation

This document describes the clean architecture pattern implementation in the Cornucopia application.

## Overview

The codebase has been refactored to follow clean architecture principles, separating concerns into distinct layers:

1. **Validators** - Input validation using Zod schemas
2. **DTOs** - Data Transfer Objects for type-safe data structures
3. **Repositories** - Data access layer abstracting database operations
4. **Services** - Business logic layer containing core application logic
5. **Server Actions** - Presentation layer interfacing with the frontend

## Architecture Layers

### 1. Validators (`lib/validators/`)

Validators define the input schemas using Zod for runtime type validation and type inference.

**Files:**
- `productSchemas.ts` - Product validation schemas
- `marketStandSchemas.ts` - Market stand validation schemas

**Example:**
```typescript
import { createProductSchema } from "@/lib/validators/productSchemas";

// Validate input
const validatedData = createProductSchema.parse(input);
```

**Key Features:**
- Runtime validation
- Type inference for TypeScript
- Clear error messages
- Reusable schemas for create/update/query operations

### 2. DTOs (`lib/dto/`)

Data Transfer Objects define the structure of data passed between layers.

**Files:**
- `product.dto.ts` - Product data structures
- `marketStand.dto.ts` - Market stand data structures

**Example:**
```typescript
import { ProductWithMarketStandDTO } from "@/lib/dto/product.dto";

function displayProduct(product: ProductWithMarketStandDTO) {
  // Type-safe access to product properties
}
```

**Key Features:**
- Type-safe data structures
- Separation from database models
- Clear interfaces for different use cases
- Backwards compatibility with existing code

### 3. Repositories (`lib/repositories/`)

Repositories handle all database operations, abstracting Prisma queries.

**Files:**
- `productRepository.ts` - Product data access
- `marketStandRepository.ts` - Market stand data access

**Example:**
```typescript
import { productRepository } from "@/lib/repositories/productRepository";

// Find products with filtering
const products = await productRepository.findMany({
  userId: "user-id",
  isActive: true,
  limit: 10
});

// Create a new product
const product = await productRepository.create(data);
```

**Key Features:**
- Single source of truth for database operations
- Consistent error handling
- Reusable query methods
- Automatic serialization of database models

**Available Methods:**

**ProductRepository:**
- `findMany(filters)` - Find products with filtering
- `findById(id)` - Find single product by ID
- `findByIdAndUserId(id, userId)` - Find product with ownership check
- `create(data)` - Create new product
- `update(id, data)` - Update existing product
- `delete(id)` - Delete product
- `exists(id)` - Check if product exists
- `count(filters)` - Count products
- `updateInventory(id, inventory)` - Update product inventory
- `bulkUpdateStatus(ids, status)` - Bulk update product status

**MarketStandRepository:**
- `findMany(filters)` - Find market stands with filtering
- `findByLocation(lat, lng, radius, filters)` - Find by location
- `findById(id)` - Find single market stand by ID
- `findByIdAndUserId(id, userId)` - Find with ownership check
- `create(data)` - Create new market stand
- `update(id, data)` - Update existing market stand
- `delete(id)` - Delete market stand
- `exists(id)` - Check if market stand exists
- `count(filters)` - Count market stands
- `updateStatus(id, status)` - Update market stand status
- `findByUserId(userId)` - Get all market stands for a user

### 4. Services (`lib/services/`)

Services contain business logic and use repositories for data access.

**Files:**
- `productService.ts` - Product business logic
- `marketStandService.ts` - Market stand business logic

**Example:**
```typescript
import { productService } from "@/lib/services/productService";

// Create product with validation
const product = await productService.createProduct({
  name: "Fresh Tomatoes",
  price: 5.99,
  // ... other fields
});

// Get products with automatic validation
const products = await productService.getProducts({
  marketStandId: "stand-id"
});
```

**Key Features:**
- Input validation using Zod schemas
- Business rule enforcement
- Error handling and logging
- Consistent API across different entities

**Available Methods:**

**ProductService:**
- `getProducts(query)` - Get products with filtering and validation
- `getProductById(id)` - Get single product with validation
- `createProduct(input)` - Create product with validation
- `updateProduct(id, input)` - Update product with validation
- `deleteProduct(id)` - Delete product
- `updateProductInventory(id, inventory)` - Update inventory
- `getProductsByUserId(userId, filters)` - Get user's products
- `getProductsByMarketStandId(standId, filters)` - Get stand's products
- `checkProductOwnership(productId, userId)` - Verify ownership

**MarketStandService:**
- `getMarketStands(query)` - Get market stands with filtering
- `getMarketStandById(id)` - Get single market stand
- `createMarketStand(input)` - Create market stand with validation
- `updateMarketStand(id, input)` - Update market stand with validation
- `deleteMarketStand(id)` - Delete market stand
- `getMarketStandsByUserId(userId, filters)` - Get user's stands
- `getMarketStandsNearLocation(lat, lng, radius)` - Location-based search
- `checkMarketStandOwnership(standId, userId)` - Verify ownership
- `countMarketStands(filters)` - Count market stands

### 5. Server Actions (`app/actions/`)

Server actions provide the interface between the frontend and the service layer.

**Files:**
- `products.ts` - Product server actions
- `market-stand.ts` - Market stand server actions

**Example:**
```typescript
import { getProducts, createProduct } from "@/app/actions/products";

// In a server component or server action
const products = await getProducts({ userId: "user-id" });

const newProduct = await createProduct({
  name: "Fresh Tomatoes",
  // ... other fields
});
```

**Key Features:**
- Thin wrapper around service layer
- Maintains existing API for backwards compatibility
- Clear documentation for each action
- Type-safe interfaces

## Data Flow

```
┌─────────────┐
│   Frontend  │
│  Component  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Server    │
│   Action    │  (app/actions/)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │  (lib/services/)
│   Layer     │  - Business Logic
│             │  - Validation (Zod)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Repository │  (lib/repositories/)
│   Layer     │  - Data Access
│             │  - Prisma Queries
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Database   │
│  (Prisma)   │
└─────────────┘
```

## Benefits

### 1. Separation of Concerns
- Each layer has a single responsibility
- Easy to understand and maintain
- Clear boundaries between layers

### 2. Testability
- Services can be tested independently
- Repositories can be mocked for service tests
- Business logic isolated from data access

### 3. Reusability
- Services can be used across different server actions
- Repositories can be reused across services
- Validators ensure consistent validation

### 4. Type Safety
- DTOs provide clear type definitions
- Zod schemas provide runtime validation
- TypeScript ensures compile-time type checking

### 5. Maintainability
- Changes to business logic centralized in services
- Database changes isolated to repositories
- Validation rules centralized in schemas

## Usage Examples

### Creating a Product

```typescript
// In a server action or API route
import { productService } from "@/lib/services/productService";

try {
  const product = await productService.createProduct({
    name: "Fresh Tomatoes",
    description: "Organic heirloom tomatoes",
    price: 5.99,
    images: ["https://example.com/tomato.jpg"],
    inventory: 100,
    status: Status.PENDING,
    isActive: true,
    userId: "user-id",
    marketStandId: "stand-id",
    tags: ["organic", "vegetables"]
  });
  
  console.log("Product created:", product);
} catch (error) {
  // Validation errors or database errors are caught here
  console.error("Error creating product:", error.message);
}
```

### Querying Products

```typescript
import { productService } from "@/lib/services/productService";

// Get all active products for a market stand
const products = await productService.getProductsByMarketStandId(
  "stand-id",
  {
    isActive: true,
    limit: 20
  }
);

// Get products with location-based filtering
const standProducts = await productService.getProducts({
  marketStandId: "stand-id",
  isActive: true,
  limit: 50
});
```

### Updating a Product

```typescript
import { productService } from "@/lib/services/productService";

try {
  const updated = await productService.updateProduct(
    "product-id",
    {
      price: 6.99,
      inventory: 75
    }
  );
  
  console.log("Product updated:", updated);
} catch (error) {
  console.error("Error updating product:", error.message);
}
```

### Creating a Market Stand

```typescript
import { marketStandService } from "@/lib/services/marketStandService";

const marketStand = await marketStandService.createMarketStand({
  userId: "user-id",
  name: "Green Valley Farm Stand",
  description: "Fresh produce from our family farm",
  locationName: "123 Farm Road, Green Valley",
  locationGuide: "Next to the red barn",
  latitude: 37.7749,
  longitude: -122.4194,
  website: "https://greenvalley.farm",
  images: ["https://example.com/stand.jpg"],
  tags: ["organic", "local"],
  socialMedia: ["https://instagram.com/greenvalley"],
  hours: {
    monday: { open: "08:00", close: "17:00", closed: false },
    tuesday: { open: "08:00", close: "17:00", closed: false },
    // ... other days
  },
  status: Status.PENDING,
  isActive: true
});
```

### Location-Based Search

```typescript
import { marketStandService } from "@/lib/services/marketStandService";

// Find market stands within 10km of a location
const nearbyStands = await marketStandService.getMarketStandsNearLocation(
  37.7749,  // latitude
  -122.4194, // longitude
  10         // radius in kilometers
);
```

## Error Handling

The architecture includes comprehensive error handling:

1. **Validation Errors**: Zod validation errors are caught and returned with clear messages
2. **Database Errors**: Prisma errors are handled by the error handler utility
3. **Not Found Errors**: Custom errors for missing resources
4. **Business Logic Errors**: Service-level validation and business rules

Example error handling:
```typescript
try {
  const product = await productService.createProduct(data);
} catch (error) {
  if (error.message.includes('Validation error')) {
    // Handle validation error
  } else if (error.message.includes('not found')) {
    // Handle not found error
  } else {
    // Handle other errors
  }
}
```

## Migration Guide

### For Existing Code

The refactoring maintains backwards compatibility. Existing code using server actions will continue to work:

```typescript
// Old code still works
import { getProducts } from "@/app/actions/products";
const products = await getProducts({ userId: "user-id" });
```

### For New Features

When adding new features, follow this pattern:

1. **Create Validator Schema** (if needed)
2. **Define DTOs** (if needed)
3. **Add Repository Methods** (if new data access patterns needed)
4. **Implement Service Methods** (business logic)
5. **Create Server Actions** (thin wrapper)

## Best Practices

1. **Always validate input** at the service layer using Zod schemas
2. **Keep services focused** on business logic, not data access
3. **Use repositories** for all database operations
4. **Document service methods** with JSDoc comments
5. **Handle errors gracefully** at each layer
6. **Write tests** for services and repositories
7. **Use DTOs** for type safety across layers
8. **Keep server actions thin** - delegate to services

## Future Enhancements

Potential improvements to consider:

1. **Add caching layer** between services and repositories
2. **Implement event sourcing** for audit trails
3. **Add request/response interceptors** for logging
4. **Create integration tests** for the full stack
5. **Add GraphQL resolvers** using the service layer
6. **Implement webhook handlers** using services
7. **Add background job processing** using services

## Summary

This clean architecture implementation provides:
- ✅ Clear separation of concerns
- ✅ Improved testability
- ✅ Better maintainability
- ✅ Type safety throughout
- ✅ Reusable business logic
- ✅ Consistent error handling
- ✅ Backwards compatibility
- ✅ Scalable structure for future growth
