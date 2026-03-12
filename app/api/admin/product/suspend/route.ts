import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createRouteHandlerClient } from '@/lib/supabase-route'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient()
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
      return NextResponse.json({ error: 'Suspension reason is required' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id },
      select: { status: true, name: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: {
          status: 'SUSPENDED',
          isActive: false
        }
      }),
      prisma.productStatusHistory.create({
        data: {
          productId: id,
          oldStatus: product.status,
          newStatus: 'SUSPENDED',
          changedById: authUser.id,
          note
        }
      })
    ])

    revalidatePath('/admin/products')
    revalidatePath('/admin/products/pending')
    revalidatePath('/admin')

    return NextResponse.json({
      success: true,
      message: `${product.name} has been suspended`
    })
  } catch (error) {
    console.error('Error suspending product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
