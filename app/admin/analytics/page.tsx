import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import prisma from '@/lib/db'
import { LineChart } from '@/components/ui/line-chart'
import { DataTable } from '@/components/ui/data-table'
import { columns } from './columns'

async function getAdminAnalyticsData() {
  // Get total counts with more detailed breakdowns
  const [
    totalBusinesses,
    totalVendors,
    totalCustomers,
    totalProducts,
    pendingBusinesses,
    activeUsers,
    totalReviews
  ] = await Promise.all([
    prisma.marketStand.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.marketStand.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ 
      where: { 
        sessions: { some: { endTime: { gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }
      } 
    }),
    prisma.productReview.count()
  ])

  // Get platform metrics
  const orderMetrics = await prisma.standMetrics.findMany({
    select: {
      dailyMetrics: {
        select: {
          date: true,
          orders: true,
          revenue: true,
          views: true,
          uniqueViews: true
        },
        orderBy: {
          date: 'asc'
        },
        take: 30 // Last 30 days
      }
    }
  })

  // Get user growth data
  const userGrowth = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
    orderBy: {
      _count: {
        role: 'desc'
      }
    }
  })

  // Get recent activity
  const recentActivity = await prisma.product.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      name: true,
      price: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          role: true
        }
      },
      marketStand: {
        select: {
          name: true,
          status: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 10
  })

  return {
    totalBusinesses,
    totalVendors,
    totalCustomers,
    totalProducts,
    pendingBusinesses,
    activeUsers,
    totalReviews,
    orderMetrics,
    userGrowth,
    recentActivity
  }
}

export default async function AdminAnalyticsDashboard() {
  const {
    totalBusinesses,
    totalVendors,
    totalCustomers,
    totalProducts,
    pendingBusinesses,
    activeUsers,
    totalReviews,
    orderMetrics,
    userGrowth,
    recentActivity
  } = await getAdminAnalyticsData()

  // Process data for charts
  const platformMetrics = orderMetrics.flatMap(metric => 
    metric.dailyMetrics.map(daily => ({
      date: daily.date,
      orders: daily.orders,
      revenue: daily.revenue / 100, // Convert cents to dollars
      views: daily.views,
      uniqueViews: daily.uniqueViews
    }))
  )

  // Calculate engagement rate
  const avgEngagementRate = platformMetrics.reduce((acc, curr) => 
    acc + (curr.uniqueViews > 0 ? (curr.orders / curr.uniqueViews) * 100 : 0), 0
  ) / platformMetrics.length

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Platform Analytics</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBusinesses}</div>
            <p className="text-xs text-gray-500">Pending: {pendingBusinesses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-gray-500">Total: {totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-gray-500">Reviews: {totalReviews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagementRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">30-day average</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={platformMetrics}
              xField="date"
              yField="revenue"
              height={300}
              valuePrefix="$"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart 
              data={platformMetrics}
              xField="date"
              yField="uniqueViews"
              height={300}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading...</div>}>
            <DataTable columns={columns} data={recentActivity} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
