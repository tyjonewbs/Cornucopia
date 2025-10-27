import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import prisma from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { ColumnDef } from '@tanstack/react-table'
import { Status } from '@prisma/client'
import { formatDistanceToNow } from 'date-fns'
import { ApprovalActions } from '@/components/admin/ApprovalActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

const columns: ColumnDef<PendingStand>[] = [
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

async function getPendingStands() {
  const stands = await prisma.marketStand.findMany({
    where: {
      status: 'PENDING',
      isActive: true
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      },
      _count: {
        select: {
          products: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  return stands
}

export default async function PendingStandsPage() {
  const stands = await getPendingStands()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pending Market Stands</h1>
          <p className="text-gray-500 mt-1">Review and approve market stand submissions</p>
        </div>
        <div className="text-sm text-gray-500">
          {stands.length} pending
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submissions Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent>
          {stands.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending market stands to review
            </div>
          ) : (
            <DataTable columns={columns} data={stands} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
