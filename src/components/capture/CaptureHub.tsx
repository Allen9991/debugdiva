"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type ExtractedVoice = {
  client_name: string | null;
  job_location: string | null;
  labour_hours: number | null;
  materials: { name: string; cost: number | null }[];
  job_description: string | null;
  total_estimate: number | null;
  missing_fields: string[];
  clarifying_question: string | null;
  confidence: number;
};

type HandoffState = {
  status: "idle" | "sending" | "accepted" | "error";
  message: string;
};

type HandoffResult = {
  status: string;
  message: string;
  extracted: ExtractedVoice | null;
};

async function handoffCapture(
  captureId: string,
  type: CaptureType,
): Promise<HandoffResult> {
  console.log("[CaptureHub] handoff ->", type, captureId);
  const response = await fetch("/api/brain/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ capture_id: captureId, type }),
  });

  const payload = (await response.json()) as {
    status?: string;
    message?: string;
    extracted?: ExtractedVoice;
    error?: string;
  };
  console.log("[CaptureHub] extract response:", payload);

  if (!response.ok) {
    throw new Error(payload.error || "Handoff failed.");
  }

  return {
    status: payload.status ?? "accepted",
    message: payload.message ?? "Capture handed off to Brain Zone.",
    extracted: payload.extracted ?? null,
  };
}

export function CaptureHub() {
  const router = useRouter();
  const [recentCapture, setRecentCapture] = useState<RecentCapture | null>(null);
  const [extracted, setExtracted] = useState<ExtractedVoice | null>(null);
  const [creating, setCreating] = useState<null | "job" | "invoice">(null);
  const [handoffState, setHandoffState] = useState<HandoffState>({
    status: "idle",
    message: "No capture yet. Start with a voice note or a receipt photo.",
  });

  const heroMessage = useMemo(() => {
    if (!recentCapture) return "One tap to record. One tap to snap. Keep moving.";
    if (recentCapture.type === "voice") {
      return "Voice note captured. Admin Ghost is passing it to the AI brain.";
    }
    return "Receipt captured. Admin Ghost is passing it to the AI brain.";
  }, [recentCapture]);

  async function completeCapture(nextCapture: RecentCapture, type: CaptureType) {
    console.log("[CaptureHub] capture complete:", type, nextCapture.captureId);
    setRecentCapture(nextCapture);
    setExtracted(null);
    setHandoffState({
      status: "sending",
      message: "Captured. Sending to Brain Zone for extraction...",
    });

    try {
      const handoff = await handoffCapture(nextCapture.captureId, type);
      setHandoffState({ status: "accepted", message: handoff.message });
      if (handoff.extracted) setExtracted(handoff.extracted);
    } catch (error) {
      console.error("[CaptureHub] handoff failed:", error);
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
    if (!recentCapture) return;
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
      { type: "receipt", captureId: result.capture_id, imageUrl: result.image_url },
      "receipt",
    );
  }

  async function createJob() {
    if (!extracted) return;
    console.log("[CaptureHub] Create Job clicked, extracted:", extracted);
    setCreating("job");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: extracted.client_name ?? "Unknown client",
          location: extracted.job_location ?? "",
          description: extracted.job_description ?? "",
          labour_hours: extracted.labour_hours ?? 0,
          materials: (extracted.materials ?? [])
            .filter((m) => m.cost != null)
            .map((m) => ({ name: m.name, cost: m.cost as number })),
          status: "completed",
        }),
      });
      const data = await res.json();
      console.log("[CaptureHub] /api/jobs response:", data);
      if (!res.ok || !data?.job?.id) {
        throw new Error(data?.error ?? "Failed to create job");
      }
      router.push("/jobs/" + data.job.id);
    } catch (err) {
      console.error("[CaptureHub] createJob threw:", err);
      setHandoffState({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Couldn't create the job. Try again.",
      });
    } finally {
      setCreating(null);
    }
  }

  async function createDraftInvoice() {
    if (!extracted) return;
    console.log("[CaptureHub] View Draft Invoice clicked");
    setCreating("invoice");
    try {
      const jobRes = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: extracted.client_name ?? "Unknown client",
          location: extracted.job_location ?? "",
          description: extracted.job_description ?? "",
          labour_hours: extracted.labour_hours ?? 0,
          materials: (extracted.materials ?? [])
            .filter((m) => m.cost != null)
            .map((m) => ({ name: m.name, cost: m.cost as number })),
          status: "completed",
        }),
      });
      const jobData = await jobRes.json();
      console.log("[CaptureHub] job created for draft invoice:", jobData);
      if (!jobRes.ok || !jobData?.job?.id) {
        throw new Error(jobData?.error ?? "Failed to create job");
      }

      const invRes = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobData.job.id }),
      });
      const invData = await invRes.json();
      console.log("[CaptureHub] /api/invoices response:", invData);
      if (!invRes.ok || !invData?.invoice?.id) {
        throw new Error(invData?.error ?? "Failed to draft invoice");
      }
      router.push("/invoices/" + invData.invoice.id);
    } catch (err) {
      console.error("[CaptureHub] createDraftInvoice threw:", err);
      setHandoffState({
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Couldn't draft the invoice. Try again.",
      });
    } finally {
      setCreating(null);
    }
  }

  return (
    <section className="capture-stack space-y-6">
      <div
        className="capture-card rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-sm"
      >
        <p className="capture-eyebrow text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Demo Flow
        </p>
        <p className="capture-copy mt-2 text-base leading-7 text-slate-700">
          {heroMessage}
        </p>
      </div>

      <CaptureReadiness />
      <VoiceRecorder onComplete={handleVoiceComplete} />
      <ReceiptUploader onComplete={handleReceiptComplete} />
      <CaptureStatus
        recentCapture={recentCapture}
        handoffState={handoffState}
        onRetryHandoff={handoffState.status === "error" ? retryHandoff : null}
      />

      {extracted && handoffState.status === "accepted" && (
        <div className="capture-card" style={{ display: "grid", gap: 14 }}>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#047857",
              }}
            >
              Ghostly extracted
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 16,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {extracted.client_name ?? "Unknown client"}
              {extracted.job_location ? " - " + extracted.job_location : ""}
            </div>
            {extracted.job_description && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 14,
                  color: "#475569",
                  lineHeight: 1.55,
                }}
              >
                {extracted.job_description}
              </p>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={createJob}
              disabled={creating !== null}
              style={{
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 700,
                cursor: creating ? "not-allowed" : "pointer",
                opacity: creating === "job" ? 0.7 : 1,
              }}
            >
              {creating === "job" ? "Creating job..." : "Create Job"}
            </button>
            <button
              type="button"
              onClick={createDraftInvoice}
              disabled={creating !== null}
              style={{
                background: "#FF5E4D",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 700,
                cursor: creating ? "not-allowed" : "pointer",
                opacity: creating === "invoice" ? 0.7 : 1,
              }}
            >
              {creating === "invoice" ? "Drafting..." : "View Draft Invoice"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
