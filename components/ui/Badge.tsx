import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "destructive";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-indigo-600/20 text-indigo-300 border border-indigo-500/30",
    secondary: "border-transparent bg-zinc-800 text-zinc-300 border border-zinc-700",
    outline: "text-zinc-300 border-zinc-700",
    success: "border-transparent bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    warning: "border-transparent bg-amber-500/20 text-amber-300 border border-amber-500/30",
    destructive: "border-transparent bg-rose-500/20 text-rose-300 border border-rose-500/30",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
