"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ExtractVoiceResponse } from "@/lib/claude/schemas";

type Props = {
  data: ExtractVoiceResponse;
  onApprove: () => void;
  onEdit: () => void;
  className?: string;
};

function confidenceBucket(score: number): "low" | "medium" | "high" {
  if (score < 0.5) return "low";
  if (score < 0.8) return "medium";
  return "high";
}

const confidenceStyles: Record<"low" | "medium" | "high", string> = {
  low: "bg-red-100 text-red-800 border border-red-200",
  medium: "bg-amber-100 text-amber-800 border border-amber-200",
  high: "bg-green-100 text-green-800 border border-green-200",
};

const confidenceLabel: Record<"low" | "medium" | "high", string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

function FieldRow({
  label,
  value,
  missing,
}: {
  label: string;
  value: string | null;
  missing: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-b-0">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      {missing ? (
        <Badge className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
          <span aria-hidden>⚠️</span>
          <span>Missing</span>
        </Badge>
      ) : (
        <span className="text-sm font-medium text-slate-900 text-right break-words">
          {value}
        </span>
      )}
    </div>
  );
}

export function ExtractionPreview({ data, onApprove, onEdit, className }: Props) {
  const missing = new Set(data.missing_fields);
  const bucket = confidenceBucket(data.confidence);

  const totalMaterialsCost = data.materials.reduce(
    (sum, m) => sum + (m.cost ?? 0),
    0,
  );

  return (
    <Card
      className={cn(
        "rounded-2xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 space-y-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-900">Job details</h2>
        <Badge
          className={cn(
            "rounded-md px-2 py-0.5 text-xs font-medium",
            confidenceStyles[bucket],
          )}
        >
          {confidenceLabel[bucket]}
        </Badge>
      </div>

      {data.clarifying_question && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
          <div className="flex items-start gap-2">
            <span aria-hidden className="text-lg leading-none">
              💬
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                Quick check
              </p>
              <p className="text-sm text-amber-900 mt-0.5">
                {data.clarifying_question}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-slate-50 px-3 py-2">
        <FieldRow
          label="Client"
          value={data.client_name}
          missing={missing.has("client_name") || !data.client_name}
        />
        <FieldRow
          label="Location"
          value={data.job_location}
          missing={missing.has("job_location") || !data.job_location}
        />
        <FieldRow
          label="Labour"
          value={data.labour_hours != null ? `${data.labour_hours} hrs` : null}
          missing={missing.has("labour_hours") || data.labour_hours == null}
        />
        <FieldRow
          label="Description"
          value={data.job_description}
          missing={missing.has("job_description") || !data.job_description}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-900">Materials</h3>
          {totalMaterialsCost > 0 && (
            <span className="text-xs text-slate-500">
              ~{formatCurrency(totalMaterialsCost)}
            </span>
          )}
        </div>
        {data.materials.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No materials listed</p>
        ) : (
          <ul className="space-y-1.5">
            {data.materials.map((m, i) => {
              const qtyMissing = missing.has(`materials.${i}.quantity`);
              const costMissing = missing.has(`materials.${i}.cost`);
              return (
                <li
                  key={`${m.name}-${i}`}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-slate-900 truncate">
                      {m.name}
                    </span>
                    {m.quantity != null && (
                      <span className="text-slate-500 shrink-0">
                        × {m.quantity}
                      </span>
                    )}
                    {qtyMissing && (
                      <Badge className="rounded-md bg-amber-50 px-1.5 py-0 text-[10px] text-amber-800 border border-amber-200">
                        qty?
                      </Badge>
                    )}
                  </div>
                  {m.cost != null ? (
                    <span className="text-slate-700 shrink-0">
                      {formatCurrency(m.cost)}
                    </span>
                  ) : costMissing ? (
                    <Badge className="rounded-md bg-amber-50 px-1.5 py-0 text-[10px] text-amber-800 border border-amber-200">
                      cost?
                    </Badge>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-xl bg-slate-900 text-white px-3 py-3 flex items-center justify-between">
        <span className="text-sm">Estimate</span>
        <span className="text-lg font-semibold">
          {data.total_estimate != null
            ? formatCurrency(data.total_estimate)
            : "—"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          onClick={onEdit}
          className="h-12 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium active:bg-slate-50"
        >
          Edit details
        </Button>
        <Button
          onClick={onApprove}
          className="h-12 rounded-xl bg-slate-900 text-white font-semibold active:bg-slate-800"
        >
          Looks good
        </Button>
      </div>
    </Card>
  );
}
