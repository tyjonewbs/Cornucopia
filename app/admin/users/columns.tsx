"use client"

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { UserRole } from '@prisma/client'

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

export const columns: ColumnDef<UserWithRelations>[] = [
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
