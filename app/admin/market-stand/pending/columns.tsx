'use client'

import { Badge } from '@/components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { Status } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { ApprovalActions } from '@/components/admin/ApprovalActions'

type PendingStand = {
  id: string
  name: string
  locationName: string
  status: Status
  createdAt: Date
  user: {
    firstName: string
    lastName: string
    email: string
  }
  _count: {
    products: number
  }
}

export const columns: ColumnDef<PendingStand>[] = [
  {
    id: "name",
    header: "Market Stand",
    cell: ({ row }) => {
      const stand = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{stand.name}</span>
          <span className="text-sm text-gray-500">{stand.locationName}</span>
        </div>
      )
    }
  },
  {
    id: "owner",
    header: "Owner",
    cell: ({ row }) => {
      const { user } = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{`${user.firstName} ${user.lastName}`}</span>
          <span className="text-sm text-gray-500">{user.email}</span>
        </div>
      )
    }
  },
  {
    id: "status",
    header: "Status",
    accessorFn: row => row.status,
    cell: ({ row }) => {
      const status = row.getValue("status") as Status
      return (
        <Badge variant={status === 'PENDING' ? 'default' : 'secondary'}>
          {status.toLowerCase()}
        </Badge>
      )
    }
  },
  {
    id: "products",
    header: "Products",
    accessorFn: row => row._count.products,
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue("products")}</div>
    }
  },
  {
    id: "createdAt",
    header: "Submitted",
    accessorFn: row => row.createdAt,
    cell: ({ row }) => {
      return formatDistanceToNow(new Date(row.getValue("createdAt")), { addSuffix: true })
    }
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const stand = row.original
      return (
        <ApprovalActions
          itemId={stand.id}
          itemType="stand"
          itemName={stand.name}
        />
      )
    }
  }
]
