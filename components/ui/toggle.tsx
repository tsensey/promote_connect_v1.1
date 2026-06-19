"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ToggleProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function Toggle({ pressed, onPressedChange, className, children }: ToggleProps) {
  return (
    <Button
      variant={pressed ? "default" : "ghost"}
      size="sm"
      onClick={() => onPressedChange(!pressed)}
      className={cn("h-8 w-8 p-0", className)}
    >
      {children}
    </Button>
  );
}
