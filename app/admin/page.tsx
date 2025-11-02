'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalUsers: number
  pendingStands: number
  pendingProducts: number
  reportedReviews: number
  totalOrders: number
  activeDeliveries: number
  pendingIssues: number
  totalRevenue: number
}

interface Activity {
  type: 'stand' | 'product'
  name: string
  oldStatus: string
  newStatus: string
  changedBy: string
  note: string
  createdAt: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    pendingStands: 0,
    pendingProducts: 0,
    reportedReviews: 0,
    totalOrders: 0,
    activeDeliveries: 0,
    pendingIssues: 0,
    totalRevenue: 0
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      const [statsResponse, activityResponse] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/activity')
      ])
      const [statsData, activityData] = await Promise.all([
        statsResponse.json(),
        activityResponse.json()
      ])
      setStats(statsData)
      setActivities(activityData.activities)
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Platform Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6 bg-blue-50">
            <h3 className="text-lg font-medium text-gray-900">Total Users</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
            <p className="mt-1 text-sm text-gray-500">Platform users</p>
          </Card>

          <Card className="p-6 bg-yellow-50">
            <h3 className="text-lg font-medium text-gray-900">Pending Stands</h3>
            <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.pendingStands}</p>
            <p className="mt-1 text-sm text-gray-500">Awaiting approval</p>
          </Card>

          <Card className="p-6 bg-purple-50">
            <h3 className="text-lg font-medium text-gray-900">Pending Products</h3>
            <p className="mt-2 text-3xl font-bold text-purple-600">{stats.pendingProducts}</p>
            <p className="mt-1 text-sm text-gray-500">Awaiting review</p>
          </Card>

          <Card className="p-6 bg-red-50">
            <h3 className="text-lg font-medium text-gray-900">Reported Reviews</h3>
            <p className="mt-2 text-3xl font-bold text-red-600">{stats.reportedReviews}</p>
            <p className="mt-1 text-sm text-gray-500">Need attention</p>
          </Card>
        </div>
      </div>

      {/* Delivery Oversight Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Oversight</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card 
            className="p-6 bg-indigo-50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/admin/orders')}
          >
            <h3 className="text-lg font-medium text-gray-900">Total Orders</h3>
            <p className="mt-2 text-3xl font-bold text-indigo-600">{stats.totalOrders}</p>
            <p className="mt-1 text-sm text-gray-500">All marketplace orders</p>
          </Card>

          <Card 
            className="p-6 bg-blue-50 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/admin/orders')}
          >
            <h3 className="text-lg font-medium text-gray-900">Active Deliveries</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{stats.activeDeliveries}</p>
            <p className="mt-1 text-sm text-gray-500">Orders in progress</p>
          </Card>

          <Card 
            className="p-6 bg-orange-50 cursor-pointer hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium text-gray-900">Pending Issues</h3>
            <p className="mt-2 text-3xl font-bold text-orange-600">{stats.pendingIssues}</p>
            <p className="mt-1 text-sm text-gray-500">Customer reports</p>
          </Card>

          <Card className="p-6 bg-green-50">
            <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">
              ${(stats.totalRevenue / 100).toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-gray-500">From completed orders</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Button
                variant="outline"
                className="w-full justify-start space-x-2"
                onClick={() => router.push('/admin/users')}
              >
                <span>View All Users</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start space-x-2"
                onClick={() => router.push('/admin/analytics')}
              >
                <span>View Analytics</span>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start space-x-2 text-yellow-600"
                onClick={() => router.push('/admin/market-stand/pending')}
              >
                <span>Review Pending Stands</span>
                {stats.pendingStands > 0 && (
                  <span className="ml-auto rounded-full bg-yellow-100 px-2 py-0.5 text-xs">
                    {stats.pendingStands}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start space-x-2 text-purple-600"
                onClick={() => router.push('/admin/products/pending')}
              >
                <span>Review Pending Products</span>
                {stats.pendingProducts > 0 && (
                  <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-xs">
                    {stats.pendingProducts}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start space-x-2 text-red-600"
                onClick={() => router.push('/admin/reviews/reported')}
              >
                <span>Review Reported Reviews</span>
                {stats.reportedReviews > 0 && (
                  <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs">
                    {stats.reportedReviews}
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start space-x-2"
                onClick={() => router.push('/admin/settings')}
              >
                <span>Platform Settings</span>
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          <div className="mt-4 space-y-4">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={cn(
                      "mt-0.5 w-2 h-2 rounded-full",
                      activity.type === 'stand' ? 'bg-yellow-500' : 'bg-purple-500'
                    )} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">{activity.name}</span>
                        {' '}status changed from{' '}
                        <span className="font-medium">{activity.oldStatus.toLowerCase()}</span>
                        {' '}to{' '}
                        <span className="font-medium">{activity.newStatus.toLowerCase()}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        by {activity.changedBy} • {new Date(activity.createdAt).toLocaleString()}
                      </p>
                      {activity.note && (
                        <p className="text-sm text-gray-600 mt-1">
                          Note: {activity.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
