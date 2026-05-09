"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Mahi } from "@/components/mahi";
import {
  Card,
  Eyebrow,
  MahiTag,
  Pill,
  PrimaryButton,
} from "@/components/ui/primitives";
import type { ExtractVoiceResponse } from "@/lib/claude/schemas";

type Phase = "idle" | "recording" | "uploading" | "extracting" | "forgiveness" | "preview";
type BusyAction = "demo" | "job" | "invoice" | "quote";
type CaptureIntent = "job" | "invoice" | "quote" | "complete_existing_job" | "mark_existing_paid";

type ExtractApiResponse = {
  status?: string;
  message?: string;
  extracted?: ExtractVoiceResponse;
  capture_id?: string;
  error?: string;
};

const CONFIDENCE_THRESHOLD = 0.7;
const WAVE_BARS = 40;

const FIELD_LABELS: Record<string, string> = {
  client_name: "Client Name",
  job_location: "Job Location",
  labour_hours: "Labour Hours",
  "materials.cost": "Material Costs",
  job_description: "Job Description",
};

type ExistingJob = {
  id: string;
  client_name: string;
  location?: string | null;
  description: string;
  status: string;
};

function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function questionForField(field: string) {
  if (field === "client_name") return "Who is the client for this job?";
  if (field === "job_location") return "What is the job location?";
  if (field === "labour_hours") return "How many labour hours should I use?";
  if (field === "materials.cost") return "What did the materials cost?";
  return "What should I add for " + fieldLabel(field) + "?";
}

