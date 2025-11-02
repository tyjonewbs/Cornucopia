"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export type AdminDeliveryZone = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  flaggedForReview: boolean
  flagReason: string | null
  isSuspended: boolean
  suspensionReason: string | null
  suspendedAt: Date | null
  createdAt: Date
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
  _count: {
    orders: number
    products: number
  }
  activeOrdersCount?: number
}

export const columns: ColumnDef<AdminDeliveryZone>[] = [
  {
    accessorKey: "name",
    header: "Zone Name",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        {row.original.description && (
          <div className="text-sm text-gray-500 truncate max-w-xs">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "user",
    header: "Producer",
    cell: ({ row }) => {
      const user = row.original.user
      return (
        <div>
          <div className="font-medium">
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.email}
          </div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      )
    },
  },
  {
    id: "orders",
    header: "Orders",
    cell: ({ row }) => {
      const total = row.original._count.orders
      const active = row.original.activeOrdersCount || 0
      return (
        <div>
          <div className="font-medium">{total} total</div>
          {active > 0 && (
            <div className="text-sm text-blue-600">{active} active</div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "_count.products",
    header: "Products",
    cell: ({ row }) => {
      const count = row.original._count.products
      return <div className="text-sm">{count}</div>
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const zone = row.original
      
      if (zone.isSuspended) {
        return (
          <div>
            <Badge className="bg-red-100 text-red-800" variant="secondary">
              SUSPENDED
            </Badge>
            {zone.suspensionReason && (
              <div className="text-xs text-gray-500 mt-1">
                {zone.suspensionReason}
              </div>
            )}
          </div>
        )
      }
      
      if (zone.flaggedForReview) {
        return (
          <div>
            <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
              FLAGGED
            </Badge>
            {zone.flagReason && (
              <div className="text-xs text-gray-500 mt-1">
                {zone.flagReason}
              </div>
            )}
          </div>
        )
      }
      
      if (zone.isActive) {
        return (
          <Badge className="bg-green-100 text-green-800" variant="secondary">
            ACTIVE
          </Badge>
        )
      }
      
      return (
        <Badge className="bg-gray-100 text-gray-600" variant="secondary">
          INACTIVE
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date
      return (
        <div className="text-sm text-gray-500">
          {format(new Date(date), "MMM d, yyyy")}
        </div>
      )
    },
  },
]
