import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createRouteHandlerClient } from '@/lib/supabase-route'
import { revalidatePath } from 'next/cache'

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
    const { id, note } = body

    if (!id) {
      return NextResponse.json({ error: 'Stand ID is required' }, { status: 400 })
    }

    if (!note || !note.trim()) {
      return NextResponse.json({ error: 'Suspension reason is required' }, { status: 400 })
    }

    const stand = await prisma.marketStand.findUnique({
      where: { id },
      select: { status: true, name: true }
    })

    if (!stand) {
      return NextResponse.json({ error: 'Stand not found' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.marketStand.update({
        where: { id },
        data: {
          status: 'SUSPENDED',
          isActive: false
        }
      }),
      prisma.standStatusHistory.create({
        data: {
          marketStandId: id,
          oldStatus: stand.status,
          newStatus: 'SUSPENDED',
          changedById: authUser.id,
          note
        }
      })
    ])

    revalidatePath('/admin/market-stands')
    revalidatePath('/admin/market-stand/pending')
    revalidatePath('/admin')
    revalidatePath('/')
    revalidatePath(`/market-stand/${id}`)

    return NextResponse.json({
      success: true,
      message: `${stand.name} has been suspended`
    })
  } catch (error) {
    console.error('Error suspending stand:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
