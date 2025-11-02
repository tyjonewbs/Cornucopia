import { User as PrismaUser } from '@prisma/client';
import { User, UserRole } from '@/types/user';

/**
 * Convert Prisma User to API User type
 */
export function toUserDTO(user: PrismaUser): User {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImage: user.profileImage,
    city: user.city,
    state: user.state,
    zipCode: user.zipCode,
    profileComplete: user.profileComplete,
    usernameLastChanged: user.usernameLastChanged,
    role: user.role as UserRole,
    isActive: true, // Note: Add isActive field to schema if needed
    createdAt: new Date(), // Note: Add createdAt field to schema if needed
    updatedAt: new Date(), // Note: Add updatedAt field to schema if needed
  };
}

/**
 * Get public user data (for display in reviews, etc.)
 */
export function toPublicUserDTO(user: PrismaUser) {
  return {
    id: user.id,
    username: user.username,
    profileImage: user.profileImage,
    // Don't expose email, location, or other personal data
  };
}

/**
 * Get display name for user (username preferred, fallback to name)
 */
export function getUserDisplayName(user: PrismaUser | User): string {
  if (user.username) {
    return user.username;
  }
  
  if (user.firstName || user.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }
  
  return 'User';
}

/**
 * Check if user can change username (30 day cooldown)
 */
export function canChangeUsername(user: PrismaUser | User): boolean {
  if (!user.usernameLastChanged) {
    return true;
  }
  
  const daysSinceChange = Math.floor(
    (Date.now() - new Date(user.usernameLastChanged).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceChange >= 30;
}

/**
 * Get days until username can be changed
 */
export function getDaysUntilUsernameChange(user: PrismaUser | User): number | null {
  if (!user.usernameLastChanged) {
    return null;
  }
  
  const daysSinceChange = Math.floor(
    (Date.now() - new Date(user.usernameLastChanged).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const daysRemaining = 30 - daysSinceChange;
  return daysRemaining > 0 ? daysRemaining : null;
}
