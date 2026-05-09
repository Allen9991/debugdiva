"use client";

import { useState } from "react";
import { ExtractionPreview } from "@/components/brain/ExtractionPreview";
import { ClarifyingQuestion } from "@/components/brain/ClarifyingQuestion";
import type { ExtractVoiceResponse } from "@/lib/claude/schemas";

// Demo extraction so the page renders end-to-end before Freddie's
// VoiceRecorder is wired up. Once capture works, this will be replaced
// by the real /api/brain/extract response keyed off capture_id.
const MOCK_EXTRACTION: ExtractVoiceResponse = {
  client_name: "Sarah",
  job_location: "25 Queen Street",
  labour_hours: 2,
  materials: [
    { name: "sealant", cost: 15, quantity: 1 },
    { name: "pipe fitting", cost: 25, quantity: 1 },
    { name: "replacement valve", cost: 35, quantity: 1 },
  ],
  job_description: "Leak repair, tested and complete.",
  total_estimate: null,
  missing_fields: ["labour_rate"],
  clarifying_question:
    "What's your labour rate per hour so I can work out the total for the invoice?",
  confidence: 0.82,
};

export default function CapturePage() {
  const [extraction, setExtraction] =
    useState<ExtractVoiceResponse>(MOCK_EXTRACTION);
  const [clarifyingDismissed, setClarifyingDismissed] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [stage, setStage] = useState<"idle" | "review" | "approved">("review");

  const handleApprove = () => {
    setStage("approved");
    // [PENDING: hand off to Ilan's invoice draft flow]
    // POST /api/output/invoice/draft with extraction
  };

  const handleEdit = () => {
    // [PENDING: open edit modal — out of scope for brain zone]
    console.log("edit details", extraction);
  };

  const handleClarify = async (answer: string) => {
    setIsReExtracting(true);
    try {
      // [PENDING: real re-extract — append answer to capture's raw_text and
      // re-POST /api/brain/extract. For now, just patch the missing field.]
      await new Promise((r) => setTimeout(r, 600));
      setExtraction((prev) => ({
        ...prev,
        missing_fields: prev.missing_fields.filter(
          (f) => f !== "labour_rate",
        ),
        clarifying_question: null,
        confidence: Math.min(1, prev.confidence + 0.1),
      }));
      console.log("clarifying answer:", answer);
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
            For now, the extraction below uses mock data so the review flow
            renders.
          </p>
        </section>

        {stage === "review" && (
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

        {stage === "review" &&
          extraction.clarifying_question &&
          !clarifyingDismissed && (
            <ClarifyingQuestion
              question={extraction.clarifying_question}
              isSubmitting={isReExtracting}
              onSubmit={handleClarify}
              onSkip={() => setClarifyingDismissed(true)}
            />
          )}
      </div>
    </main>
  );
}
