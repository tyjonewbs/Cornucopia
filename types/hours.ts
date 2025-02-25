export type TimeSlot = {
  open: string;   // 24h format "HH:mm"
  close: string;  // 24h format "HH:mm"
};

export type DaySchedule = {
  isOpen: boolean;
  timeSlots: TimeSlot[];
};

export type WeeklyHours = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

export const DEFAULT_WEEKLY_HOURS: WeeklyHours = {
  monday: { isOpen: false, timeSlots: [] },
  tuesday: { isOpen: false, timeSlots: [] },
  wednesday: { isOpen: false, timeSlots: [] },
  thursday: { isOpen: false, timeSlots: [] },
  friday: { isOpen: false, timeSlots: [] },
  saturday: { isOpen: false, timeSlots: [] },
  sunday: { isOpen: false, timeSlots: [] }
};

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export function formatTimeSlot(timeSlot: TimeSlot): string {
  const openTime = new Date(`1970-01-01T${timeSlot.open}`);
  const closeTime = new Date(`1970-01-01T${timeSlot.close}`);
  
  return `${openTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} - ${closeTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

export function formatDaySchedule(schedule: DaySchedule): string {
  if (!schedule.isOpen || schedule.timeSlots.length === 0) {
    return 'Closed';
  }
  
  return schedule.timeSlots.map(formatTimeSlot).join(', ');
}
