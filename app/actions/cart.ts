'use server';

import { revalidatePath } from 'next/cache';
import prisma from '@/lib/db';
import { getUser } from '@/lib/auth';
import type { 
  Cart, 
  CartItem, 
  AddToCartParams,
  CartActionResult,
  FulfillmentType,
  TaxCode
} from '@/types/cart';

/**
 * Get or create cart for current user
 */
export async function getOrCreateCart(): Promise<CartActionResult<Cart>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    let cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                taxCode: true,
                taxable: true,
                inventory: true,
                userId: true,
              },
            },
            deliveryZone: {
              select: {
                id: true,
                name: true,
                deliveryFee: true,
                freeDeliveryThreshold: true,
                minimumOrder: true,
              },
            },
            marketStand: {
              select: {
                id: true,
                name: true,
                locationName: true,
                latitude: true,
                longitude: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                  taxCode: true,
                  taxable: true,
                  inventory: true,
                  userId: true,
                },
              },
              deliveryZone: {
                select: {
                  id: true,
                  name: true,
                  deliveryFee: true,
                  freeDeliveryThreshold: true,
                  minimumOrder: true,
                },
              },
              marketStand: {
                select: {
                  id: true,
                  name: true,
                  locationName: true,
                  latitude: true,
                  longitude: true,
                },
              },
            },
          },
        },
      });
    }

    return {
      success: true,
      data: cart as Cart,
    };
  } catch (error) {
    console.error('Error getting or creating cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cart',
    };
  }
}

/**
 * Add item to cart or update quantity if already exists
 */
export async function addToCart(params: AddToCartParams): Promise<CartActionResult<CartItem>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate product exists and has inventory
    const product = await prisma.product.findUnique({
      where: { id: params.productId },
      select: {
        id: true,
        name: true,
        price: true,
        inventory: true,
        isActive: true,
        status: true,
      },
    });

    if (!product) {
      return { success: false, error: 'Product not found' };
    }

    if (!product.isActive || product.status !== 'APPROVED') {
      return { success: false, error: 'Product is not available' };
    }

    if (product.inventory < params.quantity) {
      return {
        success: false,
        error: `Only ${product.inventory} items available`,
      };
    }

    // Validate fulfillment type parameters
    if (params.fulfillmentType === 'DELIVERY') {
      if (!params.deliveryDate || !params.deliveryZoneId) {
        return {
          success: false,
          error: 'Delivery date and zone required for delivery items',
        };
      }
    } else if (params.fulfillmentType === 'PICKUP') {
      if (!params.marketStandId) {
        return {
          success: false,
          error: 'Market stand required for pickup items',
        };
      }
    }

    // Get or create cart
    const cartResult = await getOrCreateCart();
    if (!cartResult.success || !cartResult.data) {
      return { success: false, error: 'Failed to get cart' };
    }

    // Check if item already exists in cart with same fulfillment
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cartResult.data.id,
        productId: params.productId,
        deliveryDate: params.deliveryDate || null,
        pickupTime: params.pickupTime || null,
      },
    });

    let cartItem;

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + params.quantity;

      if (product.inventory < newQuantity) {
        return {
          success: false,
          error: `Only ${product.inventory} items available`,
        };
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity, updatedAt: new Date() },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              taxCode: true,
              taxable: true,
              inventory: true,
              userId: true,
            },
          },
          deliveryZone: {
            select: {
              id: true,
              name: true,
              deliveryFee: true,
              freeDeliveryThreshold: true,
              minimumOrder: true,
            },
          },
          marketStand: {
            select: {
              id: true,
              name: true,
              locationName: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cartResult.data.id,
          productId: params.productId,
          quantity: params.quantity,
          fulfillmentType: params.fulfillmentType,
          deliveryDate: params.deliveryDate || null,
          deliveryZoneId: params.deliveryZoneId || null,
          marketStandId: params.marketStandId || null,
          pickupTime: params.pickupTime || null,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              taxCode: true,
              taxable: true,
              inventory: true,
              userId: true,
            },
          },
          deliveryZone: {
            select: {
              id: true,
              name: true,
              deliveryFee: true,
              freeDeliveryThreshold: true,
              minimumOrder: true,
            },
          },
          marketStand: {
            select: {
              id: true,
              name: true,
              locationName: true,
              latitude: true,
              longitude: true,
            },
          },
        },
      });
    }

    revalidatePath('/cart');
    revalidatePath('/');

    return {
      success: true,
      data: cartItem as CartItem,
    };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add item to cart',
    };
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<CartActionResult<CartItem>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (quantity < 1) {
      return { success: false, error: 'Quantity must be at least 1' };
    }

    // Get cart item with product info
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        product: {
          select: {
            id: true,
            inventory: true,
            isActive: true,
            status: true,
          },
        },
      },
    });

    if (!cartItem) {
      return { success: false, error: 'Cart item not found' };
    }

    // Verify cart belongs to user
    if (cartItem.cart.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate product availability
    if (!cartItem.product.isActive || cartItem.product.status !== 'APPROVED') {
      return { success: false, error: 'Product is no longer available' };
    }

    if (cartItem.product.inventory < quantity) {
      return {
        success: false,
        error: `Only ${cartItem.product.inventory} items available`,
      };
    }

    // Update quantity
    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity, updatedAt: new Date() },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            images: true,
            taxCode: true,
            taxable: true,
            inventory: true,
            userId: true,
          },
        },
        deliveryZone: {
          select: {
            id: true,
            name: true,
            deliveryFee: true,
            freeDeliveryThreshold: true,
            minimumOrder: true,
          },
        },
        marketStand: {
          select: {
            id: true,
            name: true,
            locationName: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    revalidatePath('/cart');

    return {
      success: true,
      data: updatedItem as CartItem,
    };
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update quantity',
    };
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(itemId: string): Promise<CartActionResult<void>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Verify cart item belongs to user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem) {
      return { success: false, error: 'Cart item not found' };
    }

    if (cartItem.cart.userId !== user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    revalidatePath('/cart');

    return { success: true };
  } catch (error) {
    console.error('Error removing from cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove item',
    };
  }
}

