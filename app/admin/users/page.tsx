import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import prisma from '@/lib/db'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { UserRole } from '@prisma/client'

// Force dynamic rendering - don't statically generate this page at build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

type UserWithRelations = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  createdAt: Date
  marketStands: Array<{
    id: string
    isActive: boolean
  }>
  products: Array<{
    id: string
    isActive: boolean
  }>
}

// Define columns for the users table
const columns: ColumnDef<UserWithRelations>[] = [
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{`${user.firstName} ${user.lastName}`}</span>
          <span className="text-sm text-gray-500">{user.email}</span>
        </div>
      )
    }
  },
  {
    id: "role",
    header: "Role",
    accessorFn: row => row.role,
    cell: ({ row }) => {
      const role = row.getValue("role") as UserRole
      return (
        <Badge 
          variant={
            role === 'SUPER_ADMIN' ? 'destructive' :
            role === 'ADMIN' ? 'default' :
            'secondary'
          }
        >
          {role.toLowerCase().replace('_', ' ')}
        </Badge>
      )
    }
  },
  {
    id: "createdAt",
    header: "Joined",
    accessorFn: row => row.createdAt,
    cell: ({ row }) => {
      return formatDistanceToNow(new Date(row.getValue("createdAt")), { addSuffix: true })
    }
  },
  {
    id: "marketStands",
    header: "Stands",
    accessorFn: row => row.marketStands,
    cell: ({ row }) => {
      const stands = row.original.marketStands
      return (
        <div className="text-center">
          <span className="font-medium">{stands.length}</span>
          {stands.length > 0 && (
            <div className="text-xs text-gray-500">
              {stands.filter(s => s.isActive).length} active
            </div>
          )}
        </div>
      )
    }
  },
  {
    id: "products",
    header: "Products",
    accessorFn: row => row.products,
    cell: ({ row }) => {
      const products = row.original.products
      return (
        <div className="text-center">
          <span className="font-medium">{products.length}</span>
          {products.length > 0 && (
            <div className="text-xs text-gray-500">
              {products.filter(p => p.isActive).length} active
            </div>
          )}
        </div>
      )
    }
  }
]

async function getUsersData() {
  const users = await prisma.$queryRaw<UserWithRelations[]>`
    SELECT 
      u.id,
      u.email,
      u."firstName",
      u."lastName",
      u.role,
      u."createdAt",
      COALESCE(
        (
          SELECT json_agg(json_build_object('id', ms.id, 'isActive', ms."isActive"))
          FROM "MarketStand" ms
          WHERE ms."userId" = u.id
        ),
        '[]'::json
      ) as "marketStands",
      COALESCE(
        (
          SELECT json_agg(json_build_object('id', p.id, 'isActive', p."isActive"))
          FROM "Product" p
          WHERE p."userId" = u.id
        ),
        '[]'::json
      ) as products
    FROM "User" u
    ORDER BY u."createdAt" DESC
  `

  return users
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
