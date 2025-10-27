import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createRouteHandlerClient } from '@/lib/supabase-route'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const supabase = createRouteHandlerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, note } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Get current product status
    const product = await prisma.product.findUnique({
      where: { id },
      select: { status: true, name: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Update product status to APPROVED
    await prisma.$transaction([
      // Update the product
      prisma.product.update({
        where: { id },
        data: { status: 'APPROVED' }
      }),
      // Record the status change
      prisma.productStatusHistory.create({
        data: {
          productId: id,
          oldStatus: product.status,
          newStatus: 'APPROVED',
          changedById: session.user.id,
          note: note || 'Approved by admin'
        }
      })
    ])

    // Revalidate the pending products page
    revalidatePath('/admin/products/pending')
    revalidatePath('/admin')

    return NextResponse.json({ 
      success: true,
      message: `${product.name} has been approved`
    })
  } catch (error) {
    console.error('Error approving product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
