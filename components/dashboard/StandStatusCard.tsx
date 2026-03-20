"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { toggleStandOpen } from "@/app/actions/stand-portal";
import { useRouter } from "next/navigation";

interface StandStatusCardProps {
  standId: string;
  standName: string;
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

export function StandStatusCard({ standId, standName, isOpen: initialIsOpen, hours }: StandStatusCardProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isToggling, setIsToggling] = useState(false);
  const [scheduledCloseTime, setScheduledCloseTime] = useState<string | undefined>(undefined);
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
      // Store scheduled close time if provided
      if (result.scheduledCloseTime) {
        setScheduledCloseTime(result.scheduledCloseTime);
      }
      // Revalidate
      router.refresh();
    }

    setIsToggling(false);
  };

  // Determine status label based on isOpen and hours
  const getStatusLabel = () => {
    if (isOpen) {
      if (todayHours) {
        return `Open · Auto-closes at ${formatTime(todayHours.close)}`;
      }
      return "Open · Open indefinitely";
    } else {
      return "Closed";
    }
  };

  // Determine button label and subtitle
  const getButtonInfo = () => {
    if (isOpen) {
      return {
        label: "Close Stand",
        subtitle: null,
      };
    } else {
      if (todayHours) {
        return {
          label: "Open Stand",
          subtitle: `Auto-closes at ${formatTime(todayHours.close)}`,
        };
      } else {
        return {
          label: "Open Stand",
          subtitle: "Stays open until you close it",
        };
      }
    }
  };

  const buttonInfo = getButtonInfo();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
              isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
            }`}>
              {isOpen ? '● Open' : '○ Closed'}
            </span>
            {buttonInfo.subtitle && (
              <span className="text-xs text-gray-500 truncate">{buttonInfo.subtitle}</span>
            )}
          </div>
          <Button
            onClick={handleToggle}
            disabled={isToggling}
            size="sm"
            className={isOpen ? "bg-gray-600 hover:bg-gray-700 flex-shrink-0" : "bg-green-600 hover:bg-green-700 flex-shrink-0"}
          >
            {isToggling ? "..." : buttonInfo.label}
          </Button>
        </div>
        <div className="mt-3">
          <Link href={`/stand-portal/${standId}`} className="text-sm text-[#0B4D2C] hover:underline flex items-center gap-1">
            <ExternalLink className="h-3.5 w-3.5" />
            Open Stand Portal
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
