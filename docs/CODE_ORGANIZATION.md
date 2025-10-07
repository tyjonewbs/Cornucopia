# Code Organization - Phase 4 Documentation

## Overview
Phase 4 focused on standardizing code structure, improving type safety, creating reusable utilities, and implementing better error handling across the Cornucopia application.

## Completed Tasks

### 1. Type System Consolidation ✅

Created a centralized type system in the `types/` directory:

#### New Type Files
- **`types/api.ts`**: Standard API response types
  - `ApiSuccessResponse<T>` - Consistent success response structure
  - `ApiErrorResponse` - Consistent error response structure
  - `ApiResponse<T>` - Union type for all responses
  - `PaginationMeta` - Standard pagination metadata
  - `CursorPaginationMeta` - Cursor-based pagination
  - Type guards: `isApiSuccess()`, `isApiError()`

- **`types/user.ts`**: User-related types
  - `User` - Base user interface
  - `UserRole` - Enum for user roles
  - `UserProfile` - Extended user with profile data
  - `AuthUser` - Authenticated user type
  - `UserSettings` - User settings interface

- **`types/marketStand.ts`**: Market stand types
  - `MarketStand` - Base market stand interface
  - `MarketStandWithDistance` - Market stand with distance calculation
  - `MarketStandWithProducts` - Market stand with product list
  - `CreateMarketStandInput` - Input for creating market stands
  - `UpdateMarketStandInput` - Input for updating market stands
  - `MarketStandFilters` - Query filter options
  - `MarketStandListResponse` - List response structure

- **`types/index.ts`**: Central export file
  - Exports all types from single location
  - Common types: `Location`, `Coordinates`, `LocationData`, `Address`
  - UI state types: `LoadingState`, `DataLoadingState`, `FormState`

#### Existing Type Files
- **`types/hours.ts`**: Already existed with weekly hours types
- **`types/product.ts`**: Already existed with product types

### 2. Custom Hooks Implementation ✅

Created reusable hooks in the `hooks/` directory:

#### `hooks/useProducts.ts`
Custom hook for managing products with:
- Automatic data fetching
- Loading and error states
- Optimistic UI updates
- CRUD operations: `addProduct()`, `updateProduct()`, `removeProduct()`
- Manual refetch capability

```typescript
const { data, isLoading, error, refetch } = useProducts({
  userId: 'user-id',
  limit: 20
});
```

#### `hooks/useMarketStands.ts`
Custom hook for managing market stands with:
- Location-based filtering
- Distance calculations
- CRUD operations
- Cache management

```typescript
const { data, isLoading, error } = useMarketStands({
  latitude: 37.7749,
  longitude: -122.4194,
  radiusKm: 50
});
```

#### `hooks/useAuth.ts`
Authentication hook with:
- User session management
- Sign in/out operations
- Password reset
- Real-time auth state updates
- `isAuthenticated` flag

```typescript
const { data: user, signIn, signOut, isAuthenticated } = useAuth();
```

#### `hooks/useUserLocation.ts`
Already existed - moved to hooks directory for consistency

#### `hooks/useForm.ts`
Form state management hook with:
- Form validation
- Field-level error handling
- Touch state tracking
- Dirty state detection
- Form submission handling

```typescript
const form = useForm({
  initialValues: { name: '', email: '' },
  validate: (values) => ({ /* validation */ }),
  onSubmit: async (values) => { /* submit */ }
});
```

#### `hooks/index.ts`
Central export file for all hooks

### 3. Shared Utilities ✅

Created utility functions in `lib/utils/`:

#### `lib/utils/format.ts`
Formatting utilities:
- `formatPrice()` - Currency formatting
- `formatDate()` - Date formatting
- `formatRelativeTime()` - Relative time (e.g., "2 hours ago")
- `formatDistance()` - Distance in km/m
- `formatPhoneNumber()` - US phone number formatting
- `truncateText()` - Text truncation
- `formatFileSize()` - File size formatting
- `capitalize()` - String capitalization
- `slugify()` - URL slug generation

#### `lib/utils/validation.ts`
Validation utilities:
- `isValidEmail()` - Email validation
- `isValidPhoneNumber()` - US phone validation
- `isValidUrl()` - URL validation
- `isValidPassword()` - Password strength validation
- `isValidZipCode()` - ZIP code validation
- `isValidCreditCard()` - Credit card (Luhn algorithm)
- `isValidFileType()` - File type checking
- `isValidFileSize()` - File size limits
- `validateRequiredFields()` - Required field validation
- `sanitizeHtml()` - XSS prevention
- `isValidCoordinates()` - Coordinate validation

#### `lib/utils/index.ts`
Additional utilities:
- `delay()` - Promise-based delay
- `debounce()` - Function debouncing
- `throttle()` - Function throttling
- `deepClone()` - Deep object cloning
- `isEmpty()` - Empty value checking
- `generateId()` - Random ID generation
- `groupBy()` - Array grouping
- `unique()` - Duplicate removal
- `sortBy()` - Array sorting

