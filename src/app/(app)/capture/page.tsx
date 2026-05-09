import Link from "next/link";
import { GhostlyCapture } from "@/components/capture/GhostlyCapture";
import { Mahi } from "@/components/mahi";
import { GhostlyFrame } from "@/components/shell/GhostlyFrame";
import { Card, Eyebrow, Pill } from "@/components/ui/primitives";

export default function CapturePage() {
  return (
    <GhostlyFrame
      eyebrow="Capture zone"
      title="Speak once. Let Ghostly sort the admin."
      description="Built for the van moment. Record the job while it is still fresh, then let Ghostly turn that messy note into a job, quote, invoice draft, and follow-up."
      aside={<CaptureAside />}
    >
      <div style={{ display: "grid", gap: 18 }}>
        <Card padding={20}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
              gap: 12,
            }}
          >
            <CaptureMetric label="Target time" value="< 2 min" helper="From voice note to ready draft" />
            <CaptureMetric label="Clarifying style" value="Smart prompts" helper="Only when details are truly missing" />
            <CaptureMetric label="Capture modes" value="Voice + receipt" helper="Start with voice, add receipt after" />
          </div>
        </Card>

        <GhostlyCapture />
      </div>
    </GhostlyFrame>
  );
}

function CaptureMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid var(--border)",
        background: "#fff",
        padding: 16,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--muted)" }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 26, fontWeight: 800, letterSpacing: -0.7 }}>
        {value}
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--muted)" }}>
        {helper}
      </p>
    </div>
  );
}

function CaptureAside() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card padding={18}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Mahi size={52} mood="listening" hardhat />
          <div>
            <Eyebrow>Ghostly is listening</Eyebrow>
            <h2 style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>
              Designed for messy notes
            </h2>
          </div>
        </div>
        <p style={{ margin: "14px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>
          Speak naturally. Ghostly should extract what it knows, leave gaps visible, and ask short clarifying questions instead of pretending.
        </p>
      </Card>

      <Card padding={18}>
        <Eyebrow>Demo script</Eyebrow>
        <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.65, color: "var(--ink)" }}>
          &ldquo;Finished leak repair for Sarah at 25 Queen Street. Two hours labour. Used sealant, pipe fitting, replacement valve. Materials around $75. Job tested and complete.&rdquo;
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <Pill tone="accent">Invoice draft</Pill>
          <Pill tone="soft">Receipt attach</Pill>
          <Pill tone="emerald">Job complete message</Pill>
        </div>
      </Card>

      <Card padding={18}>
        <Eyebrow>Fast links</Eyebrow>
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <QuickLink href="/today" title="Back to Dashboard" body="See reminders and draft actions after capture." />
          <QuickLink href="/assistant" title="Ask the assistant" body="Query jobs, cash, invoices, and next steps." />
        </div>
      </Card>
    </div>
  );
}

function QuickLink({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        borderRadius: 16,
        border: "1px solid var(--border)",
        padding: 14,
        color: "inherit",
        display: "block",
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
      <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--muted)" }}>
        {body}
      </p>
    </Link>
  );
}
