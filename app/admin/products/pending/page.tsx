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

const columns: ColumnDef<PendingProduct>[] = [
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

async function getPendingProducts() {
  const products = await prisma.product.findMany({
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
      marketStand: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  return products
}

export default async function PendingProductsPage() {
  const products = await getPendingProducts()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pending Products</h1>
          <p className="text-gray-500 mt-1">Review and approve product submissions</p>
        </div>
        <div className="text-sm text-gray-500">
          {products.length} pending
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products Awaiting Review</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending products to review
            </div>
          ) : (
            <DataTable columns={columns} data={products} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
