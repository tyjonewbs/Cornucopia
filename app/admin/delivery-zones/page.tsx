'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { columns, AdminDeliveryZone } from './columns'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function AdminDeliveryZonesPage() {
  const [zones, setZones] = useState<AdminDeliveryZone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    zoneId: string | null
    zoneName: string
    action: 'FLAG' | 'UNFLAG' | 'SUSPEND' | 'UNSUSPEND' | null
    reason: string
  }>({
    open: false,
    zoneId: null,
    zoneName: '',
    action: null,
    reason: '',
  })

  useEffect(() => {
    fetchZones()
  }, [])

  async function fetchZones() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/delivery-zones')
      const data = await response.json()
      
      setZones(data.zones || [])
      setError('')
    } catch (error) {
      console.error('Error fetching delivery zones:', error)
      setError('Failed to load delivery zones')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction() {
    if (!actionDialog.zoneId || !actionDialog.action) return

    try {
      const response = await fetch('/api/admin/delivery-zones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: actionDialog.zoneId,
          action: actionDialog.action,
          reason: actionDialog.reason || undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to update zone')

      setActionDialog({ open: false, zoneId: null, zoneName: '', action: null, reason: '' })
      setError('')
      fetchZones()
    } catch (error) {
      console.error('Error updating zone:', error)
      setError('Failed to update delivery zone')
    }
  }

  const stats = {
    total: zones.length,
    active: zones.filter(z => z.isActive && !z.isSuspended).length,
    flagged: zones.filter(z => z.flaggedForReview).length,
    suspended: zones.filter(z => z.isSuspended).length,
  }

  // Add action buttons to columns
  const columnsWithActions = [
    ...columns,
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const zone = row.original as AdminDeliveryZone
        
        return (
          <div className="flex gap-2">
            {!zone.flaggedForReview && !zone.isSuspended && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setActionDialog({
                    open: true,
                    zoneId: zone.id,
                    zoneName: zone.name,
                    action: 'FLAG',
                    reason: '',
                  })
                }
              >
                Flag
              </Button>
            )}
            
            {zone.flaggedForReview && !zone.isSuspended && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setActionDialog({
                      open: true,
                      zoneId: zone.id,
                      zoneName: zone.name,
                      action: 'UNFLAG',
                      reason: '',
                    })
                  }
                >
                  Unflag
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() =>
                    setActionDialog({
                      open: true,
                      zoneId: zone.id,
                      zoneName: zone.name,
                      action: 'SUSPEND',
                      reason: '',
                    })
                  }
                >
                  Suspend
                </Button>
              </>
            )}
            
            {zone.isSuspended && (
              <Button
                size="sm"
                variant="default"
                onClick={() =>
                  setActionDialog({
                    open: true,
                    zoneId: zone.id,
                    zoneName: zone.name,
                    action: 'UNSUSPEND',
                    reason: '',
                  })
                }
              >
                Unsuspend
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Zones</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage producer delivery zones
          </p>
        </div>
        <Button onClick={fetchZones} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-blue-50">
          <h3 className="text-sm font-medium text-gray-900">Total Zones</h3>
          <p className="mt-2 text-2xl font-bold text-blue-600">{stats.total}</p>
        </Card>

        <Card className="p-4 bg-green-50">
          <h3 className="text-sm font-medium text-gray-900">Active</h3>
          <p className="mt-2 text-2xl font-bold text-green-600">{stats.active}</p>
        </Card>

        <Card className="p-4 bg-yellow-50">
          <h3 className="text-sm font-medium text-gray-900">Flagged</h3>
          <p className="mt-2 text-2xl font-bold text-yellow-600">{stats.flagged}</p>
        </Card>

        <Card className="p-4 bg-red-50">
          <h3 className="text-sm font-medium text-gray-900">Suspended</h3>
          <p className="mt-2 text-2xl font-bold text-red-600">{stats.suspended}</p>
        </Card>
      </div>

      {/* Zones Table */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading delivery zones...</div>
          </div>
        ) : (
          <DataTable columns={columnsWithActions} data={zones} />
        )}
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => 
        setActionDialog({ ...actionDialog, open })
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action} Delivery Zone
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'FLAG' && 
                `Flag "${actionDialog.zoneName}" for admin review. This won't prevent new orders.`
              }
              {actionDialog.action === 'UNFLAG' && 
                `Remove the flag from "${actionDialog.zoneName}".`
              }
              {actionDialog.action === 'SUSPEND' && 
                `Suspend "${actionDialog.zoneName}". This will prevent all new orders for this zone.`
              }
              {actionDialog.action === 'UNSUSPEND' && 
                `Unsuspend "${actionDialog.zoneName}" and allow new orders.`
              }
            </DialogDescription>
          </DialogHeader>

          {(actionDialog.action === 'FLAG' || actionDialog.action === 'SUSPEND') && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason {actionDialog.action === 'SUSPEND' ? '(required)' : '(optional)'}
              </Label>
              <Textarea
                id="reason"
                placeholder="Enter reason..."
                value={actionDialog.reason}
                onChange={(e) =>
                  setActionDialog({ ...actionDialog, reason: e.target.value })
                }
                rows={4}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, zoneId: null, zoneName: '', action: null, reason: '' })
              }
            >
              Cancel
            </Button>
            <Button
              variant={actionDialog.action === 'SUSPEND' ? 'destructive' : 'default'}
              onClick={handleAction}
              disabled={
                actionDialog.action === 'SUSPEND' && !actionDialog.reason.trim()
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
