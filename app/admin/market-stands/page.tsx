import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/ui/data-table'
import prisma from '@/lib/db'
import { columns } from './columns'

// Force dynamic rendering - don't statically generate this page at build time
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getMarketStandsData() {
  const marketStands = await prisma.marketStand.findMany({
    select: {
      id: true,
      name: true,
      locationName: true,
      status: true,
      isActive: true,
      createdAt: true,
      averageRating: true,
      totalReviews: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      products: {
        select: {
          id: true,
          isActive: true
        }
      },
      reviews: {
        select: {
          id: true
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
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return marketStands
}

export default async function MarketStandsPage() {
  const marketStands = await getMarketStandsData()

  // Calculate stats
  const totalStands = marketStands.length
  const activeStands = marketStands.filter(s => s.isActive).length
  const approvedStands = marketStands.filter(s => s.status === 'APPROVED').length
  const pendingStands = marketStands.filter(s => s.status === 'PENDING').length
  const totalProducts = marketStands.reduce((sum, s) => sum + s.products.length, 0)
  const totalReviews = marketStands.reduce((sum, s) => sum + s.totalReviews, 0)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Market Stands</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStands}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeStands} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedStands}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((approvedStands / totalStands) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingStands}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalReviews} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Stands Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Market Stands</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={marketStands} />
        </CardContent>
      </Card>
    </div>
  )
}
