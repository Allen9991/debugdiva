"use client";

import { useMemo, useState } from "react";

import type {
  CaptureType,
  RecentCapture,
  ReceiptCaptureResult,
  VoiceCaptureResult,
} from "@/lib/types";

import { CaptureReadiness } from "./CaptureReadiness";
import { CaptureStatus } from "./CaptureStatus";
import { ReceiptUploader } from "./ReceiptUploader";
import { VoiceRecorder } from "./VoiceRecorder";

type HandoffState = {
  status: "idle" | "sending" | "accepted" | "error";
  message: string;
};

async function handoffCapture(captureId: string, type: CaptureType) {
  const response = await fetch("/api/brain/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      capture_id: captureId,
      type,
    }),
  });

  const payload = (await response.json()) as
    | { status?: string; message?: string }
    | { error?: string };

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error || "Handoff failed." : "Handoff failed.");
  }

  const successPayload = payload as { status?: string; message?: string };

  return {
    status: successPayload.status ?? "accepted",
    message: successPayload.message ?? "Capture handed off to Brain Zone.",
  };
}

export function CaptureHub() {
  const [recentCapture, setRecentCapture] = useState<RecentCapture | null>(null);
  const [handoffState, setHandoffState] = useState<HandoffState>({
    status: "idle",
    message: "No capture yet. Start with a voice note or a receipt photo.",
  });

  const heroMessage = useMemo(() => {
    if (!recentCapture) {
      return "One tap to record. One tap to snap. Keep moving.";
    }

    if (recentCapture.type === "voice") {
      return "Voice note captured. Admin Ghost is passing it to the AI brain.";
    }

    return "Receipt captured. Admin Ghost is passing it to the AI brain.";
  }, [recentCapture]);

  async function completeCapture(nextCapture: RecentCapture, type: CaptureType) {
    setRecentCapture(nextCapture);
    setHandoffState({
      status: "sending",
      message: "Captured. Sending to Brain Zone for extraction...",
    });

    try {
      const handoff = await handoffCapture(nextCapture.captureId, type);
      setHandoffState({
        status: "accepted",
        message: handoff.message,
      });
    } catch (error) {
      setHandoffState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Capture succeeded, but the handoff needs a retry.",
      });
    }
  }

  async function retryHandoff() {
    if (!recentCapture) {
      return;
    }

    await completeCapture(recentCapture, recentCapture.type);
  }

  function handleVoiceComplete(result: VoiceCaptureResult) {
    void completeCapture(
      {
        type: "voice",
        captureId: result.capture_id,
        transcript: result.text,
        confidence: result.confidence,
        durationMs: result.duration_ms,
      },
      "voice",
    );
  }

  function handleReceiptComplete(result: ReceiptCaptureResult) {
    void completeCapture(
      {
        type: "receipt",
        captureId: result.capture_id,
        imageUrl: result.image_url,
      },
      "receipt",
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Demo Flow
        </p>
        <p className="mt-2 text-base leading-7 text-slate-700">{heroMessage}</p>
      </div>

      <CaptureReadiness />
      <VoiceRecorder onComplete={handleVoiceComplete} />
      <ReceiptUploader onComplete={handleReceiptComplete} />
      <CaptureStatus
        recentCapture={recentCapture}
        handoffState={handoffState}
        onRetryHandoff={handoffState.status === "error" ? retryHandoff : null}
      />
    </section>
  );
}
