import posthog from 'posthog-js'

export type AnalyticsProperties = {
  [key: string]: any
}

export const Analytics = {
  // User identification
  identify: (userId: string, properties?: AnalyticsProperties) => {
    posthog.identify(userId, properties)
  },

  // Reset user
  reset: () => {
    posthog.reset()
  },

  // Business events
  businessCreated: (businessId: string, properties?: AnalyticsProperties) => {
    posthog.capture('business_created', {
      business_id: businessId,
      ...properties
    })
  },

  businessUpdated: (businessId: string, properties?: AnalyticsProperties) => {
    posthog.capture('business_updated', {
      business_id: businessId,
      ...properties
    })
  },

  // Product events
  productViewed: (productId: string, properties?: AnalyticsProperties) => {
    posthog.capture('product_viewed', {
      product_id: productId,
      ...properties
    })
  },

  productCreated: (productId: string, properties?: AnalyticsProperties) => {
    posthog.capture('product_created', {
      product_id: productId,
      ...properties
    })
  },

  productUpdated: (productId: string, properties?: AnalyticsProperties) => {
    posthog.capture('product_updated', {
      product_id: productId,
      ...properties
    })
  },

  // Order events
  orderStarted: (orderId: string, properties?: AnalyticsProperties) => {
    posthog.capture('order_started', {
      order_id: orderId,
      ...properties
    })
  },

  orderCompleted: (orderId: string, properties?: AnalyticsProperties) => {
    posthog.capture('order_completed', {
      order_id: orderId,
      ...properties
    })
  },

  // Cart events
  productAddedToCart: (productId: string, properties?: AnalyticsProperties) => {
    posthog.capture('product_added_to_cart', {
      product_id: productId,
      ...properties
    })
  },

  productRemovedFromCart: (productId: string, properties?: AnalyticsProperties) => {
    posthog.capture('product_removed_from_cart', {
      product_id: productId,
      ...properties
    })
  },

  // Search events
  searchPerformed: (query: string, properties?: AnalyticsProperties) => {
    posthog.capture('search_performed', {
      search_query: query,
      ...properties
    })
  },

  // Filter events
  filterApplied: (filterType: string, value: string, properties?: AnalyticsProperties) => {
    posthog.capture('filter_applied', {
      filter_type: filterType,
      filter_value: value,
      ...properties
    })
  },

  // Custom event
  track: (eventName: string, properties?: AnalyticsProperties) => {
    posthog.capture(eventName, properties)
  }
}
