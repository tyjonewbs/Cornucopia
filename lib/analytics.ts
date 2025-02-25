// Mock analytics implementation that doesn't use PostHog
// This prevents errors when PostHog is not properly configured

export type AnalyticsProperties = {
  [key: string]: any
}

// Create a logger function that only logs in development
const logAnalytics = (event: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${event}`, data || '');
  }
};

export const Analytics = {
  // User identification
  identify: (userId: string, properties?: AnalyticsProperties) => {
    logAnalytics('identify', { userId, ...properties });
  },

  // Reset user
  reset: () => {
    logAnalytics('reset');
  },

  // Business events
  businessCreated: (businessId: string, properties?: AnalyticsProperties) => {
    logAnalytics('business_created', { business_id: businessId, ...properties });
  },

  businessUpdated: (businessId: string, properties?: AnalyticsProperties) => {
    logAnalytics('business_updated', { business_id: businessId, ...properties });
  },

  // Product events
  productViewed: (productId: string, properties?: AnalyticsProperties) => {
    logAnalytics('product_viewed', { product_id: productId, ...properties });
  },

  productCreated: (productId: string, properties?: AnalyticsProperties) => {
    logAnalytics('product_created', { product_id: productId, ...properties });
  },

  productUpdated: (productId: string, properties?: AnalyticsProperties) => {
    logAnalytics('product_updated', { product_id: productId, ...properties });
  },

  // Order events
  orderStarted: (orderId: string, properties?: AnalyticsProperties) => {
    logAnalytics('order_started', { order_id: orderId, ...properties });
  },

  orderCompleted: (orderId: string, properties?: AnalyticsProperties) => {
    logAnalytics('order_completed', { order_id: orderId, ...properties });
  },

  // Cart events
  productAddedToCart: (productId: string, properties?: AnalyticsProperties) => {
    logAnalytics('product_added_to_cart', { product_id: productId, ...properties });
  },

  productRemovedFromCart: (productId: string, properties?: AnalyticsProperties) => {
    logAnalytics('product_removed_from_cart', { product_id: productId, ...properties });
  },

  // Search events
  searchPerformed: (query: string, properties?: AnalyticsProperties) => {
    logAnalytics('search_performed', { search_query: query, ...properties });
  },

  // Filter events
  filterApplied: (filterType: string, value: string, properties?: AnalyticsProperties) => {
    logAnalytics('filter_applied', { filter_type: filterType, filter_value: value, ...properties });
  },

  // Custom event
  track: (eventName: string, properties?: AnalyticsProperties) => {
    logAnalytics(eventName, properties);
  }
}
