"use client";

import { useFormStatus } from "react-dom";
import { Button } from "../ui/button";

interface SubmitStandButtonProps {
  title: string;
  isFormValid: boolean;
}

export function SubmitStandButton({ title, isFormValid }: SubmitStandButtonProps) {
  const { pending } = useFormStatus();
  
  return (
    <Button 
      type="submit"
      disabled={!isFormValid || pending}
      className="min-w-[150px]"
    >
      {pending ? "Submitting..." : title}
    </Button>
  );
}