function cleanTypedAnswer(value: string, field: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  const acronyms = new Set(["ucsa", "nz", "gst"]);
  if (field === "client_name" || field === "job_location") {
    return trimmed
      .split(" ")
      .map((word) => {
        const stripped = word.replace(/[^a-z0-9]/gi, "").toLowerCase();
        if (acronyms.has(stripped)) return word.toUpperCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  }
  if (field === "job_description") {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  return trimmed;
}

function preferredMimeType() {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? "audio/webm";
}

function formatTimer(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function normalizeMatch(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findExistingOpenJob(jobs: ExistingJob[], extracted: ExtractVoiceResponse) {
  const client = normalizeMatch(extracted.client_name);
  const location = normalizeMatch(extracted.job_location);
  const description = normalizeMatch(extracted.job_description);

  return jobs.find((job) => {
    if (job.status === "completed" || job.status === "paid") return false;
    const jobClient = normalizeMatch(job.client_name);
    const jobLocation = normalizeMatch(job.location);
    const jobDescription = normalizeMatch(job.description);
    const clientMatches = client && (jobClient.includes(client) || client.includes(jobClient));
    const locationMatches = location && (jobLocation.includes(location) || location.includes(jobLocation));
    const descriptionMatches =
      description &&
      description
        .split(" ")
        .filter((word) => word.length > 3)
        .some((word) => jobDescription.includes(word));
    return Boolean(clientMatches && (locationMatches || descriptionMatches));
  });
}

function deriveCaptureIntent(transcript: string): CaptureIntent {
  const lower = transcript.toLowerCase();
  if (/\b(paid|payment received|has paid|mark paid)\b/.test(lower)) return "mark_existing_paid";
  if (/\b(complete|completed|finished|done|fixed|wrapped up)\b/.test(lower)) return "complete_existing_job";
  if (/\b(invoic\w*|inv)\b/.test(lower)) return "invoice";
  if (/\b(quote|estimate)\b/.test(lower)) return "quote";
  return "job";
}

function intentStatus(intent: CaptureIntent): "completed" | "paid" | "new" {
  if (intent === "mark_existing_paid") return "paid";
  if (intent === "quote") return "new";
  return "completed";
}

export function GhostlyCapture() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [extracted, setExtracted] = useState<ExtractVoiceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forgivenessAnswer, setForgivenessAnswer] = useState("");
  const [busyAction, setBusyAction] = useState<BusyAction | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function reset() {
    setPhase("idle");
    setElapsed(0);
    setTranscript("");
    setExtracted(null);
    setError(null);
    setForgivenessAnswer("");
    setBusyAction(null);
  }

  async function extractCapture(captureId: string, rawTranscript?: string) {
    const extractRes = await fetch("/api/brain/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ capture_id: captureId, type: "voice", transcript: rawTranscript }),
    });
    const extractPayload = (await extractRes.json()) as ExtractApiResponse;

    if (!extractRes.ok || !extractPayload.extracted) {
      throw new Error(extractPayload.error ?? "Extraction failed.");
    }

    return extractPayload.extracted;
  }

  async function runDemoCapture() {
    setBusyAction("demo");
    setError(null);
    setPhase("extracting");
    try {
      const demoTranscript =
        "Finished leak repair for Sarah at 25 Queen Street. Two hours labour. Used sealant, pipe fitting, replacement valve. Materials around $75. Job tested and complete.";
      setTranscript(demoTranscript);
      const extractedResult = await extractCapture("demo-capture-" + Date.now(), demoTranscript);
      setExtracted(extractedResult);
      setPhase(extractedResult.confidence < CONFIDENCE_THRESHOLD ? "forgiveness" : "preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo capture failed.");
      setPhase("idle");
    } finally {
      setBusyAction(null);
    }
  }

  async function createJobRequest(status: "completed" | "new" | "paid" = "completed") {
    if (!extracted) {
      throw new Error("Capture is not ready yet.");
    }
    if (status === "completed" || status === "paid") {
      const jobsRes = await fetch("/api/jobs", { cache: "no-store" });
      const jobsPayload = (await jobsRes.json()) as { jobs?: ExistingJob[] };
      const existingJob = findExistingOpenJob(jobsPayload.jobs ?? [], extracted);
      if (existingJob) {
        const ok = window.confirm(
          "Ghostly found an existing job for " +
            existingJob.client_name +
            ". Update that job to " +
            status.replace("_", " ") +
            " instead of creating a new job?",
        );
        if (!ok) {
          throw new Error("Update cancelled.");
        }
        const updateRes = await fetch("/api/jobs/" + existingJob.id, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            location: extracted.job_location ?? existingJob.location ?? "Address TBC",
            description: extracted.job_description ?? existingJob.description,
            labour_hours: extracted.labour_hours ?? 0,
            materials: extracted.materials
              .filter((material) => material.cost != null)
              .map((material) => ({ name: material.name, cost: material.cost ?? 0 })),
          }),
        });
        const updatePayload = (await updateRes.json()) as { job?: { id: string }; error?: string };
        if (!updateRes.ok || !updatePayload.job?.id) {
          throw new Error(updatePayload.error ?? "Could not update existing job.");
        }
        return updatePayload.job;
      }
    }
    const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: extracted.client_name ?? "Unknown client",
          location: extracted.job_location ?? "Address TBC",
          description: extracted.job_description ?? "Captured job note",
          labour_hours: extracted.labour_hours ?? 0,
          materials: extracted.materials
            .filter((material) => material.cost != null)
            .map((material) => ({ name: material.name, cost: material.cost ?? 0 })),
          status,
        }),
      });
    const payload = (await res.json()) as { job?: { id: string }; error?: string };
    if (!res.ok || !payload.job?.id) {
      throw new Error(payload.error ?? "Could not create job.");
    }
    return payload.job;
  }

  async function createJobFromExtraction() {
    setBusyAction("job");
    setError(null);
    try {
      const job = await createJobRequest(intentStatus(deriveCaptureIntent(transcript)));
      window.location.href = "/jobs/" + job.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create job.");
    } finally {
      setBusyAction(null);
    }
  }

  async function createInvoiceFromExtraction() {
    if (!extracted) return;
    setBusyAction("invoice");
    setError(null);
    try {
      const job = await createJobRequest("completed");

      const invoiceRes = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id }),
      });
      const invoicePayload = (await invoiceRes.json()) as {
        invoice?: { id: string };
        error?: string;
      };
      if (!invoiceRes.ok || !invoicePayload.invoice?.id) {
        throw new Error(invoicePayload.error ?? "Could not create invoice.");
      }
      window.location.href = "/invoices/" + invoicePayload.invoice.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invoice.");
    } finally {
      setBusyAction(null);
    }
  }

  async function createQuoteFromExtraction() {
    setBusyAction("quote");
    setError(null);
    try {
      const job = await createJobRequest("new");
      const quoteRes = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id }),
      });
      const quotePayload = (await quoteRes.json()) as {
        quote?: { id: string };
        error?: string;
      };
      if (!quoteRes.ok || !quotePayload.quote?.id) {
        throw new Error(quotePayload.error ?? "Could not create quote.");
      }
      window.location.href = "/quotes";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create quote.");
    } finally {
      setBusyAction(null);
    }
  }

  function submitForgivenessAnswer() {
    if (!extracted || !forgivenessAnswer.trim()) return;
    const field = extracted.missing_fields[0];
    const answer = cleanTypedAnswer(forgivenessAnswer, field);
    const patch: Partial<ExtractVoiceResponse> = {};

    if (field === "client_name") patch.client_name = answer;
    if (field === "job_location") patch.job_location = answer;
    if (field === "labour_hours") {
      const hours = Number(answer.match(/\d+(?:\.\d+)?/)?.[0] ?? NaN);
      if (Number.isFinite(hours)) patch.labour_hours = hours;
    }
    if (field === "job_description") patch.job_description = answer;
    if (field === "materials.cost") {
      const cost = Number(answer.match(/\d+(?:\.\d+)?/)?.[0] ?? NaN);
      if (Number.isFinite(cost)) {
        patch.materials = extracted.materials.length > 0
          ? extracted.materials.map((material, index) => ({
              ...material,
              cost: material.cost ?? (index === 0 ? cost : null),
            }))
          : [{ name: "Materials", cost, quantity: null }];
      }
    }

    const remaining = extracted.missing_fields.filter((item) => item !== field);
    const next = {
      ...extracted,
      ...patch,
      missing_fields: remaining,
      clarifying_question: remaining[0] ? questionForField(remaining[0]) : null,
      confidence: remaining.length === 0 ? Math.max(extracted.confidence, 0.86) : extracted.confidence,
    };
    setExtracted(next);
    setForgivenessAnswer("");
    if (remaining.length === 0) setPhase("preview");
  }

  async function startRecording() {
    setError(null);
    setTranscript("");
    setExtracted(null);

    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This device does not support in-browser recording.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("MediaRecorder is unavailable in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = preferredMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      setPhase("recording");
      timerRef.current = window.setInterval(() => {
        setElapsed(Date.now() - startedAtRef.current);
      }, 100);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message || "Microphone access was denied."
          : "Microphone access was denied.",
      );
    }
  }

  async function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder) return;

    setPhase("uploading");

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () =>
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      recorder.stop();
    });

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;

    if (blob.size === 0) {
      setError("That recording came through empty. Try once more.");
      setPhase("idle");
      return;
    }

    try {
      const file = new File([blob], `voice-note-${Date.now()}.webm`, {
        type: blob.type || "audio/webm",
      });
      const formData = new FormData();
      formData.append("audio", file);

      const transcribeRes = await fetch("/api/capture/transcribe", {
        method: "POST",
        body: formData,
      });
      const transcribePayload = (await transcribeRes.json()) as
        | { text: string; capture_id: string; confidence: number; duration_ms: number }
        | { error?: string };

      if (!transcribeRes.ok) {
        throw new Error(
          ("error" in transcribePayload && transcribePayload.error) ||
            "Transcription failed.",
        );
      }

      const { text, capture_id } = transcribePayload as {
        text: string;
        capture_id: string;
      };
      setTranscript(text);
      setPhase("extracting");

      const extractedResult = await extractCapture(capture_id);
      setExtracted(extractedResult);

      if (extractedResult.confidence < CONFIDENCE_THRESHOLD) {
        setPhase("forgiveness");
      } else {
        setPhase("preview");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("idle");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {phase === "idle" && (
        <IdleView
          onStart={startRecording}
          onDemoCapture={runDemoCapture}
          error={error}
          busy={busyAction === "demo"}
        />
      )}
      {phase === "recording" && (
        <RecordingView elapsed={elapsed} onStop={stopRecording} />
      )}
      {(phase === "uploading" || phase === "extracting") && (
        <ProcessingView phase={phase} transcript={transcript} />
      )}
      {phase === "forgiveness" && extracted && (
        <ForgivenessView
          extracted={extracted}
          answer={forgivenessAnswer}
          onAnswerChange={setForgivenessAnswer}
          onSubmit={submitForgivenessAnswer}
          onSkip={() => setPhase("preview")}
        />
      )}
      {phase === "preview" && extracted && (
        <PreviewView
          extracted={extracted}
          transcript={transcript}
          error={error}
          busyAction={busyAction}
          onCreateJob={createJobFromExtraction}
          onCreateInvoice={createInvoiceFromExtraction}
          onCreateQuote={createQuoteFromExtraction}
          onReset={reset}
        />
      )}
    </div>
  );
}

