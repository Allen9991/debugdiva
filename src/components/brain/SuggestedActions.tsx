"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SuggestedAction } from "@/lib/claude/schemas";

type Props = {
  actions: SuggestedAction[];
  onAction: (action: string) => void;
  isLoading?: boolean;
  className?: string;
};

const SKELETON_WIDTHS = ["w-24", "w-32", "w-20"];

export function SuggestedActions({
  actions,
  onAction,
  isLoading = false,
  className,
}: Props) {
  if (isLoading) {
    return (
      <div
        className={cn("flex flex-wrap gap-1.5", className)}
        aria-busy="true"
        aria-label="Loading suggestions"
      >
        {SKELETON_WIDTHS.map((w, i) => (
          <span
            key={i}
            className={cn(
              "h-8 rounded-full bg-slate-200 animate-pulse",
              w,
            )}
          />
        ))}
      </div>
    );
  }

  if (actions.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {actions.map((a, i) => (
        <Button
          key={`${a.action}-${i}`}
          onClick={() => onAction(a.action)}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 active:bg-slate-100"
        >
          {a.label}
        </Button>
      ))}
    </div>
  );
}
