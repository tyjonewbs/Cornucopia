"use client"

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { UserRole } from '@prisma/client'
import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type UserWithRelations = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
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

function RoleBadgeDropdown({ user }: { user: UserWithRelations }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleChange = (newRole: UserRole) => {
    setSelectedRole(newRole)
    setIsDialogOpen(true)
  }

  const confirmRoleChange = async () => {
    if (!selectedRole) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, newRole: selectedRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role')
      }

      toast.success(data.message || 'Role updated successfully')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role')
    } finally {
      setIsLoading(false)
      setIsDialogOpen(false)
      setSelectedRole(null)
    }
  }

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.lastName || user.email

  const availableRoles = (['USER', 'ADMIN', 'SUPER_ADMIN'] as UserRole[])
    .filter(r => r !== user.role)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none">
            <Badge
              variant={
                user.role === 'SUPER_ADMIN' ? 'destructive' :
                user.role === 'ADMIN' ? 'default' :
                'secondary'
              }
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              {user.role.toLowerCase().replace('_', ' ')}
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {availableRoles.map(role => (
            <DropdownMenuItem key={role} onClick={() => handleRoleChange(role)}>
              Set as {role.toLowerCase().replace('_', ' ')}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              <p>
                Change <strong>{displayName}</strong> from{' '}
                <strong>{user.role.toLowerCase().replace('_', ' ')}</strong> to{' '}
                <strong>{selectedRole?.toLowerCase().replace('_', ' ')}</strong>?
              </p>
              {selectedRole === 'SUPER_ADMIN' && (
                <p className="mt-2 text-red-600 font-medium">
                  Super Admins have full access to all platform settings and user management.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const columns: ColumnDef<UserWithRelations>[] = [
  {
    id: "name",
    header: "Name",
    cell: ({ row }) => {
      const user = row.original
      const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.lastName || 'Unknown'
      return (
        <div className="flex flex-col">
          <span className="font-medium">{displayName}</span>
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
      const user = row.original
      return <RoleBadgeDropdown user={user} />
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
