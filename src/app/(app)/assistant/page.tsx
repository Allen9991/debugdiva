import { randomUUID } from "crypto";
import { ChatPanel } from "@/components/brain/ChatPanel";
import { GhostlyFrame } from "@/components/shell/GhostlyFrame";
import { Card, Eyebrow, Pill } from "@/components/ui/primitives";
import type { ChatInvoice, ChatJob } from "@/lib/claude/schemas";
import { getBaseUrl } from "@/lib/server/base-url";

async function getAssistantContext() {
  const baseUrl = await getBaseUrl();

  const [jobsRes, invoicesRes] = await Promise.all([
    fetch(`${baseUrl}/api/jobs`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/output/invoices`, { cache: "no-store" }),
  ]);

  const jobsJson = jobsRes.ok ? await jobsRes.json() : { jobs: [] };
  const invoicesJson = invoicesRes.ok ? await invoicesRes.json() : { invoices: [] };

  return {
    recent_jobs: (jobsJson.jobs ?? []) as ChatJob[],
    pending_invoices: (invoicesJson.invoices ?? []) as ChatInvoice[],
  };
}

export default async function AssistantPage() {
  const context = await getAssistantContext();
  const conversationId = `assistant-${randomUUID()}`;

  return (
    <GhostlyFrame
      eyebrow="AI assistant"
      title="Ask about jobs, invoices, and what needs doing next."
      description="This is the Ghostly brain in chat form. It should answer with context, stay grounded in the current records, and keep the tone useful rather than corporate."
      aside={<AssistantAside context={context} />}
    >
      <div style={{ display: "grid", gap: 18 }}>
        <Card padding={18}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Pill tone="soft">What&rsquo;s outstanding?</Pill>
            <Pill tone="soft">Draft a follow-up for Sarah</Pill>
            <Pill tone="soft">Which invoices are overdue?</Pill>
          </div>
        </Card>

        <div style={{ minHeight: 620 }}>
          <ChatPanel
            conversationId={conversationId}
            context={context}
            className="h-[620px]"
          />
        </div>
      </div>
    </GhostlyFrame>
  );
}

function AssistantAside({
  context,
}: {
  context: {
    recent_jobs: ChatJob[];
    pending_invoices: ChatInvoice[];
  };
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card padding={18}>
        <Eyebrow>Context loaded</Eyebrow>
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <StatRow label="Recent jobs" value={String(context.recent_jobs.length)} />
          <StatRow label="Pending invoices" value={String(context.pending_invoices.length)} />
        </div>
      </Card>

      <Card padding={18}>
        <Eyebrow>What good looks like</Eyebrow>
        <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>
          The assistant should reference real jobs, avoid made-up details, and suggest the next useful action when it can see one.
        </p>
      </Card>
    </div>
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
        border: "1px solid var(--border)",
        padding: "12px 14px",
      }}
    >
      <span style={{ fontSize: 14, color: "var(--muted)" }}>{label}</span>
      <span className="tabular-nums" style={{ fontSize: 18, fontWeight: 800 }}>
        {value}
      </span>
    </div>
  );
}
