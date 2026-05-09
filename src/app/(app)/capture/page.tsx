import { GhostlyCapture } from "@/components/capture/GhostlyCapture";
import { Eyebrow } from "@/components/ui/primitives";

export default function CapturePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: 48,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <header style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <Eyebrow>Capture</Eyebrow>
          <h1
            style={{
              margin: "8px 0 6px",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: -0.6,
            }}
          >
            Speak or snap. Mahi will hold the admin.
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: "var(--muted)",
              lineHeight: 1.5,
            }}
          >
            Finish the job, talk it through once in the van — Mahi drafts the
            invoice.
          </p>
        </header>

        <GhostlyCapture />
      </div>
    </main>
  );
}
