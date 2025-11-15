import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import prisma from '@/lib/db'
import { columns } from './columns'

// Force dynamic rendering - don't statically generate this page at build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getUsersData() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      marketStands: {
        select: {
          id: true,
          isActive: true
        }
      },
      products: {
        select: {
          id: true,
          isActive: true
        }
      }
    },
    orderBy: {
      email: 'asc' // Since there's no createdAt, sort by email
    }
  })

  // Transform to match expected type
  return users.map(user => ({
    ...user,
    createdAt: new Date() // Placeholder since User doesn't have createdAt
  }))
}

export default async function UsersPage() {
  const users = await getUsersData()

  // Get role counts
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleCounts.USER || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleCounts.ADMIN || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roleCounts.SUPER_ADMIN || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={users} />
        </CardContent>
      </Card>
    </div>
  )
}
