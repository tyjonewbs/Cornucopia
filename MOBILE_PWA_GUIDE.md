# Mobile Optimization & PWA Implementation Guide

This document describes the mobile optimization and Progressive Web App (PWA) implementation for Cornucopia.

## Overview

The Cornucopia application has been optimized for mobile devices and configured as a Progressive Web App, allowing users to install the app on their devices for an app-like experience.

---

## PWA Features

### 1. Web App Manifest (`public/manifest.json`)

The manifest provides metadata for the PWA installation:
- **App Name**: "Cornucopia - Local Marketplace"
- **Theme Color**: `#0B4D2C` (brand green)
- **Display Mode**: `standalone` (app-like experience)
- **Icons**: Multiple sizes for different devices and contexts
- **App Shortcuts**: Quick access to Browse, Dashboard, and Market Stands

### 2. Service Worker (`public/sw.js`)

The service worker provides:
- **Offline Support**: Pages and images are cached for offline access
- **Caching Strategies**:
  - Static assets: Cache-first
  - Images: Cache-first with network fallback
  - HTML pages: Network-first with cache fallback
  - API requests: Network-only
- **Offline Page**: `/offline` page shown when network is unavailable

### 3. PWA Icons (`public/icons/`)

Generated icons in multiple sizes:
- `icon-72x72.png` through `icon-512x512.png` - Standard icons
- `icon-maskable-192x192.png`, `icon-maskable-512x512.png` - Maskable icons for Android
- `apple-touch-icon.png` - iOS home screen icon
- `favicon-16x16.png`, `favicon-32x32.png` - Favicon sizes

### 4. Install Prompt (`components/PWAInstallPrompt.tsx`)

An intelligent install prompt that:
- Detects when the app can be installed
- Shows a friendly prompt after 30 seconds of browsing
- Provides iOS-specific instructions for Safari users
- Respects user dismissals (won't show again for 7 days)
- Tracks installation events

---

## Mobile-Responsive Components

### Navigation (`components/Navbar.tsx`)

- **Desktop**: Full navigation with links and search
- **Mobile**: 
  - Compact logo
  - Hamburger menu for navigation
  - Compact search bar
  - User avatar always visible

### Mobile Menu (`components/MobileMenu.tsx`)

- Full-screen slide-out drawer
- Touch-friendly large tap targets (48px min)
- Organized sections: Navigation, Account, Start Selling CTA
- Smooth animations

### Search Bar (`components/HeaderSearchBar.tsx`)

- **Desktop**: Full "Find local products" text with detailed UI
- **Mobile**: Compact design with icons only, full functionality preserved
- `inputMode="numeric"` for mobile keyboard optimization

### Home Sidebar (`components/AppSidebar/index.tsx`)

- **Desktop**: Fixed 256px sidebar with filters
- **Mobile**: Hidden sidebar, floating filter button (FAB) at bottom-left
- Slide-out drawer for filter access

### Dashboard Sidebar (`components/dashboard/Sidebar.tsx`)

- **Desktop**: Fixed 256px sidebar with full menu
- **Mobile**: Hidden sidebar, floating menu button (FAB) at bottom-right
- Slide-out drawer with full navigation

### Product Grid (`components/ProductGrid/ProductGridClient.tsx`)

- Responsive grid: 1 column (mobile) → 2 columns (tablet) → 3 columns (desktop)
- Adjusted gaps: `gap-4` (mobile) → `gap-6` (tablet) → `gap-10` (desktop)
- Touch-optimized product cards

---

## Key CSS Patterns Used

### Responsive Breakpoints

```css
/* Mobile first approach */
.element {
  /* Mobile styles (default) */
  @apply px-3 py-4;
  
  /* Tablet (md: 768px) */
  @apply md:px-8 md:py-8;
  
  /* Desktop (lg: 1024px) */
  @apply lg:gap-10;
}
```

### Touch Optimization

```css
/* Minimum touch target size */
.touch-target {
  @apply min-h-[44px] min-w-[44px];
}

/* Touch manipulation for better scrolling */
.scrollable {
  @apply touch-manipulation;
}
```

### Mobile-Only / Desktop-Only Elements

```css
/* Hide on mobile, show on desktop */
.desktop-only {
  @apply hidden md:flex;
}

/* Show on mobile, hide on desktop */
.mobile-only {
  @apply md:hidden;
}
```

---

## Generating PWA Icons

If you need to regenerate the icons (e.g., after a logo update):

```bash
# Make sure sharp is installed
npm install sharp --save-dev

# Run the icon generator
node scripts/generate-pwa-icons.js
```

The script reads from `/public/logos/cornucopia-mountain-tree.svg` and generates all required PWA icons.

---

## Testing

### PWA Testing

1. Build the production version: `npm run build`
2. Start the server: `npm start`
3. Open Chrome DevTools → Application tab
4. Check:
   - Manifest is detected
   - Service Worker is registered
   - "Install app" prompt appears
   - Offline mode works

### Mobile Testing

1. Use Chrome DevTools device emulation
2. Test on actual devices when possible
3. Key viewports to test:
   - 320px (iPhone SE)
   - 375px (iPhone X/11/12)
   - 414px (iPhone Plus models)
   - 768px (iPad portrait)

### Lighthouse Audit

Run a Lighthouse audit in Chrome DevTools to check:
- PWA installability
- Performance on mobile
- Accessibility
- Best practices

---

## Files Modified/Created

### New Files
- `public/manifest.json` - PWA manifest
- `public/icons/` - PWA icons directory
- `scripts/generate-pwa-icons.js` - Icon generation script
- `components/PWAInstallPrompt.tsx` - Install prompt component
- `MOBILE_PWA_GUIDE.md` - This documentation

### Modified Files
- `app/layout.tsx` - Added PWA meta tags and install prompt
- `components/Navbar.tsx` - Mobile-responsive navigation
- `components/MobileMenu.tsx` - Enhanced mobile menu
- `components/HeaderSearchBar.tsx` - Mobile-optimized search
- `components/AppSidebar/index.tsx` - Mobile drawer pattern
- `components/dashboard/Sidebar.tsx` - Mobile drawer pattern
- `components/ProductGrid/ProductGridClient.tsx` - Responsive grid
- `app/home-client.tsx` - Mobile layout adjustments
- `public/sw.js` - Added manifest to cache

---

## Future Enhancements

Potential future improvements:
1. **Push Notifications**: Notify users of new local products
2. **Background Sync**: Queue actions when offline
3. **Share Target**: Allow sharing content to the app
4. **Shortcuts**: More contextual app shortcuts
5. **Periodic Background Sync**: Auto-refresh product data
