import { NextResponse } from "next/server";
import { claudeClient, CLAUDE_TIMEOUT_MS } from "@/lib/claude/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CLAUDE_MODEL = "claude-sonnet-4-5";

type CompletedJob = {
  id: string;
  description: string;
  client_name: string | null;
  updated_at: string;
};

type DraftInvoice = {
  id: string;
  total: number | null;
  client_name: string | null;
};

type StaleQuote = {
  id: string;
  total: number | null;
  client_name: string | null;
  created_at: string;
};

type UnlinkedReceipt = {
  id: string;
  store_hint: string | null;
  created_at: string;
};

type SummaryContext = {
  completed_jobs: CompletedJob[];
  draft_invoices: DraftInvoice[];
  stale_quotes: StaleQuote[];
  unlinked_receipts: UnlinkedReceipt[];
};

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function buildSummaryPrompt(context: SummaryContext): string {
  const today = new Date().toISOString().slice(0, 10);

  return `You are Admin Ghost, the AI admin assistant for a NZ tradie. The user is
about to wrap up their day. Write them a short end-of-day check-in.

Today's date: ${today}

CONTEXT (the actual state of their business right now)

Jobs completed today (${context.completed_jobs.length}):
${
  context.completed_jobs.length === 0
    ? "(none)"
    : context.completed_jobs
        .map(
          (j) =>
            `- ${j.client_name ?? "(unknown client)"} — ${j.description.slice(0, 80)}`,
        )
        .join("\n")
}

Draft invoices not yet sent (${context.draft_invoices.length}):
${
  context.draft_invoices.length === 0
    ? "(none)"
    : context.draft_invoices
        .map(
          (i) =>
            `- ${i.client_name ?? "(unknown client)"}${
              i.total != null ? ` — $${i.total}` : ""
            }`,
        )
        .join("\n")
}

Quotes sent more than 3 days ago with no reply (${context.stale_quotes.length}):
${
  context.stale_quotes.length === 0
    ? "(none)"
    : context.stale_quotes
        .map(
          (q) =>
            `- ${q.client_name ?? "(unknown client)"}${
              q.total != null ? ` — $${q.total}` : ""
            } — sent ${q.created_at.slice(0, 10)}`,
        )
        .join("\n")
}

Receipts not linked to a job (${context.unlinked_receipts.length}):
${
  context.unlinked_receipts.length === 0
    ? "(none)"
    : context.unlinked_receipts
        .map(
          (r) =>
            `- ${r.store_hint ?? "receipt"} from ${r.created_at.slice(0, 10)}`,
        )
        .join("\n")
}

YOUR JOB
Write ONE conversational paragraph — warm, casual, NZ tone — like a human
admin assistant doing an end-of-day check-in. Mention the wins, then surface
the loose ends that are worth tackling. Reference clients by name where you
can. Keep it tight: 3–5 sentences max. No bullet points. No headings.
No preamble like "Here's your summary". No sign-off like "Cheers". Just the
paragraph.

If everything is empty (no jobs done, nothing pending), be honest about it
in one short sentence — don't pad.

NEVER invent data. Only mention what's in the context above.

Output ONLY the paragraph text. No JSON, no quotes around it, no markdown.`;
}

