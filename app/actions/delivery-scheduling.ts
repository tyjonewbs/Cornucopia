'use server';

import prisma from '@/lib/db';
import { getUser } from '@/lib/auth';
import { DeliverySchedule } from '@/types/delivery';
import { revalidatePath } from 'next/cache';

export async function updateRecurringSchedule(
  productId: string,
  schedule: DeliverySchedule
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { userId: true }
    });

    if (!product || product.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        deliveryType: 'RECURRING',
        deliverySchedule: schedule as any,
        deliveryDates: [], // Clear one-time dates
      }
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Error updating recurring schedule:', error);
    return { success: false, error: 'Failed to update schedule' };
  }
}

export async function updateOneTimeDates(
  productId: string,
  dates: Date[]
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { userId: true }
    });

    if (!product || product.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        deliveryType: 'ONE_TIME',
        deliveryDates: dates,
        deliverySchedule: null, // Clear recurring schedule
      }
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Error updating one-time dates:', error);
    return { success: false, error: 'Failed to update dates' };
  }
}

export async function updateDayInventory(
  productId: string,
  day: string,
  inventory: number
) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { userId: true, deliverySchedule: true }
    });

    if (!product || product.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const schedule = (product.deliverySchedule as DeliverySchedule) || {};
    
    if (!schedule[day]) {
      return { success: false, error: 'Day not enabled' };
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        deliverySchedule: {
          ...schedule,
          [day]: {
            ...schedule[day],
            inventory
          }
        } as any
      }
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Error updating day inventory:', error);
    return { success: false, error: 'Failed to update inventory' };
  }
}

export async function clearDeliverySchedule(productId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'Unauthorized' };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { userId: true }
    });

    if (!product || product.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        deliveryType: null,
        deliverySchedule: null,
        deliveryDates: [],
      }
    });

    revalidatePath('/dashboard/products');
    return { success: true };
  } catch (error) {
    console.error('Error clearing delivery schedule:', error);
    return { success: false, error: 'Failed to clear schedule' };
  }
}
