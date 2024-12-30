'use client';

import { useEffect, useState } from 'react';

interface ProductTimerProps {
  updatedAt: Date;
  size?: 'small' | 'normal';
}

export function ProductTimer({ updatedAt, size = 'normal' }: ProductTimerProps) {
  const [timeElapsed, setTimeElapsed] = useState('00:00');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const updated = new Date(updatedAt);
      const diff = Math.floor((now.getTime() - updated.getTime()) / 1000); // difference in seconds
      
      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      // First hour: show minutes:seconds
      if (diff < 3600) {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      // Next two days: show hours:minutes
      else if (days < 2) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
      // After two days: show days
      else {
        return `${days}d ago`;
      }
    };

    // Initial calculation
    setTimeElapsed(calculateTime());

    // Update every second
    const interval = setInterval(() => {
      setTimeElapsed(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [updatedAt]);

  return (
    <div className={`absolute top-0 left-0 bg-black/60 text-white rounded-br-md font-mono
      ${size === 'small' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}`}>
      {timeElapsed}
    </div>
  );
}
