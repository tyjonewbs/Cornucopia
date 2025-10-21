import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import prisma from '@/lib/db'
import Link from 'next/link'
import { AdminNav } from '@/components/admin/AdminNav'

// Force dynamic rendering - layout uses cookies() via getSupabaseServer()
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getUser() {
  const supabase = getSupabaseServer()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error)
    return null
  }

  if (!session?.user) {
    return null
  }

  // Check role from user metadata first
  const role = session.user.user_metadata?.role
  if (role && ['ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return { role }
  }

  // Fallback to database check
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return null
  }

  // Update Supabase metadata if it doesn't match
  if (role !== user.role) {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    await adminClient.auth.admin.updateUserById(
      session.user.id,
      {
        user_metadata: {
          ...session.user.user_metadata,
          role: user.role
        }
      }
    )
  }

  return user
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const user = await getUser()

    // Redirect if not admin
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      console.log('[AdminLayout] Access denied:', user?.role)
      redirect('/')
    }

    return (
      <div className="min-h-screen bg-gray-100">
        {/* Admin Header */}
        <header className="bg-white shadow">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/admin" className="text-xl font-bold">
                    Admin Portal
                  </Link>
                </div>
                <AdminNav isSuperAdmin={user.role === 'SUPER_ADMIN'} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-10">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error in admin layout:', error)
    redirect('/auth/login')
  }
}
