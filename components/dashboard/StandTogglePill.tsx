"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toggleStandOpen } from "@/app/actions/stand-portal";
import { useRouter } from "next/navigation";

interface StandTogglePillProps {
  standId: string;
  isOpen: boolean;
  hours?: Record<string, any> | null;
}

// Helper to get today's hours
function getTodayHours(hours: Record<string, any> | null | undefined): { open: string; close: string } | null {
  if (!hours) return null;

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = dayNames[now.getDay()];
  const todaySchedule = hours[currentDay];

  if (!todaySchedule || !todaySchedule.isOpen || !todaySchedule.timeSlots || todaySchedule.timeSlots.length === 0) {
    return null;
  }

  const firstSlot = todaySchedule.timeSlots[0];
  return {
    open: firstSlot.open,
    close: firstSlot.close,
  };
}

// Format time from 24h to 12h
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')}${period}`;
}

export function StandTogglePill({ standId, isOpen: initialIsOpen, hours }: StandTogglePillProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();

  const todayHours = getTodayHours(hours);

  const handleToggle = async () => {
    setIsToggling(true);
    // Optimistic update
    setIsOpen(!isOpen);

    const result = await toggleStandOpen(standId);

    if (result.error) {
      // Revert on error
      setIsOpen(isOpen);
      alert(result.error);
    } else {
      // Revalidate
      router.refresh();
    }

    setIsToggling(false);
  };

  if (isOpen) {
    return (
      <Button
        onClick={handleToggle}
        disabled={isToggling}
        size="sm"
        className="bg-green-600 hover:bg-green-700 text-white flex-shrink-0"
      >
        {isToggling ? "..." : "Open Now"}
      </Button>
    );
  } else {
    return (
      <button
        onClick={handleToggle}
        disabled={isToggling}
        className="px-3 py-1.5 text-sm border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
      >
        {isToggling ? "..." : "Tap to Open"}
      </button>
    );
  }
}
