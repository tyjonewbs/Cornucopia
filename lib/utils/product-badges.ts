/**
 * Product Badge Utility
 * Calculates contextual badges for products based on various conditions
 */

export type BadgeType = 
  | 'delivery-only'
  | 'pre-order'
  | 'seasonal'
  | 'low-stock'
  | 'fresh'
  | 'open-now'
  | null;

export interface ProductBadge {
  text: string;
  color: string; // Tailwind bg color class
  type: BadgeType;
}

export interface BadgeCalculationInput {
  // Product availability
  availableDate?: Date | string | null;
  availableUntil?: Date | string | null;
  
  // Inventory
  totalInventory: number; // Aggregated across all buckets
  
  // Freshness
  inventoryUpdatedAt?: Date | string | null;
  updatedAt?: Date | string;
  
  // Location availability
  hasMarketStand: boolean;
  hasDelivery: boolean;
  isMarketStandOpen?: boolean;
  
  // Delivery info
  deliveryDays?: string[];
  nextDeliveryDate?: Date | string | null;
}

/**
 * Calculate the appropriate badge for a product
 * Badges are checked in priority order
 */
export function calculateProductBadge(input: BadgeCalculationInput): ProductBadge | null {
  const now = new Date();
  
  // Parse dates
  const availableDate = input.availableDate ? new Date(input.availableDate) : null;
  const availableUntil = input.availableUntil ? new Date(input.availableUntil) : null;
  const inventoryUpdatedAt = input.inventoryUpdatedAt ? new Date(input.inventoryUpdatedAt) : null;
  const updatedAt = input.updatedAt ? new Date(input.updatedAt) : new Date();
  
  // Priority 1: Delivery Only
  if (!input.hasMarketStand && input.hasDelivery) {
    return {
      text: 'Delivery Only',
      color: 'bg-purple-600',
      type: 'delivery-only'
    };
  }
  
  // Priority 2: Pre-Order (future availableDate)
  if (availableDate && availableDate > now) {
    const dateStr = formatShortDate(availableDate);
    return {
      text: `Pre-Order • Available ${dateStr}`,
      color: 'bg-blue-500',
      type: 'pre-order'
    };
  }
  
  // Priority 3: Seasonal (has availableUntil date)
  if (availableUntil && availableUntil >= now) {
    const dateStr = formatShortDate(availableUntil);
    return {
      text: `Seasonal • Until ${dateStr}`,
      color: 'bg-amber-500',
      type: 'seasonal'
    };
  }
  
  // Priority 4: Low Stock
  if (input.totalInventory > 0 && input.totalInventory <= 5) {
    const plural = input.totalInventory === 1 ? '' : 's';
    return {
      text: `Only ${input.totalInventory} left`,
      color: 'bg-orange-500',
      type: 'low-stock'
    };
  }
  
  // Priority 5: Open Now (if market stand is currently open)
  if (input.hasMarketStand && input.isMarketStandOpen) {
    return {
      text: '🟢 Open now',
      color: 'bg-green-600',
      type: 'open-now'
    };
  }
  
  // Priority 6: Fresh (updated within 6 hours)
  const updateTime = inventoryUpdatedAt || updatedAt;
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  if (updateTime >= sixHoursAgo) {
    const hours = Math.floor((now.getTime() - updateTime.getTime()) / (60 * 60 * 1000));
    if (hours < 1) {
      return {
        text: '✨ Fresh this hour',
        color: 'bg-blue-400',
        type: 'fresh'
      };
    } else if (hours < 6) {
      return {
        text: '✨ Fresh today',
        color: 'bg-blue-400',
        type: 'fresh'
      };
    }
  }
  
  // No badge needed
  return null;
}

/**
 * Format a date for badge display
 */
function formatShortDate(date: Date): string {
  const now = new Date();
  const isThisYear = date.getFullYear() === now.getFullYear();
  
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    ...(isThisYear ? {} : { year: 'numeric' })
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Calculate if a market stand is currently open
 * Returns null if hours are not available or cannot be determined
 */
export function isMarketStandOpen(hours: any, timezone = 'America/Los_Angeles'): boolean | null {
  if (!hours || typeof hours !== 'object') {
    return null;
  }
  
  try {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[now.getDay()];
    
    const todayHours = hours[currentDay];
    if (!todayHours || typeof todayHours !== 'object') {
      return false; // Closed if no hours defined for today
    }
    
    const openTime = todayHours.open;
    const closeTime = todayHours.close;
    
    if (!openTime || !closeTime) {
      return false;
    }
    
    // Parse hours (assumes format like "08:00" or "8:00 AM")
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = parseTime(openTime);
    const [closeHour, closeMin] = parseTime(closeTime);
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    return currentTime >= openMinutes && currentTime < closeMinutes;
  } catch (error) {
    console.error('Error checking market stand hours:', error);
    return null;
  }
}

/**
 * Parse time string to hours and minutes
 * Handles formats: "HH:MM", "H:MM", "HH:MM AM/PM", "H:MM AM/PM"
 */
function parseTime(timeStr: string): [number, number] {
  const cleaned = timeStr.trim().toLowerCase();
  
  // Check for AM/PM
  const isPM = cleaned.includes('pm');
  const isAM = cleaned.includes('am');
  
  // Extract numbers
  const numbers = cleaned.replace(/[^0-9:]/g, '');
  const [hourStr, minStr = '0'] = numbers.split(':');
  
  let hour = parseInt(hourStr, 10);
  const min = parseInt(minStr, 10);
  
  // Convert to 24-hour format
  if (isPM && hour !== 12) {
    hour += 12;
  } else if (isAM && hour === 12) {
    hour = 0;
  }
  
  return [hour, min];
}

/**
 * Get next delivery date from a list of delivery days
 */
export function getNextDeliveryDate(deliveryDays: string[]): Date | null {
  if (!deliveryDays || deliveryDays.length === 0) {
    return null;
  }
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayIndexMap = Object.fromEntries(dayNames.map((name, idx) => [name, idx]));
  
  const today = new Date();
  const currentDayIndex = today.getDay();
  
  // Convert delivery days to indices and sort
  const deliveryDayIndices = deliveryDays
    .map(day => dayIndexMap[day])
    .filter(idx => idx !== undefined)
    .sort((a, b) => a - b);
  
  if (deliveryDayIndices.length === 0) {
    return null;
  }
  
  // Find next delivery day
  let nextDayIndex = deliveryDayIndices.find(idx => idx > currentDayIndex);
  
  // If no day found this week, use first day next week
  if (nextDayIndex === undefined) {
    nextDayIndex = deliveryDayIndices[0];
  }
  
  // Calculate days until next delivery
  let daysUntil = nextDayIndex - currentDayIndex;
  if (daysUntil <= 0) {
    daysUntil += 7;
  }
  
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);
  nextDate.setHours(0, 0, 0, 0);
  
  return nextDate;
}

/**
 * Format delivery days for display
 * E.g., ["Monday", "Wednesday", "Friday"] -> "Mon, Wed, Fri"
 */
export function formatDeliveryDays(deliveryDays: string[]): string {
  if (!deliveryDays || deliveryDays.length === 0) {
    return '';
  }
  
  const shortNames = deliveryDays.map(day => day.substring(0, 3));
  
  if (shortNames.length <= 2) {
    return shortNames.join(' & ');
  }
  
  return shortNames.join(', ');
}

/**
 * Aggregate inventory across multiple buckets
 */
export function aggregateInventory(buckets: { inventory: number }[]): number {
  return buckets.reduce((sum, bucket) => sum + (bucket.inventory || 0), 0);
}
