import { Card, Eyebrow } from "@/components/ui/primitives";
import { WorkPreferences } from "@/components/wellbeing/WorkPreferences";

export default function SettingsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #F8FAFC)", color: "var(--ink, #0B1220)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "28px 16px" }}>
        <Card padding={22}>
          <Eyebrow>Demo settings</Eyebrow>
          <h1 style={{ margin: "6px 0 8px", fontSize: 26, fontWeight: 800 }}>
            MVP demo mode
          </h1>
          <p style={{ margin: 0, color: "var(--muted, #64748B)", lineHeight: 1.6 }}>
            Authentication is bypassed for now. Demo data uses a $90 hourly rate
            and NZ GST so capture, jobs, quotes, and invoices can be shown end to end.
          </p>
        </Card>

        <WorkPreferences />
      </div>
    </main>
  );
}
