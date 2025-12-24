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
    const { id, note } = body

    if (!id) {
      return NextResponse.json({ error: 'Stand ID is required' }, { status: 400 })
    }

    // Get current stand status
    const stand = await prisma.marketStand.findUnique({
      where: { id },
      select: { status: true, name: true }
    })

    if (!stand) {
      return NextResponse.json({ error: 'Stand not found' }, { status: 404 })
    }

    // Update stand status to APPROVED
    await prisma.$transaction([
      // Update the stand
      prisma.marketStand.update({
        where: { id },
        data: { status: 'APPROVED' }
      }),
      // Record the status change
      prisma.standStatusHistory.create({
        data: {
          marketStandId: id,
          oldStatus: stand.status,
          newStatus: 'APPROVED',
          changedById: authUser.id,
          note: note || 'Approved by admin'
        }
      })
    ])

    // Revalidate the pending stands page
    revalidatePath('/admin/market-stand/pending')
    revalidatePath('/admin')

    return NextResponse.json({ 
      success: true,
      message: `${stand.name} has been approved`
    })
  } catch (error) {
    console.error('Error approving stand:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
