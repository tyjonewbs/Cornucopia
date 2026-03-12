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
  deliveryDays: string[]
  deliveryFee: number
  freeDeliveryThreshold: number | null
  minimumOrder: number | null
  zipCodes: string[]
  cities: string[]
  states: string[]
  deliveryType: string
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
    id: "schedule",
    header: "Schedule & Fees",
    cell: ({ row }) => {
      const zone = row.original
      return (
        <div className="text-sm space-y-1">
          {zone.deliveryDays.length > 0 && (
            <div className="text-xs">
              <span className="font-medium">Days:</span>{' '}
              {zone.deliveryDays.map(d => d.slice(0, 3)).join(', ')}
            </div>
          )}
          <div className="text-xs">
            <span className="font-medium">Fee:</span>{' '}
            {zone.deliveryFee === 0 ? 'Free' : `$${(zone.deliveryFee / 100).toFixed(2)}`}
          </div>
          {zone.minimumOrder && (
            <div className="text-xs text-gray-500">
              Min: ${(zone.minimumOrder / 100).toFixed(2)}
            </div>
          )}
          {zone.freeDeliveryThreshold && (
            <div className="text-xs text-gray-500">
              Free over ${(zone.freeDeliveryThreshold / 100).toFixed(2)}
            </div>
          )}
          <Badge variant="outline" className="text-xs mt-1">
            {zone.deliveryType.replace('_', ' ').toLowerCase()}
          </Badge>
        </div>
      )
    },
  },
  {
    id: "coverage",
    header: "Coverage",
    cell: ({ row }) => {
      const zone = row.original
      const areas: string[] = []
      if (zone.cities.length > 0) areas.push(...zone.cities.slice(0, 3))
      if (zone.states.length > 0) areas.push(...zone.states)
      if (zone.zipCodes.length > 0) areas.push(`${zone.zipCodes.length} zip codes`)

      if (areas.length === 0) return <span className="text-xs text-gray-400">Not specified</span>

      return (
        <div className="text-xs space-y-0.5">
          {areas.map((area, i) => (
            <div key={i}>{area}</div>
          ))}
        </div>
      )
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
