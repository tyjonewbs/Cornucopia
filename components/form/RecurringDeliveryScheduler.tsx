"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DeliverySchedule, DeliveryZone } from "@/types/delivery";

interface RecurringDeliverySchedulerProps {
  schedule: DeliverySchedule;
  onChange: (schedule: DeliverySchedule) => void;
  deliveryZone?: DeliveryZone;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export function RecurringDeliveryScheduler({ 
  schedule, 
  onChange, 
  deliveryZone 
}: RecurringDeliverySchedulerProps) {
  const toggleDay = (day: string) => {
    onChange({
      ...schedule,
      [day]: {
        enabled: !schedule[day]?.enabled,
        inventory: schedule[day]?.inventory || 0
      }
    });
  };

  const updateInventory = (day: string, inventory: number) => {
    if (!schedule[day]?.enabled) return;
    
    onChange({
      ...schedule,
      [day]: {
        enabled: true,
        inventory: Math.max(0, inventory)
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium">Select delivery days and set inventory:</Label>
        {deliveryZone && (
          <p className="text-sm text-muted-foreground">
            ⓘ Your <span className="font-medium">{deliveryZone.name}</span> zone delivers on: {deliveryZone.deliveryDays.join(', ')}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        {DAYS.map(day => {
          const isZoneDay = deliveryZone?.deliveryDays.includes(day);
          const isEnabled = schedule[day]?.enabled || false;
          const inventory = schedule[day]?.inventory || 0;
          
          return (
            <div 
              key={day} 
              className={`flex items-center gap-4 p-3 border rounded-lg transition-colors ${
                isEnabled ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200'
              } ${deliveryZone && !isZoneDay ? 'opacity-50' : ''}`}
            >
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => toggleDay(day)}
                disabled={deliveryZone && !isZoneDay}
                className="h-4 w-4 mt-0.5"
              />
              
              <Label 
                className={`flex-1 cursor-pointer ${
                  deliveryZone && !isZoneDay ? 'text-gray-400' : 'text-gray-900'
                }`}
              >
                {day}
              </Label>
              
              {isEnabled && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600">Inventory:</Label>
                  <Input
                    type="number"
                    min="0"
                    value={inventory}
                    onChange={(e) => updateInventory(day, parseInt(e.target.value) || 0)}
                    className="h-9 w-24 text-center"
                    placeholder="0"
                  />
                </div>
              )}
              
              {deliveryZone && !isZoneDay && (
                <span className="ml-auto text-xs text-gray-400 italic">
                  Not a delivery day
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {Object.keys(schedule).length === 0 && (
        <p className="text-sm text-gray-500 italic py-2">
          Select at least one day to enable recurring weekly deliveries
        </p>
      )}
    </div>
  );
}
