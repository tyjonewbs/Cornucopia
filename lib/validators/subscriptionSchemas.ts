import { z } from 'zod';
import { NotificationType } from '@prisma/client';

// Subscription creation schema
export const createSubscriptionSchema = z.object({
  marketStandId: z.string().uuid('Invalid market stand ID'),
  notificationTypes: z.array(z.nativeEnum(NotificationType)).min(1, 'Select at least one notification type'),
});

// Subscription update schema
export const updateSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid('Invalid subscription ID'),
  notificationTypes: z.array(z.nativeEnum(NotificationType)).min(1, 'Select at least one notification type'),
});

// Delete subscription schema
export const deleteSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid('Invalid subscription ID'),
});

export type CreateSubscriptionSchema = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionSchema = z.infer<typeof updateSubscriptionSchema>;
export type DeleteSubscriptionSchema = z.infer<typeof deleteSubscriptionSchema>;
