import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns'

type RecentActivity = {
  id: string
  name: string
  price: number
  status: string
  createdAt: Date
  user: {
    firstName: string | null
    lastName: string | null
    role: string
  }
  marketStand: {
    name: string
    status: string
  } | null
}

export const columns: ColumnDef<RecentActivity>[] = [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col">
          <span className="font-medium">{row.getValue("name")}</span>
          <span className="text-sm text-gray-500">
            {row.original.marketStand?.name || 'N/A'}
          </span>
        </div>
      )
    }
  },
  {
    accessorKey: "user",
    header: "Vendor",
    cell: ({ row }) => {
      const user = row.original.user
      const displayName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.lastName || 'Unknown'
      return (
        <div className="flex flex-col">
          <span>{displayName}</span>
          <Badge variant="outline" className="w-fit">{user.role}</Badge>
        </div>
      )
    }
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount / 100)
 
      return <div className="font-medium">{formatted}</div>
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
          variant={
            status === 'APPROVED' ? 'default' :
            status === 'PENDING' ? 'secondary' :
            'destructive'
          }
        >
          {status.toLowerCase()}
        </Badge>
      )
    }
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      return formatDistanceToNow(new Date(row.getValue("createdAt")), { addSuffix: true })
    }
  }
]
