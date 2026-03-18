'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Check, X, Loader2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Status } from '@prisma/client'

type PendingProduct = {
  id: string
  name: string
  price: number
  inventory: number
  status: Status
  createdAt: Date
  deliveryAvailable: boolean
  tags: string[]
  images: string[]
  user: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string
  }
  marketStand: {
    id: string
    name: string
    locationName: string | null
  } | null
  standListings: {
    marketStandId: string
    customInventory: number | null
    isActive: boolean
    marketStand: {
      id: string
      name: string
    }
  }[]
  deliveryZone: {
    id: string
    name: string
    zipCodes: string[]
    deliveryDays: string[]
    deliveryFee: number
  } | null
  deliveryListings: {
    dayOfWeek: string
    inventory: number
    deliveryZoneId: string
  }[]
  local: {
    id: string
    name: string
    slug: string | null
  } | null
}

export function PendingProductCard({ product }: { product: PendingProduct }) {
  const router = useRouter()
  const [showRejectNote, setShowRejectNote] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  const producerName = product.user.firstName && product.user.lastName
    ? `${product.user.firstName} ${product.user.lastName}`
    : product.user.firstName || product.user.lastName || 'Unknown'

  const totalStandInventory = product.standListings.reduce(
    (sum, listing) => sum + (listing.customInventory ?? product.inventory),
    0
  ) || product.inventory

  const totalDeliveryInventory = product.deliveryListings.reduce(
    (sum, listing) => sum + listing.inventory,
    0
  )

  async function handleApprove() {
    setIsApproving(true)
    try {
      const response = await fetch('/api/admin/product/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          note: 'Approved by admin'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve')
      }

      toast.success('Product approved successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to approve. Please try again.')
      console.error('Approval error:', error)
    } finally {
      setIsApproving(false)
    }
  }

  async function handleReject() {
    if (rejectionNote.trim().length < 10) {
      toast.error('Please provide a rejection note (minimum 10 characters)')
      return
    }

    setIsRejecting(true)
    try {
      const response = await fetch('/api/admin/product/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product.id,
          note: rejectionNote
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reject')
      }

      toast.success('Product rejected and producer notified')
      router.refresh()
    } catch (error) {
      toast.error('Failed to reject. Please try again.')
      console.error('Rejection error:', error)
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        {/* Left: Image grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {product.images.slice(0, 4).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${product.name} ${idx + 1}`}
                className="w-full h-32 object-cover rounded border"
              />
            ))}
            {product.images.length === 0 && (
              <div className="col-span-2 w-full h-32 bg-gray-100 rounded border flex items-center justify-center text-gray-400">
                No images
              </div>
            )}
          </div>
        </div>

        {/* Right: Product details */}
        <div className="space-y-4">
          {/* Product name and price */}
          <div>
            <h3 className="text-xl font-bold">{product.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-semibold text-green-700">
                ${(product.price / 100).toFixed(2)}
              </span>
              {product.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {product.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Producer info */}
          <div className="space-y-1">
            <div className="text-sm">
              <span className="font-medium">Producer:</span> {producerName}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Email:</span> {product.user.email}
            </div>
            <Link
              href={`/admin/users?search=${product.user.email}`}
              className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
              target="_blank"
            >
              View other products <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Stand location */}
          {product.standListings.length > 0 && (
            <div className="space-y-1">
              {product.standListings.map(listing => (
                <div key={listing.marketStandId} className="text-sm">
                  <span className="font-medium">📍 Stand:</span>{' '}
                  <Link
                    href={`/market-stand/${listing.marketStand.id}`}
                    className="text-blue-600 hover:underline"
                    target="_blank"
                  >
                    {listing.marketStand.name}
                  </Link>
                </div>
              ))}
              <div className="text-sm text-gray-600">
                <span className="font-medium">📦 Stand Inventory:</span> {totalStandInventory} units
              </div>
            </div>
          )}

          {/* Delivery info */}
          {product.deliveryAvailable && product.deliveryZone && (
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-medium">🚚 Delivery:</span> {product.deliveryZone.name}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Zips:</span>{' '}
                {product.deliveryZone.zipCodes.slice(0, 3).join(', ')}
                {product.deliveryZone.zipCodes.length > 3 && ` +${product.deliveryZone.zipCodes.length - 3} more`}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Days:</span> {product.deliveryZone.deliveryDays.join(', ')}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Stock:</span> {totalDeliveryInventory} units
              </div>
            </div>
          )}

          {/* Farm profile link */}
          {product.local && (
            <div className="text-sm">
              <span className="font-medium">🌱 Farm Profile:</span>{' '}
              <Link
                href={`/local/${product.local.slug || product.local.id}`}
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                target="_blank"
              >
                {product.local.name} <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* Submitted time */}
          <div className="text-sm text-gray-500">
            <span className="font-medium">Submitted:</span>{' '}
            {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div className="mt-6 pt-6 border-t flex items-start justify-between gap-4">
        {/* Reject section */}
        <div className="flex-1">
          {!showRejectNote ? (
            <Button
              variant="outline"
              onClick={() => setShowRejectNote(true)}
              disabled={isApproving}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Enter rejection reason (minimum 10 characters)..."
                rows={3}
                className="w-full"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={isRejecting || rejectionNote.trim().length < 10}
                >
                  {isRejecting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <X className="h-4 w-4 mr-1" />
                  )}
                  Confirm Rejection
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowRejectNote(false)
                    setRejectionNote('')
                  }}
                  disabled={isRejecting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Approve button */}
        <Button
          onClick={handleApprove}
          disabled={isApproving || isRejecting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Check className="h-4 w-4 mr-1" />
          )}
          Approve
        </Button>
      </div>
    </Card>
  )
}