function IdleView({
  onStart,
  onDemoCapture,
  error,
  busy,
}: {
  onStart: () => void;
  onDemoCapture: () => void;
  error: string | null;
  busy: boolean;
}) {
  return (
    <Card padding={26}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <Mahi size={88} mood="happy" />
        <div style={{ textAlign: "center" }}>
          <Eyebrow>Voice to job, quote, or invoice</Eyebrow>
          <h2
            style={{
              margin: "6px 0 4px",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: -0.5,
            }}
          >
            Tell me about the job
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              color: "var(--muted)",
              lineHeight: 1.5,
              maxWidth: 320,
            }}
          >
            Tap the mic, speak naturally, then tap to finish.
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          aria-label="Start recording"
          style={{
            width: 144,
            height: 144,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: "var(--ink)",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "0 18px 32px rgba(11,18,32,0.28), 0 0 0 6px rgba(11,18,32,0.06)",
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="3" width="6" height="12" rx="3" fill="#fff" />
            <path
              d="M5 11a7 7 0 0014 0M12 18v3"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <Link
          href="#"
          onClick={(e) => e.preventDefault()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            height: 48,
            padding: "0 18px",
            borderRadius: 12,
            border: "1px solid var(--border-strong)",
            color: "var(--ink)",
            background: "#fff",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Snap a receipt instead
        </Link>

        <button
          type="button"
          onClick={onDemoCapture}
          disabled={busy}
          style={{
            height: 48,
            padding: "0 18px",
            borderRadius: 12,
            border: "none",
            color: "#fff",
            background: "var(--accent)",
            fontSize: 14,
            fontWeight: 700,
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? "Creating demo..." : "Try demo capture"}
        </button>

        {error && (
          <p
            style={{
              fontSize: 13,
              color: "#991B1B",
              background: "#FEE2E2",
              padding: "8px 12px",
              borderRadius: 10,
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}

function RecordingView({
  elapsed,
  onStop,
}: {
  elapsed: number;
  onStop: () => void;
}) {
  return (
    <Card padding={24}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Mahi size={64} mood="listening" glow />
        <div
          className="tabular-nums"
          style={{
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: -1,
            color: "var(--ink)",
          }}
        >
          {formatTimer(elapsed)}
        </div>

        <div
          aria-hidden
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            height: 48,
            width: "100%",
          }}
        >
          {Array.from({ length: WAVE_BARS }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: 36,
                borderRadius: 999,
                background: "var(--accent)",
                transformOrigin: "center",
                animation: `agBar 700ms ease-in-out ${(i % 8) * 60}ms infinite`,
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={onStop}
          aria-label="Stop recording"
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: "var(--ink)",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "var(--accent)",
              display: "inline-block",
            }}
          />
        </button>
        <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
          Tap to finish
        </p>
      </div>
    </Card>
  );
}

function ProcessingView({
  phase,
  transcript,
}: {
  phase: "uploading" | "extracting";
  transcript: string;
}) {
  const isExtracting = phase === "extracting";
  return (
    <Card padding={22}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Mahi size={72} mood={isExtracting ? "thinking" : "happy"} />
        <div style={{ textAlign: "center" }}>
          <Eyebrow>{isExtracting ? "Ghostly is reading the note" : "Talking to Ghostly"}</Eyebrow>
          <h2
            style={{
              margin: "6px 0 0",
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: -0.3,
            }}
          >
            {isExtracting
              ? "Reading your note…"
              : "Sending your voice note to Ghostly..."}
          </h2>
        </div>

        <div
          aria-hidden
          style={{ display: "inline-flex", gap: 6, marginTop: 4 }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--ink)",
                animation: `agDot 1s ease-in-out ${i * 150}ms infinite`,
              }}
            />
          ))}
        </div>

        {isExtracting && transcript && (
          <div
            style={{
              marginTop: 8,
              padding: 14,
              borderRadius: 14,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              fontSize: 13.5,
              color: "var(--ink)",
              lineHeight: 1.5,
              alignSelf: "stretch",
            }}
          >
            <Eyebrow style={{ marginBottom: 6 }}>Transcript</Eyebrow>
            {transcript}
          </div>
        )}
      </div>
    </Card>
  );
}

