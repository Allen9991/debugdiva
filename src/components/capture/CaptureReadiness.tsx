"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CheckStatus = "checking" | "ready" | "warning";

type ReadinessItem = {
  label: string;
  detail: string;
  status: CheckStatus;
};

function toneForStatus(status: CheckStatus) {
  if (status === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "checking") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function CaptureReadiness() {
  const [items, setItems] = useState<ReadinessItem[]>([
    {
      label: "Microphone",
      detail: "Checking browser recording support...",
      status: "checking",
    },
    {
      label: "Camera Upload",
      detail: "Checking file and camera capture support...",
      status: "checking",
    },
    {
      label: "Demo Context",
      detail: "Checking secure browser context...",
      status: "checking",
    },
  ]);

  const summary = useMemo(() => {
    if (items.every((item) => item.status === "ready")) {
      return "This device looks demo-ready for capture.";
    }

    if (items.some((item) => item.status === "checking")) {
      return "Running capture checks...";
    }

    return "One or two things need a quick sanity check before the demo.";
  }, [items]);

  useEffect(() => {
    const microphoneReady =
      typeof window !== "undefined" &&
      typeof MediaRecorder !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;
    const cameraReady =
      typeof window !== "undefined" &&
      typeof File !== "undefined" &&
      typeof FormData !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia;
    const secureReady =
      typeof window !== "undefined" &&
      (window.isSecureContext || window.location.hostname === "localhost");

    setItems([
      {
        label: "Microphone",
        detail: microphoneReady
          ? "Browser recording APIs are available."
          : "Use a modern mobile browser with microphone access enabled.",
        status: microphoneReady ? "ready" : "warning",
      },
      {
        label: "Camera Upload",
        detail: cameraReady
          ? "Live camera capture and file upload are available."
          : "Use HTTPS or localhost in a browser with camera permissions.",
        status: cameraReady ? "ready" : "warning",
      },
      {
        label: "Demo Context",
        detail: secureReady
          ? "Microphone permissions should work in this context."
          : "Use HTTPS or localhost so mic recording is allowed.",
        status: secureReady ? "ready" : "warning",
      },
    ]);
  }, []);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
              Demo Readiness
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Check the phone before the judges do
            </h2>
          </div>
          <Button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Refresh Check
          </Button>
        </div>

        <p className="text-sm leading-6 text-slate-600">{summary}</p>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.label}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm leading-6",
                toneForStatus(item.status),
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold">{item.label}</span>
                <span className="text-xs uppercase tracking-[0.16em]">
                  {item.status}
                </span>
              </div>
              <p className="mt-1">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
          Demo drill: allow microphone, record one 5-second job note, snap one real
          receipt, then confirm both show a `capture_id` and a green handoff state.
        </div>
      </div>
    </section>
  );
}
