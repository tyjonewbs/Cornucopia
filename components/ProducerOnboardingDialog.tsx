"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Store, Truck } from "lucide-react";

interface ProducerOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProducerOnboardingDialog({ open, onOpenChange }: ProducerOnboardingDialogProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleChoice = (choice: 'market-stand' | 'delivery') => {
    setIsNavigating(true);
    
    if (choice === 'market-stand') {
      router.push('/dashboard/market-stand/setup/new');
    } else {
      // For delivery-only, first set up a delivery zone
      router.push('/dashboard/delivery-zones/new');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">How will you sell?</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Choose how you'd like to get your products to customers
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-start gap-3 hover:bg-orange-50 hover:border-[#8B4513] transition-all"
            onClick={() => handleChoice('market-stand')}
            disabled={isNavigating}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="rounded-full bg-[#8B4513] p-3">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-lg text-gray-900">Set up a Market Stand</div>
                <div className="text-sm text-gray-600 mt-1">
                  I have a physical location where customers can pick up products
                </div>
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-6 flex flex-col items-start gap-3 hover:bg-orange-50 hover:border-[#8B4513] transition-all"
            onClick={() => handleChoice('delivery')}
            disabled={isNavigating}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="rounded-full bg-[#8B4513] p-3">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-lg text-gray-900">Delivery Only</div>
                <div className="text-sm text-gray-600 mt-1">
                  I'll deliver products directly to customers in my delivery area
                </div>
              </div>
            </div>
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          Don't worry, you can always change this later
        </p>
      </DialogContent>
    </Dialog>
  );
}
