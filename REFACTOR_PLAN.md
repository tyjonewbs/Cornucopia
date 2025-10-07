# Cornucopia Refactoring Plan

## Overview
Comprehensive refactoring of the Cornucopia marketplace platform to improve architecture, security, performance, and maintainability.

**Branch**: `refactor/architecture-modernization`
**Started**: October 6, 2025

---

## Phase 1: Dependencies & Security Updates ⚡ HIGH PRIORITY

### Objectives
- Fix security vulnerabilities (21 total: 2 critical, 2 high, 10 moderate, 7 low)
- Migrate from deprecated Supabase packages
- Update to latest stable versions
- Ensure compatibility

### Tasks
- [ ] Run `npm audit` to identify all vulnerabilities
- [ ] Update Next.js to latest stable version
- [ ] Migrate from deprecated Supabase auth helpers to `@supabase/ssr`
  - Remove: `@supabase/auth-helpers-nextjs`, `@supabase/auth-helpers-react`
  - Update: `lib/auth.ts`, `lib/supabase-server.ts`, `lib/supabase-browser.ts`
- [ ] Update React and React-DOM if needed
- [ ] Update Prisma to latest
- [ ] Run `npm audit fix` for auto-fixable issues
- [ ] Manually review and fix remaining vulnerabilities
- [ ] Test all critical flows after updates

### Dependencies to Update
```json
{
  "next": "14.1.0" → "15.x or latest 14.x",
  "@supabase/auth-helpers-nextjs": "REMOVE",
  "@supabase/auth-helpers-react": "REMOVE",
  "@supabase/ssr": "keep and expand usage",
  "@prisma/client": "6.2.1" → "latest"
}
```

---

## Phase 2: Architecture Restructuring 🏗️

### Objectives
- Implement clean architecture patterns
- Separate concerns (presentation, business logic, data access)
- Create reusable service layer
- Improve testability

### Structure
```
lib/
  services/          # Business logic layer
    productService.ts
    marketStandService.ts
    localService.ts
    userService.ts
    authService.ts
    reviewService.ts
  repositories/      # Data access layer
    productRepository.ts
    marketStandRepository.ts
    localRepository.ts
  validators/        # Input validation with Zod
    productSchemas.ts
    marketStandSchemas.ts
  dto/              # Data Transfer Objects
    product.dto.ts
    marketStand.dto.ts
```

### Tasks
- [ ] Create service layer structure
- [ ] Implement repository pattern
- [ ] Extract business logic from server actions
- [ ] Create proper DTOs and validation schemas
- [ ] Implement error handling middleware
- [ ] Update server actions to use services

---

## Phase 3: Database Optimization 🗄️

### Objectives
- Optimize query performance
- Reduce N+1 queries
- Implement caching strategy
- Improve connection management

### Tasks
- [ ] Audit all Prisma queries for N+1 issues
- [ ] Implement proper query includes/selects
- [ ] Add Redis caching for frequently accessed data
  - Product listings
  - Market stand listings
  - User sessions
- [ ] Configure database connection pooling
- [ ] Review and optimize indexes
- [ ] Implement proper cursor-based pagination
- [ ] Add query performance monitoring

### Caching Strategy
```typescript
// Cache TTLs
- Product listings: 5 minutes
- Market stand data: 10 minutes
- User profile: 15 minutes
- Static content: 1 hour
```

---

## Phase 4: Code Organization 📁

### Objectives
- Standardize code structure
- Improve type safety
- Create reusable utilities
- Better error handling

### Tasks
- [ ] Consolidate all types in `types/` directory
- [ ] Create consistent API response types
- [ ] Implement custom hooks
  - `useProducts()`
  - `useMarketStands()`
  - `useAuth()`
  - `useUserLocation()`
- [ ] Extract shared utilities
- [ ] Implement error boundaries
- [ ] Standardize form handling
- [ ] Create consistent loading states

---

## Phase 5: Performance & UX Improvements ⚡

### Objectives
- Improve page load times
- Better user experience
- Optimize asset loading
- Implement proper caching

### Tasks
- [ ] Audit React Server Components usage
- [ ] Implement proper loading states
- [ ] Add skeleton screens
- [ ] Optimize image loading (Next.js Image)
- [ ] Implement optimistic updates
- [ ] Add proper data revalidation
- [ ] Implement streaming where applicable
- [ ] Add service worker for offline capability

---

## Phase 6: Testing & Documentation 📝

### Objectives
- Ensure code reliability
- Improve maintainability
- Better developer onboarding

### Tasks
- [ ] Add unit tests for services (Jest/Vitest)
- [ ] Add integration tests for API routes
- [ ] E2E tests for critical flows (Playwright)
- [ ] Document API patterns
- [ ] Create developer documentation
- [ ] Add code comments for complex logic
- [ ] Create architecture diagrams

---

## Migration Strategy

### Approach
1. **Incremental Migration**: Refactor one module at a time
2. **Feature Flags**: Use flags to toggle between old/new code
3. **Testing**: Thoroughly test each phase before moving to next
4. **Documentation**: Document changes as we go

### Risk Mitigation
- Keep main branch stable
- Regular commits on refactor branch
- Comprehensive testing at each phase
- Code reviews before merging
- Rollback plan for each phase

---

## Success Metrics

### Performance
- [ ] Page load time < 2s
- [ ] Time to interactive < 3s
- [ ] Lighthouse score > 90

### Code Quality
- [ ] Test coverage > 70%
- [ ] Zero critical security vulnerabilities
- [ ] TypeScript strict mode enabled
- [ ] ESLint warnings = 0

### Developer Experience
- [ ] Clear documentation
- [ ] Easy local setup
- [ ] Fast build times
- [ ] Good error messages

---

## Timeline

**Phase 1**: 2-3 days
**Phase 2**: 1 week
**Phase 3**: 3-4 days
**Phase 4**: 3-4 days
**Phase 5**: 1 week
**Phase 6**: Ongoing

**Total Estimated**: 3-4 weeks

---

## Notes

- All changes tracked in this branch: `refactor/architecture-modernization`
- Security vulnerabilities must be addressed first
- Breaking changes acceptable during refactor
- Focus on maintainability and scalability
