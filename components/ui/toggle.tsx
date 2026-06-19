"use client";

import { cn } from "@/lib/utils";
import { Button, ButtonProps } from "@/components/ui/button";

interface ToggleProps extends Omit<ButtonProps, "variant" | "onClick"> {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}

export function Toggle({ pressed, onPressedChange, className, children, ...props }: ToggleProps) {
  return (
    <Button
      variant={pressed ? "default" : "ghost"}
      size="sm"
      onClick={() => onPressedChange(!pressed)}
      className={cn("h-8 w-8 p-0", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
