import { cn } from "@/lib/utils";
import type { RecentCapture } from "@/lib/types";

type CaptureStatusProps = {
  recentCapture: RecentCapture | null;
  handoffState: {
    status: "idle" | "sending" | "accepted" | "error";
    message: string;
  };
  onRetryHandoff?: (() => void) | null;
};

function statusTone(status: CaptureStatusProps["handoffState"]["status"]) {
  switch (status) {
    case "sending":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export function CaptureStatus({
  recentCapture,
  handoffState,
  onRetryHandoff,
}: CaptureStatusProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Capture Status
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Keep the handoff visible
          </h2>
        </div>

        <div
          className={cn(
            "rounded-2xl border p-4 text-sm leading-6",
            statusTone(handoffState.status),
          )}
        >
          {handoffState.message}

          {handoffState.status === "error" && onRetryHandoff ? (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetryHandoff}
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
              >
                Retry Handoff
              </button>
            </div>
          ) : null}
        </div>

        {recentCapture ? (
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900">
                Latest {recentCapture.type === "voice" ? "voice note" : "receipt"}
              </p>
              <p className="truncate text-xs uppercase tracking-[0.16em] text-slate-500">
                {recentCapture.captureId}
              </p>
            </div>

            {recentCapture.type === "voice" ? (
              <div className="mt-3 space-y-2">
                <p className="text-sm leading-6 text-slate-700">
                  {recentCapture.transcript || "Transcript came back empty."}
                </p>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Confidence {Math.round(recentCapture.confidence * 100)}%</span>
                  <span>{Math.round(recentCapture.durationMs / 1000)}s</span>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="rounded-2xl bg-white p-2">
                  <img
                    src={
                      recentCapture.imageUrl.startsWith("local-preview://")
                        ? "/ghost-mascot.svg"
                        : recentCapture.imageUrl
                    }
                    alt="Receipt capture preview"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                </div>
                <p className="text-sm text-slate-600">
                  Stored and ready for receipt extraction.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
