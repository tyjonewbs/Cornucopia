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

    const adminUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { role: true }
    })

    if (!adminUser || !['ADMIN', 'SUPER_ADMIN'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, newRole } = body

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'User ID and new role are required' }, { status: 400 })
    }

    if (!['USER', 'ADMIN', 'SUPER_ADMIN'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Only SUPER_ADMIN can promote to SUPER_ADMIN or ADMIN
    if ((newRole === 'SUPER_ADMIN' || newRole === 'ADMIN') && adminUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only Super Admins can assign admin roles' }, { status: 403 })
    }

    // Prevent self-demotion
    if (userId === authUser.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, firstName: true, lastName: true, email: true }
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent demoting another SUPER_ADMIN unless you are SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN' && adminUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cannot modify Super Admin users' }, { status: 403 })
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    })

    // Also update Supabase user metadata
    const { error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: newRole }
    })

    if (metadataError) {
      console.warn('Failed to update Supabase user metadata:', metadataError)
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin')

    const displayName = targetUser.firstName && targetUser.lastName
      ? `${targetUser.firstName} ${targetUser.lastName}`
      : targetUser.email

    return NextResponse.json({
      success: true,
      message: `${displayName} role changed to ${newRole.toLowerCase().replace('_', ' ')}`
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
