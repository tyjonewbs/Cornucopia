import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Plus, Minus } from "lucide-react";
import {
  WeeklyHours,
  DayOfWeek,
  DAYS_OF_WEEK,
  TimeSlot,
  DaySchedule,
  formatTimeSlot
} from "@/types/hours";

interface HoursInputProps {
  value: WeeklyHours;
  onChange: (hours: WeeklyHours) => void;
}

export function HoursInput({ value, onChange }: HoursInputProps) {
  const [error, setError] = useState<string | null>(null);

  const handleDayToggle = (day: DayOfWeek) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        isOpen: !value[day].isOpen,
        timeSlots: !value[day].isOpen ? [] : value[day].timeSlots
      }
    });
  };

  const addTimeSlot = (day: DayOfWeek) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        timeSlots: [...value[day].timeSlots, { open: "09:00", close: "17:00" }]
      }
    });
  };

  const removeTimeSlot = (day: DayOfWeek, index: number) => {
    const newTimeSlots = [...value[day].timeSlots];
    newTimeSlots.splice(index, 1);
    onChange({
      ...value,
      [day]: {
        ...value[day],
        timeSlots: newTimeSlots
      }
    });
  };

  const updateTimeSlot = (day: DayOfWeek, index: number, field: keyof TimeSlot, newTime: string) => {
    const newTimeSlots = [...value[day].timeSlots];
    newTimeSlots[index] = {
      ...newTimeSlots[index],
      [field]: newTime
    };

    // Validate time slot
    const currentSlot = newTimeSlots[index];
    if (currentSlot.open && currentSlot.close) {
      const openTime = new Date(`1970-01-01T${currentSlot.open}`);
      const closeTime = new Date(`1970-01-01T${currentSlot.close}`);
      
      if (closeTime <= openTime) {
        setError("Closing time must be after opening time");
        return;
      }

      // Check for overlapping time slots
      for (let i = 0; i < newTimeSlots.length; i++) {
        if (i !== index) {
          const otherSlot = newTimeSlots[i];
          const otherOpen = new Date(`1970-01-01T${otherSlot.open}`);
          const otherClose = new Date(`1970-01-01T${otherSlot.close}`);

          if (
            (openTime >= otherOpen && openTime < otherClose) ||
            (closeTime > otherOpen && closeTime <= otherClose) ||
            (openTime <= otherOpen && closeTime >= otherClose)
          ) {
            setError("Time slots cannot overlap");
            return;
          }
        }
      }
    }

    setError(null);
    onChange({
      ...value,
      [day]: {
        ...value[day],
        timeSlots: newTimeSlots
      }
    });
  };

  const formatDayName = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}
      
      {DAYS_OF_WEEK.map((day) => (
        <div key={day} className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">{formatDayName(day)}</Label>
            <Switch
              checked={value[day].isOpen}
              onCheckedChange={() => handleDayToggle(day)}
            />
          </div>

          {value[day].isOpen && (
            <div className="pl-4 space-y-4">
              {value[day].timeSlots.map((timeSlot, index) => (
                <div key={index} className="flex items-center gap-4">
                  <Input
                    type="time"
                    value={timeSlot.open}
                    onChange={(e) => updateTimeSlot(day, index, 'open', e.target.value)}
                    className="w-32"
                  />
                  <span>to</span>
                  <Input
                    type="time"
                    value={timeSlot.close}
                    onChange={(e) => updateTimeSlot(day, index, 'close', e.target.value)}
                    className="w-32"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTimeSlot(day, index)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTimeSlot(day)}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Time Slot
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