/**
 * Clear entire cart
 */
export async function clearCart(): Promise<CartActionResult<void>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    revalidatePath('/cart');

    return { success: true };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear cart',
    };
  }
}

/**
 * Get cart item count for badge display
 */
export async function getCartItemCount(): Promise<number> {
  try {
    const user = await getUser();
    if (!user) return 0;

    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          select: { quantity: true },
        },
      },
    });

    if (!cart) return 0;

    return cart.items.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Error getting cart item count:', error);
    return 0;
  }
}

/**
 * Validate cart before checkout
 * Checks inventory, product availability, etc.
 */
export async function validateCart(): Promise<CartActionResult<{
  isValid: boolean;
  errors: Array<{
    itemId: string;
    productName: string;
    message: string;
  }>;
}>> {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const cartResult = await getOrCreateCart();
    if (!cartResult.success || !cartResult.data) {
      return { success: false, error: 'Failed to get cart' };
    }

    const errors: Array<{
      itemId: string;
      productName: string;
      message: string;
    }> = [];

    for (const item of cartResult.data.items) {
      // Check if product is still active
      if (!item.product) {
        errors.push({
          itemId: item.id,
          productName: 'Unknown product',
          message: 'Product no longer exists',
        });
        continue;
      }

      // Check inventory
      if (item.product.inventory < item.quantity) {
        errors.push({
          itemId: item.id,
          productName: item.product.name,
          message: `Only ${item.product.inventory} available (you have ${item.quantity} in cart)`,
        });
      }
    }

    return {
      success: true,
      data: {
        isValid: errors.length === 0,
        errors,
      },
    };
  } catch (error) {
    console.error('Error validating cart:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate cart',
    };
  }
}
