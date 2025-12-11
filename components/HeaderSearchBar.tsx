'use client';

import { Search, MapPin, Loader2 } from 'lucide-react';
import { useLocation } from '@/components/providers/LocationProvider';

export function HeaderSearchBar() {
  const { 
    zipCode, 
    setZipCode, 
    searchByZip, 
    isLoading,
    error,
    userLocation,
    useMyLocation
  } = useLocation();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchByZip();
    }
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(value);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden h-12">
        {/* Search/Product text on left */}
        <div className="flex items-center px-4 h-full">
          <Search className="h-4 w-4 text-gray-400 mr-2" />
          <span className="text-gray-500 text-sm whitespace-nowrap">Find local products</span>
        </div>
        
        {/* Vertical divider */}
        <div className="w-px h-6 bg-gray-300" />
        
        {/* Zip code input on right */}
        <div className="flex items-center px-3 h-full">
          <button
            onClick={useMyLocation}
            className="mr-2 hover:text-[#0B4D2C] transition-colors"
            title="Use my location"
            disabled={isLoading}
          >
            <MapPin className="h-4 w-4 text-gray-400 hover:text-[#0B4D2C]" />
          </button>
          <input
            type="text"
            placeholder="Zip Code"
            value={zipCode}
            onChange={handleZipChange}
            onKeyDown={handleKeyDown}
            className="w-20 text-sm bg-transparent border-none outline-none placeholder:text-gray-400 text-gray-700"
            maxLength={5}
          />
        </div>
        
        {/* Orange circular search button */}
        <button
          onClick={searchByZip}
          disabled={isLoading || zipCode.length !== 5}
          className="flex items-center justify-center w-10 h-10 mr-1 rounded-full bg-[#E07A2D] hover:bg-[#C96A20] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          title="Search"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-white" />
          )}
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <p className="text-red-500 text-xs mt-1 bg-white/90 px-2 py-0.5 rounded">
          {error}
        </p>
      )}
      
      {/* Location indicator */}
      {userLocation && !error && (
        <p className="text-white/80 text-xs mt-1">
          {userLocation.source === 'zipcode' && userLocation.zipCode 
            ? `Showing results near ${userLocation.zipCode}`
            : 'Using your location'}
        </p>
      )}
    </div>
  );
}
