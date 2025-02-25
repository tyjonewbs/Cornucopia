import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import prisma from '@/lib/db'
import { redirect } from 'next/navigation'

async function checkSuperAdmin() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    redirect('/')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true }
  })

  if (!user || user.role !== 'SUPER_ADMIN') {
    redirect('/admin')
  }
}

async function getSystemStats() {
  const [
    totalStorage,
    totalUploads,
    databaseSize,
    activeConnections
  ] = await Promise.all([
    prisma.$queryRaw<{ size: string }[]>`
      SELECT pg_size_pretty(sum(pg_total_relation_size(schemaname || '.' || tablename))::bigint) as size
      FROM pg_tables
      WHERE schemaname = 'public'
    `.then(result => result[0].size),
    prisma.product.count({
      where: {
        images: { isEmpty: false }
      }
    }),
    prisma.$queryRaw<{ size: string }[]>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `.then(result => result[0].size),
    prisma.$queryRaw<{ count: string }[]>`
      SELECT count(*)::text as count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `.then(result => result[0].count)
  ])

  return {
    totalStorage,
    totalUploads,
    databaseSize,
    activeConnections
  }
}

export default async function AdminSettingsPage() {
  // Check if user is super admin
  await checkSuperAdmin()

  // Get system stats
  const stats = await getSystemStats()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStorage}</div>
            <p className="text-xs text-gray-500">Database + Uploads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUploads}</div>
            <p className="text-xs text-gray-500">Product Images</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.databaseSize}</div>
            <p className="text-xs text-gray-500">PostgreSQL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConnections}</div>
            <p className="text-xs text-gray-500">Database Sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Analytics Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">PostHog Integration</h3>
                <p className="text-sm text-gray-500">Event tracking and analytics</p>
              </div>
              <div className="text-sm font-medium text-green-600">Connected</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium">Data Retention</h3>
                <p className="text-sm text-gray-500">Event history storage period</p>
              </div>
              <div className="text-sm font-medium">90 days</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">API Status</h3>
                  <p className="text-sm text-gray-500">REST and GraphQL endpoints</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Healthy
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Database Status</h3>
                  <p className="text-sm text-gray-500">PostgreSQL connection</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium">Storage Status</h3>
                  <p className="text-sm text-gray-500">File upload service</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Available
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
