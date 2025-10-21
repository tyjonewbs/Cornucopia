'use client';

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          It looks like you've lost your internet connection. Some features may not be available until you're back online.
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={() => window.location.reload()}
            size="lg"
            className="w-full"
          >
            Try Again
          </Button>
          
          <p className="text-sm text-gray-500">
            Cached pages and images will still be available while you're offline.
          </p>
        </div>
      </div>
    </main>
  );
}
