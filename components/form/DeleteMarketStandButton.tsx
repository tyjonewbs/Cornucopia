"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DeleteMarketStand } from "@/app/actions/market-stand";

interface DeleteMarketStandButtonProps {
  marketStandId: string;
  marketStandName: string;
  userId: string;
}

export function DeleteMarketStandButton({ marketStandId, marketStandName, userId }: DeleteMarketStandButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await DeleteMarketStand(marketStandId, userId);
      
      if (result.success) {
        toast.success("Market stand deleted successfully");
        router.push('/dashboard/market-stand/setup');
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete market stand");
        setIsDeleting(false);
      }
    } catch (error) {
      toast.error("An error occurred while deleting the market stand");
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2" disabled={isDeleting}>
          <Trash2 className="h-4 w-4" />
          Delete Market Stand
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{marketStandName}</strong> and all associated data. 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
