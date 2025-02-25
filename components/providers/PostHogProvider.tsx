'use client'

// Create a mock PostHog provider that doesn't do anything
// This prevents errors when PostHog is not properly configured

export function PHProvider({ children }: { children: React.ReactNode }) {
  // Simply render children without any PostHog functionality
  return <>{children}</>;
}