export async function GET() {
  const supabase = await createSupabaseServerClient();

  const todayStart = startOfTodayIso();
  const threeDaysAgo = daysAgoIso(3);

  // Run the four queries in parallel.
  const [completedRes, draftRes, staleRes, unlinkedRes] = await Promise.all([
    supabase
      .from("jobs")
      .select("id, description, updated_at, client:clients(name)")
      .eq("status", "completed")
      .gte("updated_at", todayStart),
    supabase
      .from("invoices")
      .select("id, total, job:jobs(client:clients(name))")
      .eq("status", "draft"),
    supabase
      .from("quotes")
      .select("id, total, created_at, job:jobs(client:clients(name))")
      .eq("status", "sent")
      .lt("created_at", threeDaysAgo),
    supabase
      .from("captures")
      .select("id, raw_text, created_at")
      .eq("type", "receipt")
      .is("job_id", null),
  ]);

  const errors = [completedRes, draftRes, staleRes, unlinkedRes]
    .map((r) => r.error)
    .filter(Boolean);
  if (errors.length > 0) {
    console.error("[summary] supabase errors:", errors);
    return NextResponse.json(
      { error: "Failed to load summary data" },
      { status: 503 },
    );
  }

  type JobRow = {
    id: string;
    description: string;
    updated_at: string;
    client: { name: string } | { name: string }[] | null;
  };
  type InvoiceRow = {
    id: string;
    total: number | null;
    job:
      | { client: { name: string } | { name: string }[] | null }
      | { client: { name: string } | { name: string }[] | null }[]
      | null;
  };
  type QuoteRow = InvoiceRow & { created_at: string };
  type CaptureRow = { id: string; raw_text: string | null; created_at: string };

  // Supabase's typed client returns relations as either an object or an array
  // depending on cardinality; normalise to a single optional name.
  const firstClientName = (
    rel:
      | { name: string }
      | { name: string }[]
      | null
      | undefined,
  ): string | null => {
    if (!rel) return null;
    if (Array.isArray(rel)) return rel[0]?.name ?? null;
    return rel.name ?? null;
  };
  const nestedClientName = (
    job:
      | { client: { name: string } | { name: string }[] | null }
      | { client: { name: string } | { name: string }[] | null }[]
      | null
      | undefined,
  ): string | null => {
    if (!job) return null;
    const j = Array.isArray(job) ? job[0] : job;
    return firstClientName(j?.client ?? null);
  };

  const completed_jobs: CompletedJob[] = (
    (completedRes.data ?? []) as JobRow[]
  ).map((j) => ({
    id: j.id,
    description: j.description,
    client_name: firstClientName(j.client),
    updated_at: j.updated_at,
  }));

  const draft_invoices: DraftInvoice[] = (
    (draftRes.data ?? []) as InvoiceRow[]
  ).map((i) => ({
    id: i.id,
    total: i.total,
    client_name: nestedClientName(i.job),
  }));

  const stale_quotes: StaleQuote[] = (
    (staleRes.data ?? []) as QuoteRow[]
  ).map((q) => ({
    id: q.id,
    total: q.total,
    created_at: q.created_at,
    client_name: nestedClientName(q.job),
  }));

  const unlinked_receipts: UnlinkedReceipt[] = (
    (unlinkedRes.data ?? []) as CaptureRow[]
  ).map((c) => ({
    id: c.id,
    store_hint: c.raw_text ? c.raw_text.slice(0, 40) : null,
    created_at: c.created_at,
  }));

  const stats = {
    jobs_completed_today: completed_jobs.length,
    draft_invoices: draft_invoices.length,
    quotes_to_followup: stale_quotes.length,
    unlinked_receipts: unlinked_receipts.length,
  };

  const context: SummaryContext = {
    completed_jobs,
    draft_invoices,
    stale_quotes,
    unlinked_receipts,
  };

  let summary: string;
  try {
    const message = await claudeClient.messages.create(
      {
        model: CLAUDE_MODEL,
        max_tokens: 400,
        system: buildSummaryPrompt(context),
        messages: [
          {
            role: "user",
            content: "Give me my end-of-day check-in.",
          },
        ],
      },
      { timeout: CLAUDE_TIMEOUT_MS },
    );
    summary = "";
    for (const block of message.content) {
      if (block.type === "text" && typeof block.text === "string") {
        summary = block.text.trim();
        break;
      }
    }
    if (!summary) {
      summary = "Nothing else from me today — quiet one.";
    }
  } catch (err) {
    console.error("[summary] claude error:", err);
    return NextResponse.json(
      { error: "AI summary failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    summary,
    stats,
    generated_at: new Date().toISOString(),
  });
}
