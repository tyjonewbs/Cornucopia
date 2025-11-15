"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, X, Plus } from "lucide-react";

interface DeliveryDateItem {
  date: Date;
  inventory: number;
}

interface OneTimeDeliverySchedulerProps {
  dates: DeliveryDateItem[];
  onChange: (dates: DeliveryDateItem[]) => void;
}

export function OneTimeDeliveryScheduler({ dates, onChange }: OneTimeDeliverySchedulerProps) {
  const [newDate, setNewDate] = useState('');
  const [newInventory, setNewInventory] = useState(0);

  const addDate = () => {
    if (!newDate) return;
    
    const dateObj = new Date(newDate);
    if (isNaN(dateObj.getTime())) return;
    
    onChange([
      ...dates,
      { date: dateObj, inventory: newInventory }
    ].sort((a, b) => a.date.getTime() - b.date.getTime()));
    
    setNewDate('');
    setNewInventory(0);
  };

  const removeDate = (index: number) => {
    onChange(dates.filter((_, i) => i !== index));
  };

  const updateInventory = (index: number, inventory: number) => {
    onChange(dates.map((d, i) => i === index ? { ...d, inventory: Math.max(0, inventory) } : d));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }).format(date);
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Schedule specific delivery dates:</Label>
      
      {/* Existing dates */}
      {dates.length > 0 && (
        <div className="space-y-2">
          {dates.map((item, index) => {
            const isPast = item.date < new Date();
            
            return (
              <div 
                key={index} 
                className={`flex items-center gap-4 p-3 border rounded-lg ${
                  isPast ? 'bg-gray-50 opacity-60' : 'bg-white'
                }`}
              >
                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-sm">
                  {formatDate(item.date)}
                  {isPast && <span className="ml-2 text-xs text-gray-500">(Past)</span>}
                </span>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600">Qty:</Label>
                  <Input
                    type="number"
                    min="0"
                    value={item.inventory}
                    onChange={(e) => updateInventory(index, parseInt(e.target.value) || 0)}
                    className="h-9 w-20 text-center"
                    disabled={isPast}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDate(index)}
                  className="h-9 w-9 p-0 text-gray-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new date */}
      <div className="flex items-end gap-2 p-3 border border-dashed rounded-lg bg-gray-50/50">
        <div className="flex-1">
          <Label className="text-sm mb-1.5 block">Date</Label>
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            min={getMinDate()}
            className="h-9"
          />
        </div>
        <div className="w-28">
          <Label className="text-sm mb-1.5 block">Inventory</Label>
          <Input
            type="number"
            min="0"
            value={newInventory}
            onChange={(e) => setNewInventory(parseInt(e.target.value) || 0)}
            className="h-9 text-center"
            placeholder="0"
          />
        </div>
        <Button
          type="button"
          onClick={addDate}
          disabled={!newDate}
          size="sm"
          className="h-9"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {dates.length === 0 && (
        <p className="text-sm text-gray-500 italic text-center py-2">
          No delivery dates scheduled yet. Add dates above to start.
        </p>
      )}
    </div>
  );
}
