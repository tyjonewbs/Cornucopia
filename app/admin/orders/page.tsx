'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { columns, AdminOrder } from './columns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  async function fetchOrders() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()
      
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    ready: orders.filter(o => o.status === 'READY').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
    withIssues: orders.filter(o => o.issues.some(i => i.status === 'PENDING')).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor all marketplace delivery orders
          </p>
        </div>
        <Button onClick={fetchOrders} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="p-4 bg-blue-50">
          <h3 className="text-sm font-medium text-gray-900">Total Orders</h3>
          <p className="mt-2 text-2xl font-bold text-blue-600">{stats.total}</p>
        </Card>

        <Card className="p-4 bg-yellow-50">
          <h3 className="text-sm font-medium text-gray-900">Pending</h3>
          <p className="mt-2 text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </Card>

        <Card className="p-4 bg-purple-50">
          <h3 className="text-sm font-medium text-gray-900">Confirmed</h3>
          <p className="mt-2 text-2xl font-bold text-purple-600">{stats.confirmed}</p>
        </Card>

        <Card className="p-4 bg-indigo-50">
          <h3 className="text-sm font-medium text-gray-900">Ready</h3>
          <p className="mt-2 text-2xl font-bold text-indigo-600">{stats.ready}</p>
        </Card>

        <Card className="p-4 bg-green-50">
          <h3 className="text-sm font-medium text-gray-900">Delivered</h3>
          <p className="mt-2 text-2xl font-bold text-green-600">{stats.delivered}</p>
        </Card>

        <Card className="p-4 bg-red-50">
          <h3 className="text-sm font-medium text-gray-900">With Issues</h3>
          <p className="mt-2 text-2xl font-bold text-red-600">{stats.withIssues}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="READY">Ready</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="link"
            onClick={() => setStatusFilter('all')}
            className="text-sm"
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading orders...</div>
          </div>
        ) : (
          <DataTable columns={columns} data={orders} />
        )}
      </Card>
    </div>
  )
}
