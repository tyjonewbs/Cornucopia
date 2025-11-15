import { z } from 'zod';

/**
 * Reserved usernames that cannot be used
 */
const RESERVED_USERNAMES = [
  'admin',
  'administrator',
  'support',
  'help',
  'system',
  'service',
  'root',
  'superuser',
  'moderator',
  'mod',
  'official',
  'verified',
  'cornucopia',
  'staff',
  'team',
  'owner',
  'null',
  'undefined',
];

/**
 * Username validation schema
 * - 3-30 characters
 * - Alphanumeric, underscores, hyphens only
 * - Cannot start/end with special characters
 * - Case-insensitive reserved word check
 */
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9]/, 'Username must start with a letter or number')
  .regex(/[a-zA-Z0-9]$/, 'Username must end with a letter or number')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .refine(
    (username) => !RESERVED_USERNAMES.includes(username.toLowerCase()),
    'This username is reserved and cannot be used'
  );

/**
 * Profile completion schema
 */
export const profileCompletionSchema = z.object({
  username: usernameSchema,
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  profileImage: z.string().url().optional().nullable(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(2).max(50).optional(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format').optional(),
});

/**
 * Username update schema with rate limiting check
 */
export const usernameUpdateSchema = z.object({
  username: usernameSchema,
  currentUsername: z.string().optional(),
});

/**
 * User profile update schema
 */
export const userProfileUpdateSchema = z.object({
  username: usernameSchema.optional(),
  firstName: z.string().min(1).max(100).optional().nullable(),
  lastName: z.string().min(1).max(100).optional().nullable(),
  profileImage: z.string().url().optional().nullable(),
  city: z.string().min(1).max(100).optional().nullable(),
  state: z.string().min(2).max(50).optional().nullable(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format').optional().nullable(),
});

/**
 * Type exports
 */
export type UsernameInput = z.infer<typeof usernameSchema>;
export type ProfileCompletionInput = z.infer<typeof profileCompletionSchema>;
export type UsernameUpdateInput = z.infer<typeof usernameUpdateSchema>;
export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
