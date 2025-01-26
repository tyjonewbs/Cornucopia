'use client';

import { ProductRow } from "@/components/ProductRow";
import useUserLocation from "@/app/hooks/useUserLocation";
import { Button } from "@/components/ui/button";

export default function HomeClient() {
  const { locationError, isLoadingLocation, retryLocation } = useUserLocation();

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 mb-24">
      {locationError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path 
                  fillRule="evenodd" 
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
            <div className="ml-3 flex-grow">
              <p className="text-sm leading-5 text-yellow-700">
                {locationError}
              </p>
            </div>
            <div className="ml-3">
              <Button
                variant="outline"
                size="sm"
                onClick={retryLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ProductRow 
        title="Local Products" 
        link="/local-spots"
      />
    </section>
  );
}
