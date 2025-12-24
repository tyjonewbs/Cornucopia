import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/db'
import { LineChart } from '@/components/ui/line-chart'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'
import { getSupabaseServer } from '@/lib/supabase-server'

// Force dynamic rendering - page uses cookies() via getSupabaseServer() and database queries
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getUserAnalyticsData() {
  const supabase = getSupabaseServer()
  // Use getUser() for secure server-side auth validation
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  const userId = user.id

  // Get user's market stands and products
  const [
    userStands,
    totalProducts,
    totalOrders,
    totalRevenue
  ] = await Promise.all([
    prisma.marketStand.count({ 
      where: { 
        userId,
        isActive: true 
      } 
    }),
    prisma.product.count({ 
      where: { 
        userId,
        isActive: true 
      } 
    }),
    prisma.standMetrics.findMany({
      where: {
        marketStand: {
          userId
        }
      },
      select: {
        totalOrders: true
      }
    }).then(metrics => metrics.reduce((sum, m) => sum + m.totalOrders, 0)),
    prisma.standMetrics.findMany({
      where: {
        marketStand: {
          userId
        }
      },
      select: {
        totalRevenue: true
      }
    }).then(metrics => metrics.reduce((sum, m) => sum + m.totalRevenue, 0))
  ])

  // Get order metrics for charts
  const orderMetrics = await prisma.standMetrics.findMany({
    where: {
      marketStand: {
        userId
      }
    },
    select: {
      dailyMetrics: {
        select: {
          date: true,
          orders: true,
          revenue: true,
          views: true
        },
        orderBy: {
          date: 'asc'
        },
        take: 30 // Last 30 days
      }
    }
  })

  // Get recent products
  const recentProducts = await prisma.product.findMany({
    where: {
      userId,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      price: true,
      status: true,
      createdAt: true,
      marketStand: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })

  return {
    userStands,
    totalProducts,
    totalOrders,
    totalRevenue,
    orderMetrics,
    recentProducts
  }
}

export default async function UserAnalyticsDashboard() {
  const data = await getUserAnalyticsData()

  if (!data) {
    return <div>Please sign in to view analytics.</div>
  }

  const {
    userStands,
    totalProducts,
    totalOrders,
    totalRevenue,
    orderMetrics,
    recentProducts
  } = data

  // Process data for charts
  const metrics = orderMetrics.flatMap(metric => 
    metric.dailyMetrics.map(daily => ({
      date: daily.date,
      orders: daily.orders,
      revenue: daily.revenue / 100, // Convert cents to dollars
      views: daily.views
    }))
  )

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Your Analytics</h1>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Stands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStands}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(totalRevenue / 100)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={metrics}
              xField="date"
              yField="orders"
              height={300}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={metrics}
              xField="date"
              yField="revenue"
              height={300}
              valuePrefix="$"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <DataTable columns={columns} data={recentProducts} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
