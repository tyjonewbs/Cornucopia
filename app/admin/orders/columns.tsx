"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export type AdminOrder = {
  id: string
  orderNumber: string
  status: string
  type: string
  totalAmount: number
  createdAt: Date
  deliveryDate: Date | null
  user: {
    id: string
    email: string
    firstName: string | null
    lastName: string | null
  }
  marketStand: {
    id: string
    name: string
    user: {
      id: string
      email: string
      firstName: string | null
      lastName: string | null
    }
  }
  deliveryZone: {
    id: string
    name: string
  } | null
  items: Array<{
    id: string
    quantity: number
    price: number
    product: {
      id: string
      name: string
      images: string[]
    }
  }>
  issues: Array<{
    id: string
    issueType: string
    status: string
    createdAt: Date
  }>
}

function getStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800'
    case 'READY':
      return 'bg-purple-100 text-purple-800'
    case 'DELIVERED':
      return 'bg-green-100 text-green-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const columns: ColumnDef<AdminOrder>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order #",
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue("orderNumber")}</div>
    ),
  },
  {
    accessorKey: "user",
    header: "Customer",
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
    accessorKey: "marketStand",
    header: "Producer",
    cell: ({ row }) => {
      const stand = row.original.marketStand
      const producer = stand.user
      return (
        <div>
          <div className="font-medium">{stand.name}</div>
          <div className="text-sm text-gray-500">
            {producer.firstName && producer.lastName
              ? `${producer.firstName} ${producer.lastName}`
              : producer.email}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "deliveryZone",
    header: "Delivery Zone",
    cell: ({ row }) => {
      const zone = row.original.deliveryZone
      return zone ? (
        <div className="text-sm">{zone.name}</div>
      ) : (
        <div className="text-sm text-gray-400">N/A</div>
      )
    },
  },
  {
    accessorKey: "deliveryDate",
    header: "Delivery Date",
    cell: ({ row }) => {
      const date = row.getValue("deliveryDate") as Date | null
      return date ? (
        <div className="text-sm">{format(new Date(date), "MMM d, yyyy")}</div>
      ) : (
        <div className="text-sm text-gray-400">Not set</div>
      )
    },
  },
  {
    accessorKey: "totalAmount",
    header: "Total",
    cell: ({ row }) => {
      const amount = row.getValue("totalAmount") as number
      return <div className="font-medium">${(amount / 100).toFixed(2)}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge className={getStatusColor(status)} variant="secondary">
          {status}
        </Badge>
      )
    },
  },
  {
    id: "issues",
    header: "Issues",
    cell: ({ row }) => {
      const issues = row.original.issues
      const pendingIssues = issues.filter(i => i.status === 'PENDING')
      
      if (pendingIssues.length > 0) {
        return (
          <Badge className="bg-red-100 text-red-800" variant="secondary">
            {pendingIssues.length} pending
          </Badge>
        )
      }
      
      if (issues.length > 0) {
        return (
          <Badge className="bg-gray-100 text-gray-600" variant="secondary">
            {issues.length} resolved
          </Badge>
        )
      }
      
      return <div className="text-sm text-gray-400">None</div>
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date
      return <div className="text-sm text-gray-500">{format(new Date(date), "MMM d, yyyy")}</div>
    },
  },
]
