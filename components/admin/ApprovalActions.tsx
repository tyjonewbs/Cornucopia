'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ApprovalActionsProps {
  itemId: string
  itemType: 'stand' | 'product'
  itemName: string
}

export function ApprovalActions({ itemId, itemType, itemName }: ApprovalActionsProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionNote, setRejectionNote] = useState('')
  const router = useRouter()

  async function handleApprove() {
    setIsApproving(true)
    try {
      const response = await fetch(`/api/admin/${itemType}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: itemId,
          note: 'Approved by admin'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve')
      }

      toast.success(`${itemType === 'stand' ? 'Market stand' : 'Product'} approved successfully`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to approve. Please try again.')
      console.error('Approval error:', error)
    } finally {
      setIsApproving(false)
    }
  }

  async function handleReject() {
    if (!rejectionNote.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setIsRejecting(true)
    try {
      const response = await fetch(`/api/admin/${itemType}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: itemId,
          note: rejectionNote
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reject')
      }

      toast.success(`${itemType === 'stand' ? 'Market stand' : 'Product'} rejected`)
      setShowRejectDialog(false)
      setRejectionNote('')
      router.refresh()
    } catch (error) {
      toast.error('Failed to reject. Please try again.')
      console.error('Rejection error:', error)
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={handleApprove}
          disabled={isApproving}
          className="bg-green-600 hover:bg-green-700"
        >
          {isApproving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          <span className="ml-1">Approve</span>
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
          disabled={isRejecting}
        >
          <X className="h-4 w-4" />
          <span className="ml-1">Reject</span>
        </Button>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {itemType === 'stand' ? 'Market Stand' : 'Product'}</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting "{itemName}". This will be recorded in the activity log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false)
                setRejectionNote('')
              }}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || !rejectionNote.trim()}
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Confirm Rejection'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
