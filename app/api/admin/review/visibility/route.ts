import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createRouteHandlerClient } from '@/lib/supabase-route'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const supabase = createRouteHandlerClient()
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
    const { id, type, isVisible } = body

    if (!id || !type) {
      return NextResponse.json({ error: 'Review ID and type are required' }, { status: 400 })
    }

    if (typeof isVisible !== 'boolean') {
      return NextResponse.json({ error: 'isVisible must be a boolean' }, { status: 400 })
    }

    // Update review visibility based on type
    if (type === 'product') {
      await prisma.productReview.update({
        where: { id },
        data: { isVisible }
      })
    } else if (type === 'stand') {
      await prisma.standReview.update({
        where: { id },
        data: { isVisible }
      })
    } else {
      return NextResponse.json({ error: 'Invalid review type' }, { status: 400 })
    }

    // Revalidate the reported reviews page
    revalidatePath('/admin/reviews/reported')
    revalidatePath('/admin')

    return NextResponse.json({ 
      success: true,
      message: `Review ${isVisible ? 'shown' : 'hidden'} successfully`
    })
  } catch (error) {
    console.error('Error updating review visibility:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
