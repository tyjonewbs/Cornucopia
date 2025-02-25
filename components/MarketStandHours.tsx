import { Clock } from "lucide-react";
import { WeeklyHours, DAYS_OF_WEEK, formatDaySchedule } from "@/types/hours";

interface MarketStandHoursProps {
  hours?: WeeklyHours;
}

export function MarketStandHours({ hours }: MarketStandHoursProps) {
  if (!hours) return null;

  const hasAnyHours = DAYS_OF_WEEK.some(day => hours[day].isOpen && hours[day].timeSlots.length > 0);

  if (!hasAnyHours) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-medium">Operating Hours</h3>
      </div>
      <div className="space-y-2">
        {DAYS_OF_WEEK.map((day) => {
          const schedule = hours[day];
          if (!schedule.isOpen) return null;
          
          return (
            <div key={day} className="flex justify-between text-sm">
              <span className="font-medium capitalize">{day}</span>
              <span className="text-muted-foreground">{formatDaySchedule(schedule)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
