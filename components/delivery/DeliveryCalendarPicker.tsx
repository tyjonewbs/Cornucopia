"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay } from "date-fns";

interface DeliveryCalendarPickerProps {
  selectedDates: Date[];
  onDatesChange: (dates: Date[]) => void;
  existingDeliveryDates?: Date[];
  mode?: "single" | "multiple";
  disabled?: boolean;
}

export function DeliveryCalendarPicker({
  selectedDates,
  onDatesChange,
  existingDeliveryDates = [],
  mode = "multiple",
  disabled = false,
}: DeliveryCalendarPickerProps) {
  const [open, setOpen] = useState(false);

  const existingSet = new Set(
    existingDeliveryDates.map(d => startOfDay(d).toISOString())
  );

  const handleSelect = (dates: Date[] | Date | undefined) => {
    if (!dates) {
      onDatesChange([]);
      return;
    }
    if (Array.isArray(dates)) {
      onDatesChange(dates);
    } else {
      onDatesChange([dates]);
      if (mode === "single") setOpen(false);
    }
  };

  const buttonLabel = () => {
    if (selectedDates.length === 0) return "Pick a date";
    if (selectedDates.length === 1) return format(selectedDates[0], "PPP");
    return `${selectedDates.length} dates selected`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {buttonLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode={mode as any}
          selected={mode === "single" ? selectedDates[0] : selectedDates}
          onSelect={handleSelect as any}
          disabled={(date) => date < startOfDay(new Date())}
          modifiers={{
            existing: existingDeliveryDates,
          }}
          modifiersClassNames={{
            existing: "bg-blue-100 text-blue-900 font-semibold",
          }}
        />
        {mode === "multiple" && selectedDates.length > 0 && (
          <div className="border-t p-3 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {selectedDates.length} date{selectedDates.length > 1 ? "s" : ""} selected
            </span>
            <Button
              size="sm"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
