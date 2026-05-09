import { CaptureHub } from "@/components/capture/CaptureHub";

export default function CapturePage() {
  return (
    <main className="capture-page min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(180deg,_#f8fafc_0%,_#eef6f2_100%)] px-4 py-8">
      <div className="capture-container mx-auto max-w-xl space-y-6">
        <div className="capture-page-header space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Admin Ghost Capture
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            Speak or snap. We'll hold the admin.
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            Start with voice capture so a tradie can finish the job, speak once
            in the van, and move straight into draft creation.
          </p>
        </div>

        <CaptureHub />
      </div>
    </main>
  );
}
