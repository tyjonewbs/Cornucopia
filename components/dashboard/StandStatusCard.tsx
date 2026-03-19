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
}

export function StandStatusCard({ standId, standName, isOpen: initialIsOpen }: StandStatusCardProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isToggling, setIsToggling] = useState(false);
  const router = useRouter();

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

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">{standName}</h3>
          <div>
            {isOpen ? (
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-lg font-medium">
                Open Now
              </span>
            ) : (
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-800 text-lg font-medium">
                Closed
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleToggle}
            disabled={isToggling}
            className={isOpen ? "bg-gray-600 hover:bg-gray-700" : "bg-green-600 hover:bg-green-700"}
          >
            {isToggling ? "Updating..." : isOpen ? "Close Stand" : "Open Stand"}
          </Button>
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
