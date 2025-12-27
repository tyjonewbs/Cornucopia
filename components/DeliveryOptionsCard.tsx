'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Package, MapPin, Truck, AlertCircle, Calendar, CheckCircle2, X, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { checkDeliveryEligibility } from '@/app/actions/check-delivery-eligibility';
import { addToCart } from '@/app/actions/cart';
import type { SerializedDeliveryOption } from '@/types/delivery';
import { getCachedLocation, setCachedZipCode, clearCachedLocation } from '@/lib/utils/location-cache';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface DeliveryOptionsCardProps {
  productId: string;
  productName: string;
  deliveryZone?: {
    name: string;
    deliveryFee: number;
    freeDeliveryThreshold?: number | null;
    minimumOrder?: number | null;
    zipCodes: string[];
    cities: string[];
    states: string[];
    deliveryDays: string[];
  } | null;
}

export function DeliveryOptionsCard({
  productId,
  productName,
  deliveryZone,
}: DeliveryOptionsCardProps) {
  const router = useRouter();
  const [zipCode, setZipCode] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState<SerializedDeliveryOption[]>([]);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);
  const [eligibilityReason, setEligibilityReason] = useState<string>('');
  const [matchedLocation, setMatchedLocation] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<SerializedDeliveryOption | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Load cached zip code on mount and auto-check
  useEffect(() => {
    const cached = getCachedLocation();
    if (cached?.zipCode) {
      setZipCode(cached.zipCode);
      // Auto-check delivery for cached zip code
      checkDelivery(cached.zipCode);
    }
  }, [productId]); // Only run on mount or when product changes

  const checkDelivery = async (zip: string) => {
    if (!zip || !zip.match(/^\d{5}$/)) {
      toast.error('Please enter a valid 5-digit ZIP code');
      return;
    }

    setIsChecking(true);
    setIsEligible(null);
    setDeliveryOptions([]);
    setSelectedOption(null);
    
    try {
      const result = await checkDeliveryEligibility({
        productId,
        userZipCode: zip,
      });

      setIsEligible(result.isEligible);
      setEligibilityReason(result.reason || '');
      setDeliveryOptions(result.deliveryOptions);
      
      if (result.matchedZipCode) {
        setMatchedLocation(`ZIP Code ${result.matchedZipCode}`);
      } else if (result.matchedCity) {
        setMatchedLocation(result.matchedCity);
      }

      // Cache successful zip code lookup
      if (result.isEligible) {
        setCachedZipCode(zip);
      }
    } catch (error) {
      console.error('Error checking delivery eligibility:', error);
      toast.error('Error checking delivery availability');
      setIsEligible(false);
      setEligibilityReason('Error checking delivery availability');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckZipCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await checkDelivery(zipCode);
  };

  const handleClearLocation = () => {
    clearCachedLocation();
    setZipCode('');
    setIsEligible(null);
    setDeliveryOptions([]);
    setMatchedLocation('');
    setSelectedOption(null);
  };

  const handleAddToCart = async () => {
    if (!selectedOption) return;

    setIsAddingToCart(true);
    try {
      const result = await addToCart({
        userId: '', // Will be set by server action
        productId,
        quantity: 1,
        fulfillmentType: 'DELIVERY',
        deliveryDate: parseISO(selectedOption.date),
        deliveryZoneId: selectedOption.deliveryZoneId,
      });

      if (result.success) {
        toast.success(`${productName} added to cart!`, {
          description: `Delivery on ${format(parseISO(selectedOption.date), 'EEEE, MMM d')}`,
          action: {
            label: "View Cart",
            onClick: () => router.push('/cart'),
          },
        });
        setSelectedOption(null);
      } else {
        toast.error(result.error || 'Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Group delivery options by type
  const oneTimeOptions = deliveryOptions.filter(opt => !opt.isRecurring);
  const recurringOptions = deliveryOptions.filter(opt => opt.isRecurring);
  const displayedRecurringOptions = recurringOptions.slice(0, 12);

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border-2 border-green-200 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Package className="h-6 w-6 text-green-700 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-green-900 mb-1">
            Delivery Available
          </h3>
          <p className="text-sm text-green-700">
            Check delivery options for your area
          </p>
        </div>
      </div>

      {/* ZIP Code Input - Always visible */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-green-800">
          <MapPin className="h-4 w-4" />
          <span className="font-medium">
            Enter your ZIP code to see delivery options
          </span>
        </div>
        <form onSubmit={handleCheckZipCode} className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Enter ZIP code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="bg-white pr-8"
              maxLength={5}
              pattern="\d{5}"
            />
            {zipCode && (
              <button
                type="button"
                onClick={() => setZipCode('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={isChecking || !zipCode.trim() || !zipCode.match(/^\d{5}$/)}
            className="bg-green-700 hover:bg-green-800"
          >
            {isChecking ? 'Checking...' : 'Check'}
          </Button>
        </form>
      </div>

      {/* Loading State */}
      {isChecking && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      )}

      {/* Not Eligible State */}
      {!isChecking && isEligible === false && (
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
      )}

      {/* Eligible State - Show Delivery Options */}
      {!isChecking && isEligible === true && deliveryOptions.length > 0 && (
        <div className="space-y-4">
          {/* Matched Location */}
          <div className="flex items-center justify-between p-3 bg-green-100 border border-green-300 rounded-md">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-700" />
              <p className="text-sm font-medium text-green-900">
                Delivery available to {matchedLocation}
              </p>
            </div>
            <button
              onClick={handleClearLocation}
              className="text-green-700 hover:text-green-900 text-sm underline"
            >
              Change
            </button>
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
                    onClick={() => setSelectedOption(option)}
                    className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                      selectedOption?.date === option.date
                        ? 'border-green-600 bg-green-100 ring-2 ring-green-600 ring-offset-2'
                        : 'border-green-200 bg-white hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {format(parseISO(option.date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {option.deliveryFee === 0
                              ? 'FREE delivery'
                              : `$${(option.deliveryFee / 100).toFixed(2)} delivery`}
                          </span>
                          {option.freeDeliveryThreshold && option.deliveryFee > 0 && (
                            <span className="text-green-600">
                              (FREE over ${(option.freeDeliveryThreshold / 100).toFixed(0)})
                            </span>
                          )}
                        </div>
                        {option.inventory !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            {option.inventory} available
                          </p>
                        )}
                      </div>
                      {selectedOption?.date === option.date && (
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
                Choose any date to add to cart. Set up recurring delivery during checkout.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {displayedRecurringOptions.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(option)}
                    className={`w-full text-left p-3 rounded-md border-2 transition-all ${
                      selectedOption?.date === option.date
                        ? 'border-green-600 bg-green-100 ring-2 ring-green-600 ring-offset-2'
                        : 'border-green-200 bg-white hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {format(parseISO(option.date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {option.deliveryFee === 0
                              ? 'FREE delivery'
                              : `$${(option.deliveryFee / 100).toFixed(2)} delivery`}
                          </span>
                        </div>
                      </div>
                      {selectedOption?.date === option.date && (
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {recurringOptions.length > 12 && (
                <p className="text-xs text-center text-gray-500 italic">
                  Showing first 12 dates. More dates available in cart.
                </p>
              )}
            </div>
          )}

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            disabled={!selectedOption || isAddingToCart}
            className="w-full bg-green-700 hover:bg-green-800 text-white px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5" />
            {isAddingToCart
              ? 'Adding...'
              : selectedOption
              ? `Add to Cart for ${format(parseISO(selectedOption.date), 'MMM d')}`
              : 'Select a delivery date above'}
          </Button>

          {selectedOption && (
            <p className="text-xs text-center text-green-700">
              You can adjust quantity and add more items in your cart
            </p>
          )}
        </div>
      )}
    </div>
  );
}
