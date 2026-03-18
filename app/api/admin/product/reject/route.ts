import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createRouteHandlerClient } from '@/lib/supabase-route'
import { revalidatePath } from 'next/cache'
import { sendProductRejectionEmail } from '@/lib/email/product-rejection'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const supabase = await createRouteHandlerClient()
    // Use getUser() for secure server-side auth validation
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
    const { id, note } = body

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Rejection note is required' }, { status: 400 })
    }

    // Get current product status and user info for email
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        status: true,
        name: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Update product status to REJECTED
    await prisma.$transaction([
      // Update the product
      prisma.product.update({
        where: { id },
        data: { status: 'REJECTED' }
      }),
      // Record the status change
      prisma.productStatusHistory.create({
        data: {
          productId: id,
          oldStatus: product.status,
          newStatus: 'REJECTED',
          changedById: authUser.id,
          note
        }
      })
    ])

    // Send rejection email (async, don't block the response)
    const producerName = product.user.firstName && product.user.lastName
      ? `${product.user.firstName} ${product.user.lastName}`
      : product.user.firstName || product.user.lastName || 'Producer'

    sendProductRejectionEmail({
      toEmail: product.user.email,
      producerName,
      productName: product.name,
      rejectionNote: note
    }).catch(err => {
      console.error('Failed to send rejection email:', err)
    })

    // Revalidate the pending products page
    revalidatePath('/admin/products/pending')
    revalidatePath('/admin/products')
    revalidatePath('/admin')

    return NextResponse.json({
      success: true,
      message: `${product.name} has been rejected`
    })
  } catch (error) {
    console.error('Error rejecting product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
