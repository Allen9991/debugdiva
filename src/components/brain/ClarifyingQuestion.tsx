"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  question: string;
  // Called with the user's answer. Caller is expected to re-trigger
  // extraction with the answer appended as additional context.
  onSubmit: (answer: string) => void | Promise<void>;
  // Called when the user wants to skip — caller should proceed with
  // missing fields still flagged.
  onSkip: () => void;
  isSubmitting?: boolean;
  className?: string;
};

export function ClarifyingQuestion({
  question,
  onSubmit,
  onSkip,
  isSubmitting = false,
  className,
}: Props) {
  const [answer, setAnswer] = useState("");

  const trimmed = answer.trim();
  const canSubmit = trimmed.length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onSubmit(trimmed);
  };

  return (
    <Card
      className={cn(
        "rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 space-y-3",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <span aria-hidden className="text-xl leading-none">
          💬
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
            Just to confirm
          </p>
          <p className="text-base font-medium text-amber-950 mt-0.5">
            {question}
          </p>
        </div>
      </div>

      <Input
        type="text"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Type your answer…"
        autoFocus
        disabled={isSubmitting}
        className="w-full h-12 rounded-xl border border-amber-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 disabled:opacity-60"
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={onSkip}
          disabled={isSubmitting}
          className="h-12 rounded-xl border border-amber-300 bg-white text-amber-900 font-medium active:bg-amber-100 disabled:opacity-60"
        >
          Skip
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={cn(
            "h-12 rounded-xl font-semibold text-white active:bg-slate-800 disabled:opacity-50",
            "bg-slate-900",
          )}
        >
          {isSubmitting ? "Updating…" : "Submit"}
        </Button>
      </div>
    </Card>
  );
}
