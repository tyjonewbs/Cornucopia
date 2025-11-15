import { Truck, MapPin, DollarSign, Package } from "lucide-react";

interface DeliveryZone {
  id: string;
  name: string;
  deliveryFee: number;
  minimumOrder: number | null;
  freeDeliveryThreshold: number | null;
  zipCodes: string[];
  cities: string[];
  states: string[];
  deliveryDays: string[];
}

interface ProductDeliveryInfoProps {
  deliveryZone: DeliveryZone;
  productName: string;
}

export function ProductDeliveryInfo({ deliveryZone, productName }: ProductDeliveryInfoProps) {
  const hasFreeThreshold = deliveryZone.freeDeliveryThreshold && deliveryZone.freeDeliveryThreshold > 0;
  const hasMinimumOrder = deliveryZone.minimumOrder && deliveryZone.minimumOrder > 0;

  return (
    <div className="bg-green-50 rounded-lg border border-green-200 p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-green-100 p-2 rounded-lg">
          <Truck className="h-6 w-6 text-green-700" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-green-900">Delivery Available</h3>
          <p className="text-sm text-green-700">This product can be delivered to your location</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Delivery Zone Name */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">Delivery Zone</p>
            <p className="text-sm text-gray-600">{deliveryZone.name}</p>
          </div>
        </div>

        {/* Delivery Fee */}
        <div className="flex items-start gap-3">
          <DollarSign className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">Delivery Fee</p>
            {deliveryZone.deliveryFee === 0 ? (
              <p className="text-sm font-semibold text-green-700">FREE Delivery</p>
            ) : (
              <div>
                <p className="text-sm text-gray-600">
                  ${(deliveryZone.deliveryFee / 100).toFixed(2)}
                </p>
                {hasFreeThreshold && deliveryZone.freeDeliveryThreshold && (
                  <p className="text-xs text-green-700 mt-1">
                    Free delivery on orders over ${(deliveryZone.freeDeliveryThreshold / 100).toFixed(0)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Minimum Order */}
        {hasMinimumOrder && deliveryZone.minimumOrder && (
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Minimum Order</p>
              <p className="text-sm text-gray-600">
                ${(deliveryZone.minimumOrder / 100).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Delivery Days */}
        {deliveryZone.deliveryDays && deliveryZone.deliveryDays.length > 0 && (
          <div className="pt-3 border-t border-green-200">
            <p className="text-sm font-medium text-gray-900 mb-2">Delivery Days</p>
            <div className="flex flex-wrap gap-2">
              {deliveryZone.deliveryDays.map((day) => (
                <span
                  key={day}
                  className="px-3 py-1 bg-white border border-green-300 rounded-full text-xs font-medium text-green-800"
                >
                  {day}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Coverage Areas */}
        <div className="pt-3 border-t border-green-200">
          <p className="text-sm font-medium text-gray-900 mb-2">Delivery Coverage</p>
          <div className="space-y-2 text-sm text-gray-600">
            {deliveryZone.cities.length > 0 && (
              <p>
                <span className="font-medium">Cities:</span>{" "}
                {deliveryZone.cities.slice(0, 5).join(", ")}
                {deliveryZone.cities.length > 5 && ` +${deliveryZone.cities.length - 5} more`}
              </p>
            )}
            {deliveryZone.states.length > 0 && (
              <p>
                <span className="font-medium">States:</span> {deliveryZone.states.join(", ")}
              </p>
            )}
            {deliveryZone.zipCodes.length > 0 && deliveryZone.zipCodes.length <= 10 && (
              <p>
                <span className="font-medium">ZIP Codes:</span> {deliveryZone.zipCodes.join(", ")}
              </p>
            )}
            {deliveryZone.zipCodes.length > 10 && (
              <p>
                <span className="font-medium">Serving {deliveryZone.zipCodes.length} ZIP codes</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-white rounded-md border border-green-200">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> Delivery service is managed by the producer. Contact them for specific delivery scheduling and any special requirements.
        </p>
      </div>
    </div>
  );
}
