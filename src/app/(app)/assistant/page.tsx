import { randomUUID } from "crypto";
import { AssistantChat } from "@/components/brain/AssistantChat";
import { Card, Eyebrow } from "@/components/ui/primitives";
import { demoStore } from "@/lib/demo-store";

type ChatJob = {
  id: string;
  client_name: string;
  location: string;
  description: string;
  status: string;
  labour_hours: number;
};

type ChatInvoice = {
  id: string;
  job_id: string;
  client_name: string;
  total: number;
  status: string;
  due_date: string;
};

async function getAssistantContext() {
  console.log("[AssistantPage] loading context (jobs + invoices)");
  const recent_jobs: ChatJob[] = demoStore.jobs.all().map((j) => ({
    id: j.id,
    client_name: j.client_name,
    location: j.location,
    description: j.description,
    status: j.status,
    labour_hours: j.labour_hours,
  }));
  const pending_invoices: ChatInvoice[] = demoStore.invoices.all().map((inv) => ({
    id: inv.id,
    job_id: inv.job_id,
    client_name: inv.client_name,
    total: inv.total,
    status: inv.status,
    due_date: inv.due_date,
  }));

  console.log(
    "[AssistantPage] context loaded - jobs:",
    recent_jobs.length,
    "invoices:",
    pending_invoices.length,
  );
  return { recent_jobs, pending_invoices };
}

export default async function AssistantPage() {
  const context = await getAssistantContext();
  const conversationId = "assistant-" + randomUUID();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg, #F8FAFC)",
        color: "var(--ink, #0B1220)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "28px 16px",
          display: "grid",
          gap: 18,
          gridTemplateColumns: "1fr 320px",
        }}
      >
        <div style={{ display: "grid", gap: 18 }}>
          <header>
            <Eyebrow>AI assistant</Eyebrow>
            <h1
              style={{
                margin: "6px 0 0",
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: -0.5,
              }}
            >
              Ask about jobs, invoices, and what needs doing next.
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 13.5,
                color: "var(--muted, #64748B)",
                lineHeight: 1.5,
              }}
            >
              Suggested actions in replies are clickable - they navigate to the matching record.
            </p>
          </header>

          <div style={{ minHeight: 620 }}>
            <AssistantChat conversationId={conversationId} context={context} />
          </div>
        </div>

        <aside style={{ display: "grid", gap: 16 }}>
          <Card padding={18}>
            <Eyebrow>Context loaded</Eyebrow>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <StatRow label="Recent jobs" value={String(context.recent_jobs.length)} />
              <StatRow label="Pending invoices" value={String(context.pending_invoices.length)} />
            </div>
          </Card>

          <Card padding={18}>
            <Eyebrow>What good looks like</Eyebrow>
            <p
              style={{
                margin: "10px 0 0",
                fontSize: 14,
                lineHeight: 1.6,
                color: "var(--muted, #64748B)",
              }}
            >
              The assistant references real jobs, avoids made-up details, and suggests the next useful action when it can see one.
            </p>
          </Card>
        </aside>
      </div>
    </main>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        borderRadius: 14,
        border: "1px solid var(--border, #E2E8F0)",
        padding: "12px 14px",
      }}
    >
      <span style={{ fontSize: 14, color: "var(--muted, #64748B)" }}>{label}</span>
      <span className="tabular-nums" style={{ fontSize: 18, fontWeight: 800 }}>
        {value}
      </span>
    </div>
  );
}
