'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullScreen?: boolean;
}

/**
 * Consistent Loading State Component
 * Displays a spinner with optional message
 */
export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className,
  fullScreen = false,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={cn(containerClasses, className)}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        {message && (
          <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton loading component for cards
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      <div className="space-y-3">
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
        <div className="h-20 bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

/**
 * Skeleton loading for lists
 */
export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton loading for text
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted animate-pulse rounded"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

/**
 * Spinner only component
 */
export function Spinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
}
