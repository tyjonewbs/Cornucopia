"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">{standName}</h3>
          <div>
            {isOpen ? (
              <div>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-lg font-medium">
                  {getStatusLabel()}
                </span>
              </div>
            ) : (
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-800 text-lg font-medium">
                Closed
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col gap-1">
            <Button
              onClick={handleToggle}
              disabled={isToggling}
              className={isOpen ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isToggling ? "Updating..." : buttonInfo.label}
            </Button>
            {buttonInfo.subtitle && !isToggling && (
              <p className="text-xs text-gray-500 text-center">
                {buttonInfo.subtitle}
              </p>
            )}
          </div>
          <Link href={`/stand-portal/${standId}`}>
            <Button variant="outline">
              Go to Stand Portal →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
