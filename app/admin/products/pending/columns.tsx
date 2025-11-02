'use client'

import { Badge } from '@/components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { Status } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { ApprovalActions } from '@/components/admin/ApprovalActions'

type PendingProduct = {
  id: string
  name: string
  price: number
  status: Status
  createdAt: Date
  user: {
    firstName: string
    lastName: string
    email: string
  }
  marketStand: {
    name: string
  }
}

export const columns: ColumnDef<PendingProduct>[] = [
  {
    id: "name",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium">{product.name}</span>
          <span className="text-sm text-gray-500">${(product.price / 100).toFixed(2)}</span>
        </div>
      )
    }
  },
  {
    id: "marketStand",
    header: "Market Stand",
    accessorFn: row => row.marketStand.name,
    cell: ({ row }) => {
      return <span className="text-sm">{row.getValue("marketStand")}</span>
    }
  },
  {
    id: "owner",
    header: "Owner",
    cell: ({ row }) => {
      const { user } = row.original
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{`${user.firstName} ${user.lastName}`}</span>
          <span className="text-xs text-gray-500">{user.email}</span>
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
      const product = row.original
      return (
        <ApprovalActions
          itemId={product.id}
          itemType="product"
          itemName={product.name}
        />
      )
    }
  }
]
