'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ReviewModerationActionsProps {
  reviewId: string
  reviewType: 'product' | 'stand'
  isVisible: boolean
}

export function ReviewModerationActions({ 
  reviewId, 
  reviewType, 
  isVisible 
}: ReviewModerationActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  async function handleToggleVisibility() {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/review/visibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: reviewId,
          type: reviewType,
          isVisible: !isVisible
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update visibility')
      }

      toast.success(`Review ${!isVisible ? 'shown' : 'hidden'} successfully`)
      router.refresh()
    } catch (error) {
      toast.error('Failed to update review visibility')
      console.error('Review visibility error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={isVisible ? 'outline' : 'default'}
        onClick={handleToggleVisibility}
        disabled={isUpdating}
      >
        {isUpdating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isVisible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
        <span className="ml-1">{isVisible ? 'Hide' : 'Show'}</span>
      </Button>
    </div>
  )
}
