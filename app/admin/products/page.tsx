import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import prisma from '@/lib/db'
import { columns } from './columns'
import { PendingProductCard } from '@/components/admin/PendingProductCard'

export const dynamic = 'force-dynamic'

async function getProductsData() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      inventory: true,
      status: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      averageRating: true,
      totalReviews: true,
      deliveryAvailable: true,
      tags: true,
      adminTags: true,
      inventoryUpdatedAt: true,
      images: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      marketStand: {
        select: {
          id: true,
          name: true,
          locationName: true
        }
      },
      standListings: {
        select: {
          marketStandId: true,
          customInventory: true,
          isActive: true,
          marketStand: {
            select: {
              id: true,
              name: true
            }
          }
        },
        where: {
          isActive: true
        }
      },
      deliveryZone: {
        select: {
          id: true,
          name: true,
          zipCodes: true,
          deliveryDays: true,
          deliveryFee: true
        }
      },
      deliveryListings: {
        select: {
          dayOfWeek: true,
          inventory: true,
          deliveryZoneId: true
        }
      },
      local: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      },
      statusHistory: {
        select: {
          id: true,
          oldStatus: true,
          newStatus: true,
          note: true,
          createdAt: true,
          changedBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 3
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return products
}

export default async function ProductsPage() {
  const products = await getProductsData()

  const totalProducts = products.length
  const activeProducts = products.filter(p => p.isActive && p.status === 'APPROVED').length
  const pendingProducts = products.filter(p => p.status === 'PENDING')
  const suspendedProducts = products.filter(p => p.status === 'SUSPENDED').length
  const outOfStock = products.filter(p => p.isActive && p.inventory === 0).length

  // Sort pending products oldest first (they have been waiting longest)
  const sortedPendingProducts = [...pendingProducts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Product Review</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingProducts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{suspendedProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{outOfStock}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review {pendingProducts.length > 0 && `(${pendingProducts.length})`}
          </TabsTrigger>
          <TabsTrigger value="all">All Products</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {sortedPendingProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No pending products to review
              </CardContent>
            </Card>
          ) : (
            sortedPendingProducts.map(product => (
              <PendingProductCard key={product.id} product={product} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Products</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={products} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
