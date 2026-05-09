"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExtractionPreview } from "@/components/brain/ExtractionPreview";
import { ForgivenessMode } from "@/components/brain/ForgivenessMode";
import type { ExtractVoiceResponse } from "@/lib/claude/schemas";

const CONFIDENCE_THRESHOLD = 0.7;
// [PENDING: real job creation] Until the capture flow creates a job in
// the DB, the approve button hands off to the demo job seeded in
// /api/output/invoice/draft (Sarah at 25 Queen Street).
const DEMO_JOB_ID = "33333333-3333-3333-3333-333333333333";

// Demo extraction so the page renders end-to-end before Freddie's
// VoiceRecorder is wired up. Defaults to a *low-confidence* result so
// the Forgiveness Mode flow is the first thing on screen — that's the
// feature being showcased. Answering the clarifying question swaps in
// a high-confidence extraction and reveals the standard preview.
const MOCK_EXTRACTION: ExtractVoiceResponse = {
  client_name: "Sarah",
  job_location: null,
  labour_hours: 2,
  materials: [
    { name: "miscellaneous parts/materials", cost: null, quantity: null },
  ],
  job_description: "Leak repair (type unspecified)",
  total_estimate: null,
  missing_fields: [
    "job_location",
    "materials.cost",
    "materials.quantity",
    "labour_rate",
  ],
  clarifying_question: "What's Sarah's address or suburb?",
  confidence: 0.45,
};

type Stage = "review" | "approved";

export default function CapturePage() {
  const router = useRouter();
  const [extraction, setExtraction] =
    useState<ExtractVoiceResponse>(MOCK_EXTRACTION);
  const [originalTranscript, setOriginalTranscript] = useState<string>(
    "Finished leak repair for Sarah at 25 Queen Street. Two hours labour. Used sealant, pipe fitting, and a replacement valve. Materials cost around $75. Job tested and complete.",
  );
  const [captureId, setCaptureId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("review");
  const [forceProceed, setForceProceed] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [justBoosted, setJustBoosted] = useState(false);

  const lowConfidence = extraction.confidence < CONFIDENCE_THRESHOLD;
  const showForgiveness = stage === "review" && lowConfidence && !forceProceed;

  const handleApprove = () => {
    setStage("approved");
    // Hand off to Ilan's invoice draft flow. /invoices/[id] fetches a fresh
    // draft via POST /api/output/invoice/draft and renders InvoiceDraftView.
    router.push(`/invoices/${DEMO_JOB_ID}`);
  };

  const handleEdit = () => {
    // [PENDING: open edit modal — out of scope for brain zone]
    console.log("edit details", extraction);
  };

  const handleSkipForgiveness = () => {
    setForceProceed(true);
  };

  // Re-extract by appending the user's answer to the original transcript
  // and POSTing /api/brain/extract again. Falls back to a local patch when
  // there is no captureId (mock-data flow).
  const handleAnswerQuestion = async (answer: string) => {
    setIsReExtracting(true);
    setJustBoosted(false);

    const augmentedTranscript =
      `${originalTranscript.trim()}\n\nAdditional info: ${answer.trim()}`.trim();

    try {
      if (!captureId) {
        // Mock flow — Freddie hasn't wired a real capture_id yet.
        await new Promise((r) => setTimeout(r, 500));
        const next: ExtractVoiceResponse = {
          ...extraction,
          missing_fields: [],
          clarifying_question: null,
          confidence: Math.min(1, extraction.confidence + 0.25),
        };
        setExtraction(next);
        setOriginalTranscript(augmentedTranscript);
        if (next.confidence >= CONFIDENCE_THRESHOLD) setJustBoosted(true);
        return;
      }

      // [PENDING: real re-extract — when capture_id is wired up, the right
      // pattern is to update the captures.raw_text on the row and re-POST.
      // For now we just call /api/brain/extract again on the same id,
      // which will hit the dev cache. Replace with a row-update once the
      // shell zone exposes a way to mutate captures.]
      const res = await fetch("/api/brain/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capture_id: captureId }),
      });
      if (!res.ok) throw new Error(`extract failed (${res.status})`);
      const data = (await res.json()) as {
        extracted: ExtractVoiceResponse;
      };
      setExtraction(data.extracted);
      setOriginalTranscript(augmentedTranscript);
      if (data.extracted.confidence >= CONFIDENCE_THRESHOLD) {
        setJustBoosted(true);
      }
    } catch (err) {
      console.error("[capture] re-extract failed:", err);
    } finally {
      setIsReExtracting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-md mx-auto space-y-4">
        <header className="px-1">
          <h1 className="text-xl font-bold text-slate-900">Capture a job</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Speak the details, snap a receipt, and I&rsquo;ll sort the rest.
          </p>
        </header>

        {/* VoiceRecorder slot — Freddie's zone */}
        <section
          aria-label="Voice recorder"
          className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-6 text-center"
        >
          <p className="text-sm font-medium text-slate-700">
            🎙️ Voice recorder
          </p>
          <p className="text-xs text-slate-500 mt-1">
            [PENDING: Freddie&rsquo;s VoiceRecorder component drops in here]
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Once wired, call <code>setCaptureId(id)</code> after extraction
            completes so the re-extract flow can hit the real endpoint.
          </p>
        </section>

        {/* Confidence boost confirmation — green flash after the user answers */}
        {stage === "review" && justBoosted && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2"
          >
            <span aria-hidden>✅</span>
            <p className="text-sm text-emerald-900">
              Got it — confidence is up to{" "}
              {Math.round(extraction.confidence * 100)}%. Have a look below.
            </p>
          </div>
        )}

        {showForgiveness && (
          <ForgivenessMode
            extraction={extraction}
            isReExtracting={isReExtracting}
            onAnswerQuestion={handleAnswerQuestion}
            onSkip={handleSkipForgiveness}
          />
        )}

        {stage === "review" && !showForgiveness && (
          <ExtractionPreview
            data={extraction}
            onApprove={handleApprove}
            onEdit={handleEdit}
          />
        )}

        {stage === "approved" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <p className="text-2xl">✅</p>
            <p className="text-sm font-semibold text-emerald-900 mt-1">
              Approved — handed to invoice draft
            </p>
            <p className="text-xs text-emerald-700 mt-1">
              [PENDING: Ilan&rsquo;s output zone takes it from here]
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
