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

const captureCss = `
  .capture-page {
    min-height: 100vh;
    padding: 32px 16px;
    background:
      radial-gradient(circle at top, rgba(20, 184, 166, 0.2), transparent 34%),
      linear-gradient(180deg, #f8fafc 0%, #eef7f2 100%);
    color: #0f172a;
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .capture-container,
  .capture-stack {
    width: min(100%, 640px);
    margin: 0 auto;
  }

  .capture-container,
  .capture-stack,
  .capture-card,
  .capture-panel-body {
    display: grid;
    gap: 24px;
  }

  .capture-page-header {
    text-align: center;
    display: grid;
    gap: 12px;
  }

  .capture-page-header p:first-child,
  .capture-eyebrow,
  .capture-card p:first-child {
    margin: 0;
    color: #047857;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .capture-page h1 {
    margin: 0;
    font-size: clamp(34px, 8vw, 52px);
    line-height: 0.96;
    letter-spacing: 0;
    color: #07111f;
  }

  .capture-page h2 {
    margin: 8px 0 0;
    font-size: 24px;
    line-height: 1.12;
    letter-spacing: 0;
    color: #0f172a;
  }

  .capture-page p {
    margin: 0;
  }

  .capture-page-header p:last-child,
  .capture-copy,
  .capture-page section p {
    color: #475569;
    line-height: 1.6;
  }

  .capture-page section,
  .capture-card {
    border: 1px solid #dbe3ea;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.94);
    padding: 22px;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  }

  .capture-page button {
    border: 0;
    border-radius: 14px;
    background: #0f172a;
    color: white;
    min-height: 48px;
    padding: 12px 18px;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .capture-page button:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }

  .capture-record-button {
    width: 144px;
    height: 144px;
    border-radius: 999px !important;
    display: block;
    margin: 4px auto 0;
    font-size: 20px;
    box-shadow: 0 18px 32px rgba(15, 23, 42, 0.22);
  }

  .capture-action-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .capture-secondary-button {
    background: #059669 !important;
  }

  .capture-dropzone {
    border: 2px dashed #cbd5e1;
    border-radius: 16px;
    background: #f8fafc;
    padding: 18px;
  }

  .capture-preview,
  .capture-placeholder {
    width: 100%;
    height: 224px;
    border-radius: 12px;
    object-fit: cover;
    background: white;
  }

  .capture-placeholder {
    display: grid;
    place-items: center;
    text-align: center;
    padding: 20px;
    color: #64748b;
    box-sizing: border-box;
  }

  .capture-metrics,
  .capture-result,
  .capture-help {
    border-radius: 14px;
    background: #f8fafc;
    padding: 14px;
    color: #475569;
    font-size: 14px;
  }

  .capture-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .capture-success {
    border: 1px solid #a7f3d0;
    background: #ecfdf5;
  }

  .hidden {
    display: none !important;
  }

  @media (max-width: 520px) {
    .capture-page {
      padding: 24px 12px;
    }

    .capture-action-grid {
      grid-template-columns: 1fr;
    }

    .capture-page section,
    .capture-card {
      padding: 18px;
    }
  }
`;

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
    <section className="capture-stack space-y-6">
      <style>{captureCss}</style>
      <div className="capture-card rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <p className="capture-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Demo Flow
        </p>
        <p className="capture-copy mt-2 text-base leading-7 text-slate-700">{heroMessage}</p>
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