### 4. Error Boundaries ✅

#### `components/ErrorBoundary.tsx`
React Error Boundary component with:
- Graceful error handling
- Custom fallback UI
- Error logging callback
- Reset functionality
- Reload page option
- `useErrorHandler()` hook for async errors

Usage:
```typescript
<ErrorBoundary onError={(error) => logError(error)}>
  <YourComponent />
</ErrorBoundary>
```

### 5. Loading States ✅

#### `components/LoadingState.tsx`
Consistent loading components:
- `LoadingState` - Full loading UI with spinner and message
- `SkeletonCard` - Card skeleton loader
- `SkeletonList` - List skeleton loader
- `SkeletonText` - Text skeleton loader
- `Spinner` - Simple spinner component

Multiple sizes: `sm`, `md`, `lg`

Usage:
```typescript
<LoadingState message="Loading products..." size="lg" />
<SkeletonList count={5} />
```

## Project Structure

```
├── types/
│   ├── index.ts          # Central type exports
│   ├── api.ts            # API response types
│   ├── user.ts           # User types
│   ├── product.ts        # Product types (existing)
│   ├── marketStand.ts    # Market stand types
│   └── hours.ts          # Hours types (existing)
│
├── hooks/
│   ├── index.ts          # Central hook exports
│   ├── useProducts.ts    # Product management hook
│   ├── useMarketStands.ts # Market stand hook
│   ├── useAuth.ts        # Authentication hook
│   ├── useUserLocation.ts # Location hook (moved)
│   └── useForm.ts        # Form management hook
│
├── lib/
│   └── utils/
│       ├── index.ts      # Utility exports
│       ├── format.ts     # Formatting utilities
│       └── validation.ts # Validation utilities
│
└── components/
    ├── ErrorBoundary.tsx # Error boundary component
    └── LoadingState.tsx  # Loading components
```

## Benefits

### Type Safety
- Centralized type definitions
- Consistent API responses
- Better autocomplete and IntelliSense
- Reduced runtime errors

### Code Reusability
- Shared hooks across components
- Common utilities available everywhere
- Consistent loading and error states
- Standardized form handling

### Developer Experience
- Single import location for types and hooks
- Consistent patterns across codebase
- Better code organization
- Easier testing

### User Experience
- Consistent loading states
- Graceful error handling
- Better form validation
- Improved feedback

## Usage Examples

### Using Custom Hooks
```typescript
import { useProducts, useAuth } from '@/hooks';

function ProductList() {
  const { data: user } = useAuth();
  const { data: products, isLoading } = useProducts({
    userId: user?.id
  });

  if (isLoading) return <LoadingState />;
  return <div>{/* render products */}</div>;
}
```

### Using Utilities
```typescript
import { formatPrice, isValidEmail } from '@/lib/utils';

const price = formatPrice(1299); // "$12.99"
const valid = isValidEmail('user@example.com'); // true
```

### Using Types
```typescript
import { ApiResponse, Product, MarketStand } from '@/types';

async function fetchProducts(): Promise<ApiResponse<Product[]>> {
  // API call
}
```

### Using Form Hook
```typescript
import { useForm } from '@/hooks';

function MyForm() {
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: (values) => {
      const errors: Record<string, string> = {};
      if (!isValidEmail(values.email)) {
        errors.email = 'Invalid email';
      }
      return errors;
    },
    onSubmit: async (values) => {
      await submitForm(values);
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

## Next Steps

Future enhancements could include:
1. Add unit tests for utilities and hooks
2. Create more specialized hooks (e.g., `useDebounce`, `useLocalStorage`)
3. Implement custom error types
4. Add more skeleton loading variations
5. Create form field components using `useForm`
6. Add telemetry/analytics integration
7. Implement toast notification system

## Migration Guide

For existing code:

1. **Update imports** to use centralized types:
   ```typescript
   // Before
   import { Product } from '../types/product';
   
   // After
   import { Product } from '@/types';
   ```

2. **Replace loading states** with new components:
   ```typescript
   // Before
   {isLoading && <div>Loading...</div>}
   
   // After
   {isLoading && <LoadingState message="Loading products..." />}
   ```

3. **Use custom hooks** instead of direct API calls:
   ```typescript
   // Before
   const [products, setProducts] = useState([]);
   useEffect(() => {
     fetch('/api/products').then(/* ... */);
   }, []);
   
   // After
   const { data: products } = useProducts();
   ```

4. **Wrap components** in ErrorBoundary:
   ```typescript
   <ErrorBoundary>
     <YourComponent />
   </ErrorBoundary>
   ```

## Conclusion

Phase 4 successfully standardized the codebase with:
- ✅ Consolidated type system
- ✅ Reusable custom hooks
- ✅ Shared utility functions
- ✅ Error boundaries
- ✅ Consistent loading states
- ✅ Standardized form handling

The codebase is now more maintainable, type-safe, and developer-friendly.
