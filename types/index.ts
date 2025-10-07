/**
 * Central type export file
 * Export all types from a single location for easier imports
 */

// API types
export * from './api';

// Domain types
export * from './user';
export * from './product';
export * from './marketStand';
export * from './hours';

// Common types
export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface LocationData {
  coords: Coordinates;
  source: 'browser' | 'ip' | 'manual';
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface Image {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface SocialMedia {
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
  url: string;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface DataLoadingState<T> extends LoadingState {
  data: T | null;
}

// Form states
export interface FormState<T = unknown> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

export interface FormFieldState {
  value: unknown;
  error: string | null;
  touched: boolean;
  dirty: boolean;
}
