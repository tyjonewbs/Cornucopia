'use client';

import React from 'react';

/**
 * Floating freshness/incentive badges for product tiles.
 * These small floating tags incentivize vendors to keep inventory updated
 * and give consumers confidence that food isn't stale at the market stand.
 */

export type FreshnessTag =
  | 'fresh-today'
  | 'fresh-this-hour'
  | 'limited-stock'
  | 'last-few'
  | 'new-arrival'
  | 'pre-order'
  | 'seasonal'
  | 'back-in-stock'
  | 'popular'
  | 'vendor-verified';

interface FreshnessBadgeProps {
  tag: FreshnessTag;
  /** Optional count for stock-related tags */
  count?: number;
  /** Position relative to tile */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md';
}

const TAG_CONFIG: Record<FreshnessTag, {
  label: string | ((count?: number) => string);
  bg: string;
  text: string;
  icon: string;
  pulse?: boolean;
}> = {
  'fresh-today': {
    label: 'Fresh Today',
    bg: 'bg-emerald-500',
    text: 'text-white',
    icon: 'leaf',
    pulse: true,
  },
  'fresh-this-hour': {
    label: 'Fresh This Hour',
    bg: 'bg-green-400',
    text: 'text-white',
    icon: 'sparkle',
    pulse: true,
  },
  'limited-stock': {
    label: (count) => count ? `Only ${count} left` : 'Limited Stock',
    bg: 'bg-amber-500',
    text: 'text-white',
    icon: 'alert',
  },
  'last-few': {
    label: (count) => count ? `Last ${count}!` : 'Almost Gone!',
    bg: 'bg-red-500',
    text: 'text-white',
    icon: 'fire',
    pulse: true,
  },
  'new-arrival': {
    label: 'New',
    bg: 'bg-blue-500',
    text: 'text-white',
    icon: 'star',
  },
  'pre-order': {
    label: 'Pre-Order',
    bg: 'bg-indigo-500',
    text: 'text-white',
    icon: 'calendar',
  },
  'seasonal': {
    label: 'Seasonal',
    bg: 'bg-orange-400',
    text: 'text-white',
    icon: 'sun',
  },
  'back-in-stock': {
    label: 'Back in Stock',
    bg: 'bg-teal-500',
    text: 'text-white',
    icon: 'refresh',
  },
  'popular': {
    label: 'Popular',
    bg: 'bg-pink-500',
    text: 'text-white',
    icon: 'fire',
  },
  'vendor-verified': {
    label: 'Verified Fresh',
    bg: 'bg-emerald-600',
    text: 'text-white',
    icon: 'check',
  },
};

const ICONS: Record<string, React.JSX.Element> = {
  leaf: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 1c1 2 2 4.5 2 8 0 5.5-4.78 10-10 11Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  ),
  sparkle: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
    </svg>
  ),
  alert: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  fire: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.485 1.166-4.268 2.633-5.85.905-.975 1.932-1.879 2.87-2.89.372-.4.736-.82 1.07-1.28.15-.207.292-.425.41-.664.118.239.26.457.41.664.334.46.698.88 1.07 1.28.938 1.011 1.965 1.915 2.87 2.89C17.834 11.732 19 13.515 19 16c0 3.866-3.134 7-7 7z" />
    </svg>
  ),
  star: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  sun: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  refresh: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  check: (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

const POSITION_CLASSES: Record<string, string> = {
  'top-left': 'top-2 left-2',
  'top-right': 'top-2 right-2',
  'bottom-left': 'bottom-2 left-2',
  'bottom-right': 'bottom-2 right-2',
};

export function FreshnessBadge({ tag, count, position = 'top-left', size = 'sm' }: FreshnessBadgeProps) {
  const config = TAG_CONFIG[tag];
  if (!config) return null;

  const label = typeof config.label === 'function' ? config.label(count) : config.label;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <div
      className={`
        absolute ${POSITION_CLASSES[position]} z-20
        ${config.bg} ${config.text}
        ${sizeClasses} font-semibold rounded-full
        shadow-lg backdrop-blur-sm
        flex items-center gap-1
        ${config.pulse ? 'animate-pulse-subtle' : ''}
        transition-transform hover:scale-105
      `}
    >
      <span aria-hidden="true">{ICONS[config.icon]}</span>
      <span>{label}</span>
    </div>
  );
}

/**
 * Derive the appropriate freshness tags for a product based on its data.
 * Returns multiple tags sorted by priority - caller decides how many to show.
 */
export function deriveFreshnessTags(product: {
  inventory: number;
  inventoryUpdatedAt?: string | null;
  updatedAt: string;
  createdAt: string;
  availableDate?: string | null;
  availableUntil?: string | null;
}): FreshnessTag[] {
  const tags: FreshnessTag[] = [];
  const now = new Date();

  // Freshness based on inventory update time
  const inventoryTime = product.inventoryUpdatedAt
    ? new Date(product.inventoryUpdatedAt)
    : null;

  if (inventoryTime) {
    const hoursSinceUpdate = (now.getTime() - inventoryTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceUpdate < 1) {
      tags.push('fresh-this-hour');
    } else if (hoursSinceUpdate < 12) {
      tags.push('fresh-today');
    }
    // If vendor recently updated from 0 stock, it's "back in stock"
    if (hoursSinceUpdate < 24 && product.inventory > 0) {
      // We can't know previous inventory here, but the tag is available
    }
  }

  // Stock urgency
  if (product.inventory > 0 && product.inventory <= 3) {
    tags.push('last-few');
  } else if (product.inventory > 3 && product.inventory <= 10) {
    tags.push('limited-stock');
  }

  // Pre-order
  if (product.availableDate) {
    const availDate = new Date(product.availableDate);
    if (availDate > now) {
      tags.push('pre-order');
    }
  }

  // Seasonal
  if (product.availableUntil) {
    const untilDate = new Date(product.availableUntil);
    if (untilDate >= now) {
      tags.push('seasonal');
    }
  }

  // New arrival (created within last 48 hours)
  const createdAt = new Date(product.createdAt);
  const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreated < 48) {
    tags.push('new-arrival');
  }

  return tags;
}
