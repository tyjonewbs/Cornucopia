'use client';

import { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useLocation } from '@/components/providers/LocationProvider';
import { useRouter } from 'next/navigation';

export function HeaderSearchBar() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { 
    zipCode, 
    setZipCode, 
    searchByZip, 
    isLoading,
    error,
    userLocation,
    useMyLocation
  } = useLocation();

  // Determine if zip is from browser location (for styling)
  const isAutoPopulated = userLocation?.source === 'browser' && zipCode;

  const handleSearch = () => {
    // Navigate to search page with location and optional search query
    if (zipCode && zipCode.length === 5) {
      const params = new URLSearchParams();
      params.set('zip', zipCode);
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim());
      }
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleZipKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (zipCode && zipCode.length === 5) {
        searchByZip();
      }
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(value);
  };

  const handleZipBlur = () => {
    // Update location context when user finishes entering zip
    if (zipCode && zipCode.length === 5) {
      searchByZip();
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden h-10 md:h-12 w-full">
        {/* Left side: Search query input */}
        <div className="flex items-center px-3 md:px-4 h-full flex-1 min-w-0">
          <Search className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search products, stands, farms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 text-sm bg-transparent border-none outline-none placeholder:text-gray-400 text-gray-700"
          />
        </div>
        
        {/* Vertical divider */}
        <div className="w-px h-6 bg-gray-300 flex-shrink-0" />
        
        {/* Right side: Zip code input */}
        <div className="flex items-center px-2 md:px-3 h-full flex-shrink-0">
          <button
            onClick={useMyLocation}
            className="mr-2 hover:text-[#0B4D2C] transition-colors flex-shrink-0 touch-manipulation"
            title="Use my location"
            disabled={isLoading}
          >
            <MapPin className="h-4 w-4 text-gray-400 hover:text-[#0B4D2C]" />
          </button>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Zip"
            value={zipCode}
            onChange={handleZipChange}
            onKeyDown={handleZipKeyDown}
            onBlur={handleZipBlur}
            className={`w-14 md:w-20 text-sm border-none outline-none placeholder:text-gray-400 ${
              isAutoPopulated ? 'bg-gray-100 text-gray-600 rounded px-1' : 'bg-transparent text-gray-700'
            }`}
            maxLength={5}
          />
        </div>
        
        {/* Orange circular search button */}
        <button
          onClick={handleSearch}
          disabled={isLoading || zipCode.length !== 5}
          className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 mr-1 rounded-full bg-[#E07A2D] hover:bg-[#C96A20] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0 touch-manipulation"
          title="Search"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 md:h-5 md:w-5 text-white animate-spin" />
          ) : (
            <Search className="h-4 w-4 md:h-5 md:w-5 text-white" />
          )}
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <p className="text-red-500 text-xs mt-1 bg-white/90 px-2 py-0.5 rounded">
          {error}
        </p>
      )}
    </div>
  );
}
