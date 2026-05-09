import { Mahi } from "@/components/mahi";
import { MentalLoadMeter } from "@/components/wellbeing/MentalLoadMeter";
import { WorkloadForecast } from "@/components/wellbeing/WorkloadForecast";
import { WindDown } from "@/components/wellbeing/WindDown";

export default function WellbeingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-desktop)",
        color: "var(--ink)",
        padding: "24px 28px 40px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Page header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <Mahi size={48} mood="happy" accent="var(--mahi-yellow)" />
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: "var(--muted)",
                marginBottom: 3,
              }}
            >
              Ghostly
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: -0.6,
                lineHeight: 1.1,
              }}
            >
              Your well-being
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.4 }}>
              Two different signals — admin stress and field hours — so you can manage both separately.
            </p>
          </div>
        </div>

        {/* Explainer strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <ExplainerChip
            color="var(--accent)"
            title="Mental Load"
            body="Tracks your admin burden — overdue invoices, unsent drafts, unlinked receipts. High load means paperwork is piling up."
          />
          <ExplainerChip
            color="#F59E0B"
            title="Workload Forecast"
            body="Tracks your field hours — jobs in pipeline vs your weekly limit. At risk means you're heading toward burnout."
          />
        </div>

        {/* Two-column meters */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 22,
          }}
        >
          <MentalLoadMeter />
          <WorkloadForecast />
        </div>

        {/* Wind Down — full width */}
        <WindDown />
      </div>
    </main>
  );
}

function ExplainerChip({
  color,
  title,
  body,
}: {
  color: string;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        background: "#fff",
        border: "1px solid var(--border)",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: color,
          marginTop: 4,
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.45 }}>{body}</div>
      </div>
    </div>
  );
}
