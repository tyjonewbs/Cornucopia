/**
 * User-related types
 */

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
}

export interface UserProfile extends User {
  phone?: string | null;
  bio?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  stripeAccountId?: string | null;
  stripeCustomerId?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    currency: string;
  };
}
