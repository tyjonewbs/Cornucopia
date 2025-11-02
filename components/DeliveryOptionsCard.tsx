'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Package, MapPin, Clock, Truck, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { checkDeliveryEligibility } from '@/app/actions/check-delivery-eligibility';
import type { SerializedDeliveryOption } from '@/types/delivery';
import useUserLocation from '@/hooks/useUserLocation';

interface DeliveryOptionsCardProps {
  productId: string;
  productName: string;
  userZipCode?: string;
  userCity?: string;
  userState?: string;
}

export function DeliveryOptionsCard({
  productId,
  productName,
  userZipCode: initialZipCode,
  userCity: initialCity,
  userState: initialState,
}: DeliveryOptionsCardProps) {
  const [zipCode, setZipCode] = useState(initialZipCode || '');
  const [isChecking, setIsChecking] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState<SerializedDeliveryOption[]>([]);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [eligibilityReason, setEligibilityReason] = useState<string>('');
  const [matchedLocation, setMatchedLocation] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { userLocation } = useUserLocation({
    cacheKey: 'product_delivery_location',
  });

  // Check eligibility when component mounts or when user location/zipcode changes
  useEffect(() => {
    const checkEligibility = async () => {
      if (!zipCode && !initialCity && !userLocation) {
        return;
      }

      setIsChecking(true);
      try {
        const result = await checkDeliveryEligibility({
          productId,
          userZipCode: zipCode || initialZipCode,
          userCity: initialCity,
          userState: initialState,
        });

        setIsEligible(result.isEligible);
        setEligibilityReason(result.reason || '');
        setDeliveryOptions(result.deliveryOptions);
        
        if (result.matchedZipCode) {
          setMatchedLocation(`ZIP Code ${result.matchedZipCode}`);
        } else if (result.matchedCity) {
          setMatchedLocation(result.matchedCity);
        }
      } catch (error) {
        console.error('Error checking delivery eligibility:', error);
        setIsEligible(false);
        setEligibilityReason('Error checking delivery availability');
      } finally {
        setIsChecking(false);
      }
    };

    if (zipCode || initialZipCode || initialCity) {
      checkEligibility();
    }
  }, [productId, zipCode, initialZipCode, initialCity, initialState, userLocation]);

  const handleCheckZipCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipCode.trim()) return;

    setIsChecking(true);
    try {
      const result = await checkDeliveryEligibility({
        productId,
        userZipCode: zipCode,
      });

      setIsEligible(result.isEligible);
      setEligibilityReason(result.reason || '');
      setDeliveryOptions(result.deliveryOptions);
      
      if (result.matchedZipCode) {
        setMatchedLocation(`ZIP Code ${result.matchedZipCode}`);
      }
    } catch (error) {
      console.error('Error checking delivery eligibility:', error);
      setIsEligible(false);
      setEligibilityReason('Error checking delivery availability');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  const handleOrderClick = () => {
    if (selectedDate) {
      // Navigate to checkout with selected date
      window.location.href = `/checkout?product=${productId}&deliveryDate=${selectedDate}`;
    }
  };

  // Group delivery options by type
  const oneTimeOptions = deliveryOptions.filter(opt => !opt.isRecurring);
  const recurringOptions = deliveryOptions.filter(opt => opt.isRecurring);

  // Limit recurring options display to first 12
  const displayedRecurringOptions = recurringOptions.slice(0, 12);

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Package className="h-6 w-6 text-green-700 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-green-900 mb-1">
            Delivery Options Available
          </h3>
          <p className="text-sm text-green-700">
            This product can be delivered to select areas
          </p>
        </div>
      </div>

      {/* Location Input Section */}
      {!initialZipCode && isEligible === null && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">Enter your ZIP code to check availability</span>
          </div>
          <form onSubmit={handleCheckZipCode} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="flex-1 bg-white"
              maxLength={10}
            />
            <Button 
              type="submit" 
              disabled={isChecking || !zipCode.trim()}
              className="bg-green-700 hover:bg-green-800"
            >
              {isChecking ? 'Checking...' : 'Check'}
            </Button>
          </form>
        </div>
      )}

      {/* Loading State */}
      {isChecking && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      )}

      {/* Not Eligible State */}
      {!isChecking && isEligible === false && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {eligibilityReason}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                You can still pick up this item at the market stand location
              </p>
            </div>
          </div>
          {zipCode && (
            <Button
              onClick={() => {
                setZipCode('');
                setIsEligible(null);
              }}
              variant="outline"
              className="w-full"
            >
              Try a different ZIP code
            </Button>
          )}
        </div>
      )}

      {/* Eligible State - Show Delivery Options */}
      {!isChecking && isEligible === true && deliveryOptions.length > 0 && (
        <div className="space-y-4">
          {/* Matched Location */}
          <div className="flex items-center gap-2 p-3 bg-green-100 border border-green-300 rounded-md">
            <CheckCircle2 className="h-5 w-5 text-green-700" />
            <p className="text-sm font-medium text-green-900">
              Delivery available to {matchedLocation}
            </p>
          </div>

          {/* One-Time Delivery Options */}
          {oneTimeOptions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-700" />
                <h4 className="text-sm font-semibold text-green-900">One-Time Delivery</h4>
              </div>
              <div className="space-y-2">
                {oneTimeOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectDate(option.date)}
                    className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                      selectedDate === option.date
                        ? 'border-green-600 bg-green-100'
                        : 'border-green-200 bg-white hover:border-green-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {format(parseISO(option.date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {option.timeWindow}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {option.deliveryFee === 0
                              ? 'FREE'
                              : `$${(option.deliveryFee / 100).toFixed(2)}`}
                            {option.freeDeliveryThreshold && option.deliveryFee > 0 && (
                              <span className="text-green-600">
                                (FREE over ${(option.freeDeliveryThreshold / 100).toFixed(0)})
                              </span>
                            )}
                          </span>
                        </div>
                        {option.inventory !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            {option.inventory} available
                          </p>
                        )}
                      </div>
                      {selectedDate === option.date && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Delivery Options */}
          {recurringOptions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-700" />
                <h4 className="text-sm font-semibold text-green-900">Recurring Delivery</h4>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  Subscription Available
                </Badge>
              </div>
              <p className="text-xs text-gray-600">
                Select any date to start. You can set up a subscription during checkout.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {displayedRecurringOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectDate(option.date)}
                    className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                      selectedDate === option.date
                        ? 'border-green-600 bg-green-100'
                        : 'border-green-200 bg-white hover:border-green-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {format(parseISO(option.date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {option.timeWindow}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {option.deliveryFee === 0
                              ? 'FREE'
                              : `$${(option.deliveryFee / 100).toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                      {selectedDate === option.date && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {recurringOptions.length > 12 && (
                <p className="text-xs text-center text-gray-500 italic">
                  Showing first 12 dates. More dates available at checkout.
                </p>
              )}
            </div>
          )}

          {/* Order Button */}
          <Button
            onClick={handleOrderClick}
            disabled={!selectedDate}
            className="w-full bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-md text-center font-medium transition-colors"
          >
            {selectedDate
              ? `Order for ${format(parseISO(selectedDate), 'MMM d')}`
              : 'Select a delivery date above'}
          </Button>

          {recurringOptions.length > 0 && (
            <p className="text-xs text-center text-green-700 italic">
              Set up recurring deliveries during checkout for automatic weekly orders
            </p>
          )}
        </div>
      )}
    </div>
  );
}