function ForgivenessView({
  extracted,
  answer,
  onAnswerChange,
  onSubmit,
  onSkip,
}: {
  extracted: ExtractVoiceResponse;
  answer: string;
  onAnswerChange: (v: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const confidencePct = Math.round(extracted.confidence * 100);
  const rows: { label: string; value: string }[] = [
    { label: "Client", value: extracted.client_name ?? "—" },
    { label: "Location", value: extracted.job_location ?? "—" },
    {
      label: "Labour",
      value:
        extracted.labour_hours != null ? `${extracted.labour_hours} h` : "—",
    },
    { label: "Description", value: extracted.job_description ?? "—" },
  ];

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--radius-card-lg)",
        border: "1px solid var(--amber-border)",
        background:
          "linear-gradient(180deg, var(--amber-bg) 0%, #FFFBEB 60%, #fff 100%)",
        padding: 22,
      }}
    >
      <div style={{ position: "absolute", top: 14, right: 14, transform: "rotate(8deg)" }}>
        <Mahi size={68} mood="thinking" color="#FFFFFF" accent="#92400E" />
      </div>

      <div style={{ maxWidth: "70%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <MahiTag color="var(--amber-fg-dark)" accent="var(--amber-fg)" />
        </div>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: -0.4,
            color: "var(--amber-fg-dark)",
            lineHeight: 1.2,
          }}
        >
          Some details need confirming before this can be sent.
        </h2>
        <p
          style={{
            margin: "6px 0 12px",
            fontSize: 13.5,
            fontStyle: "italic",
            color: "var(--amber-fg)",
          }}
        >
          I'd rather check than guess.
        </p>
        <Pill tone="amber">{confidencePct}% confident</Pill>
      </div>

      {/* What I picked up */}
      <div
        style={{
          marginTop: 18,
          background: "rgba(255,255,255,0.7)",
          border: "1px solid var(--amber-border)",
          borderRadius: 14,
          padding: 14,
        }}
      >
        <Eyebrow style={{ color: "var(--amber-fg)", marginBottom: 8 }}>
          What I picked up
        </Eyebrow>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rows.map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 14,
                fontSize: 13.5,
              }}
            >
              <span style={{ color: "var(--amber-fg)", fontWeight: 600 }}>
                {row.label}
              </span>
              <span
                style={{
                  color: "var(--amber-fg-dark)",
                  fontWeight: 600,
                  textAlign: "right",
                }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Still need */}
      {extracted.missing_fields.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Eyebrow style={{ color: "var(--amber-fg)", marginBottom: 6 }}>
            Still need
          </Eyebrow>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {extracted.missing_fields.map((field) => (
              <span
                key={field}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  height: 26,
                  padding: "0 10px",
                  borderRadius: 999,
                  background: "var(--amber-bg-hi)",
                  color: "var(--amber-fg-dark)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {fieldLabel(field)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick question */}
      {extracted.clarifying_question && (
        <div
          style={{
            marginTop: 16,
            background: "#fff",
            borderRadius: 14,
            border: "1px solid var(--border)",
            padding: 14,
            boxShadow: "var(--shadow-card)",
          }}
        >
          <Eyebrow style={{ marginBottom: 8 }}>Quick question</Eyebrow>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 14.5,
              fontWeight: 600,
              color: "var(--ink)",
              lineHeight: 1.4,
            }}
          >
            {extracted.clarifying_question}
          </p>
          <input
            type="text"
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            placeholder="Type your answer"
            style={{
              width: "100%",
              height: 44,
              padding: "0 12px",
              borderRadius: 10,
              border: "1px solid var(--border-strong)",
              fontSize: 14,
              background: "var(--bg)",
              color: "var(--ink)",
              boxSizing: "border-box",
            }}
          />
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <PrimaryButton full onClick={onSubmit} disabled={!answer.trim()}>
              Submit answer
            </PrimaryButton>
            <button
              type="button"
              onClick={onSkip}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "underline",
                padding: 4,
              }}
            >
              Skip and proceed anyway
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function PreviewView({
  extracted,
  transcript,
  error,
  busyAction,
  onCreateJob,
  onCreateInvoice,
  onCreateQuote,
  onReset,
}: {
  extracted: ExtractVoiceResponse;
  transcript: string;
  error: string | null;
  busyAction: BusyAction | null;
  onCreateJob: () => void;
  onCreateInvoice: () => void;
  onCreateQuote: () => void;
  onReset: () => void;
}) {
  const confidencePct = Math.round(extracted.confidence * 100);
  const intent = deriveCaptureIntent(transcript);
  const showJobAction = intent === "job" || intent === "complete_existing_job" || intent === "mark_existing_paid";
  const showInvoiceAction = intent === "invoice" || intent === "job";
  const showQuoteAction = intent === "quote" || intent === "job";
  const jobActionLabel =
    intent === "mark_existing_paid"
      ? "Mark paid"
      : intent === "complete_existing_job"
        ? "Update job"
        : "Create job";
  const jobBusyLabel =
    intent === "mark_existing_paid"
      ? "Updating..."
      : intent === "complete_existing_job"
        ? "Updating..."
        : "Creating...";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          padding: "12px 16px",
          borderRadius: 14,
          background: "var(--emerald-bg)",
          color: "var(--emerald-fg)",
          fontSize: 13.5,
          fontWeight: 600,
          animation: "agSlide 320ms ease-out",
        }}
      >
        Got it — confidence is {confidencePct}%.
      </div>

      <Card padding={18}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Eyebrow>Job draft</Eyebrow>
          <Pill tone="emerald">High confidence</Pill>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
          <Row label="Client" value={extracted.client_name ?? "—"} />
          <Row label="Location" value={extracted.job_location ?? "—"} />
          <Row
            label="Labour"
            value={
              extracted.labour_hours != null
                ? `${extracted.labour_hours} h`
                : "—"
            }
          />
          {extracted.materials.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <Eyebrow style={{ marginBottom: 6 }}>Materials</Eyebrow>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {extracted.materials.map((m, i) => (
                  <div
                    key={`${m.name}-${i}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13.5,
                    }}
                  >
                    <span>{m.name}</span>
                    <span className="tabular-nums" style={{ color: "var(--muted)" }}>
                      {m.cost != null ? `$${m.cost.toFixed(2)}` : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {extracted.total_estimate != null && (
            <div
              style={{
                marginTop: 8,
                paddingTop: 12,
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 800,
                fontSize: 17,
              }}
            >
              <span>Estimate</span>
              <span className="tabular-nums">
                ${extracted.total_estimate.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {transcript && (
        <Card padding={14}>
          <Eyebrow style={{ marginBottom: 6 }}>Transcript</Eyebrow>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            {transcript}
          </p>
        </Card>
      )}

      {error && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 12,
            background: "#FEE2E2",
            color: "#991B1B",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 14,
            border: "1px solid var(--border-strong)",
            background: "#fff",
            color: "var(--ink)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Record another
        </button>
        {showJobAction && (
          <button
            type="button"
            onClick={onCreateJob}
            disabled={busyAction !== null}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: "1px solid var(--border-strong)",
              background: "#fff",
              color: "var(--ink)",
              fontSize: 15,
              fontWeight: 600,
              cursor: busyAction ? "not-allowed" : "pointer",
              opacity: busyAction ? 0.7 : 1,
            }}
          >
            {busyAction === "job" ? jobBusyLabel : jobActionLabel}
          </button>
        )}
        {showInvoiceAction && (
          <button
            type="button"
            onClick={onCreateInvoice}
            disabled={busyAction !== null}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: busyAction ? "not-allowed" : "pointer",
              opacity: busyAction ? 0.7 : 1,
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            {busyAction === "invoice" ? "Drafting..." : "Create invoice"}
          </button>
        )}
        {showQuoteAction && (
          <button
            type="button"
            onClick={onCreateQuote}
            disabled={busyAction !== null}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              border: "none",
              background: "#1A5155",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: busyAction ? "not-allowed" : "pointer",
              opacity: busyAction ? 0.7 : 1,
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            {busyAction === "quote" ? "Drafting..." : "Create quote"}
          </button>
        )}
        <Link
          href="/jobs"
          style={{
            flex: 1,
            height: 52,
            borderRadius: 14,
            background: "var(--ink)",
            color: "#fff",
            fontSize: 15,
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          Looks good →
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        fontSize: 13.5,
      }}
    >
      <span style={{ color: "var(--muted)", fontWeight: 600 }}>{label}</span>
      <span
        style={{
          color: "var(--ink)",
          fontWeight: 600,
          textAlign: "right",
          maxWidth: "65%",
        }}
      >
        {value}
      </span>
    </div>
  );
}
