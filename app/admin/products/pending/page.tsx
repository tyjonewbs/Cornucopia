import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import prisma from '@/lib/db'
import { columns } from './columns'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
