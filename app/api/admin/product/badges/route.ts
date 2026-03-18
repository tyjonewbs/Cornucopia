import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createRouteHandlerClient } from '@/lib/supabase-route'
import { revalidatePath } from 'next/cache'

/** Valid admin-assignable badge tags */
const VALID_ADMIN_TAGS = [
  'fresh-today',
  'fresh-this-hour',
  'limited-stock',
  'last-few',
  'new-arrival',
  'pre-order',
  'seasonal',
  'back-in-stock',
  'popular',
  'vendor-verified',
] as const

/**
 * POST - Assign admin tags to a product
 * Body: { productId: string, tags: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { productId, tags } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    if (!Array.isArray(tags)) {
      return NextResponse.json({ error: 'Tags must be an array' }, { status: 400 })
    }

    // Validate all tags
    const invalidTags = tags.filter(t => !VALID_ADMIN_TAGS.includes(t as any))
    if (invalidTags.length > 0) {
      return NextResponse.json(
        { error: `Invalid tags: ${invalidTags.join(', ')}. Valid tags: ${VALID_ADMIN_TAGS.join(', ')}` },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, adminTags: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Set the admin tags (replaces existing)
    await prisma.product.update({
      where: { id: productId },
      data: { adminTags: tags }
    })

    revalidatePath('/admin/products')
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      message: `Updated badges for ${product.name}`,
      tags
    })
  } catch (error) {
    console.error('Error updating product badges:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Remove specific admin tags from a product
 * Body: { productId: string, tags: string[] }
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { productId, tags } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true, adminTags: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Remove specified tags
    const remainingTags = product.adminTags.filter(t => !tags.includes(t))

    await prisma.product.update({
      where: { id: productId },
      data: { adminTags: remainingTags }
    })

    revalidatePath('/admin/products')
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      message: `Removed badges from ${product.name}`,
      tags: remainingTags
    })
  } catch (error) {
    console.error('Error removing product badges:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
