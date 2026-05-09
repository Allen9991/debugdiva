"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { ExtractVoiceResponse } from "@/lib/claude/schemas";

type Props = {
  extraction: ExtractVoiceResponse;
  onAnswerQuestion: (answer: string) => void | Promise<void>;
  onSkip: () => void;
  isReExtracting: boolean;
  className?: string;
};

const FRIENDLY_LABELS: Record<string, string> = {
  client_name: "Client name",
  job_location: "Location",
  labour_hours: "Labour hours",
  job_description: "Job description",
  total_estimate: "Total estimate",
  labour_rate: "Labour rate",
};

function friendlyFieldLabel(raw: string): string {
  if (FRIENDLY_LABELS[raw]) return FRIENDLY_LABELS[raw];
  if (raw.startsWith("materials")) {
    if (raw.endsWith(".cost") || raw.includes("cost"))
      return "Material costs";
    if (raw.endsWith(".quantity") || raw.includes("quantity"))
      return "Material quantities";
    return "Materials";
  }
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ForgivenessMode({
  extraction,
  onAnswerQuestion,
  onSkip,
  isReExtracting,
  className,
}: Props) {
  const [answer, setAnswer] = useState("");
  const confidencePct = Math.round(extraction.confidence * 100);

  const trimmed = answer.trim();
  const canSubmit = trimmed.length > 0 && !isReExtracting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onAnswerQuestion(trimmed);
    setAnswer("");
  };

  const uniqueMissing = Array.from(new Set(extraction.missing_fields));

  const totalMaterialsCost = extraction.materials.reduce(
    (sum, m) => sum + (m.cost ?? 0),
    0,
  );

  return (
    <Card
      className={cn(
        "rounded-2xl bg-white shadow-sm border border-amber-200 overflow-hidden",
        className,
      )}
    >
      {/* Top warning banner */}
      <div className="bg-amber-100 border-b border-amber-200 px-4 py-3 flex items-start gap-2">
        <span aria-hidden className="text-lg leading-none mt-0.5">
          ⚠️
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            Some details need confirming before this can be sent
          </p>
          <p className="text-xs text-amber-800 mt-0.5">
            I&rsquo;d rather check than guess.
          </p>
        </div>
        <Badge className="rounded-md bg-amber-200 text-amber-900 px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
          {confidencePct}% confident
        </Badge>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* What I picked up — read-only summary so the user has context */}
        <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm space-y-1.5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            What I picked up
          </p>
          <p className="text-slate-900">
            {extraction.client_name ?? <em className="text-slate-400">no client</em>}
            {extraction.job_location ? ` · ${extraction.job_location}` : ""}
            {extraction.labour_hours != null
              ? ` · ${extraction.labour_hours}h`
              : ""}
          </p>
          {extraction.job_description && (
            <p className="text-slate-600 text-sm">
              {extraction.job_description}
            </p>
          )}
          {extraction.materials.length > 0 && (
            <p className="text-slate-600 text-xs">
              {extraction.materials.map((m) => m.name).join(", ")}
              {totalMaterialsCost > 0
                ? ` · ~${formatCurrency(totalMaterialsCost)}`
                : ""}
            </p>
          )}
        </div>

        {/* Missing field badges */}
        {uniqueMissing.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Still need
            </p>
            <div className="flex flex-wrap gap-1.5">
              {uniqueMissing.map((field) => (
                <Badge
                  key={field}
                  className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 border border-amber-200"
                >
                  <span aria-hidden>⚠️</span>
                  {friendlyFieldLabel(field)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* The question card */}
        {extraction.clarifying_question && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
            <div className="flex items-start gap-2">
              <span aria-hidden className="text-xl leading-none">
                💬
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Quick question
                </p>
                <p className="text-base font-semibold text-slate-900 mt-0.5">
                  {extraction.clarifying_question}
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
              disabled={isReExtracting}
              className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-60"
            />

            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full h-12 rounded-xl bg-slate-900 text-white font-semibold active:bg-slate-800 disabled:opacity-50"
            >
              {isReExtracting ? "Updating…" : "Submit answer"}
            </Button>
          </div>
        )}

        {/* Note: NO "send invoice" button in this state — that only appears
            once confidence ≥ 0.7 (parent swaps to ExtractionPreview). */}

        <button
          type="button"
          onClick={onSkip}
          disabled={isReExtracting}
          className="w-full text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700 disabled:opacity-60 py-1"
        >
          Skip and proceed anyway with missing details
        </button>
      </div>
    </Card>
  );
}
