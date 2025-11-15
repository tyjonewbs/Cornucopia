/**
 * Utility functions for formatting delivery days and dates
 */

/**
 * Format delivery days as abbreviated day names (e.g., "Tue, Thur, Sat")
 */
export function formatDeliveryDays(deliveryDays: string[]): string {
  const dayAbbreviations: Record<string, string> = {
    'MONDAY': 'Mon',
    'TUESDAY': 'Tue',
    'WEDNESDAY': 'Wed',
    'THURSDAY': 'Thur',
    'FRIDAY': 'Fri',
    'SATURDAY': 'Sat',
    'SUNDAY': 'Sun',
  };

  return deliveryDays
    .map(day => dayAbbreviations[day.toUpperCase()] || day.substring(0, 3))
    .join(', ');
}

/**
 * Format a date as "Mon DD" (e.g., "Nov 14")
 */
export function formatDeliveryDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
}

/**
 * Get formatted delivery timing for a product
 * Returns an array to support multiple delivery options
 */
export function getDeliveryTiming(props: {
  deliveryDays?: string[];
  availableDate?: string | null;
  availableUntil?: string | null;
}): string[] {
  const { deliveryDays, availableDate, availableUntil } = props;
  const timings: string[] = [];

  // Check for one-time delivery (availableDate in the future)
  if (availableDate) {
    const date = new Date(availableDate);
    const now = new Date();
    
    // If it's a future date, treat as one-time delivery
    if (date > now) {
      timings.push(formatDeliveryDate(availableDate));
    }
  }

  // Check for recurring delivery days
  if (deliveryDays && deliveryDays.length > 0) {
    timings.push(formatDeliveryDays(deliveryDays));
  }

  return timings;
}
