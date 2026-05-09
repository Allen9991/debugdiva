import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";

export const runtime = "nodejs";

type ChatJob = {
  id: string;
  client_name?: string | null;
  description: string;
  status: string;
  location?: string | null;
};

type ChatInvoice = {
  id: string;
  job_id: string;
  client_name?: string | null;
  total: number;
  status: string;
};

type ChatRequestBody = {
  message?: string;
  conversation_id?: string;
  context?: {
    recent_jobs?: ChatJob[];
    pending_invoices?: ChatInvoice[];
  };
};

type SuggestedAction = { label: string; action: string };

function buildFallback(
  message: string,
  context: { recent_jobs: ChatJob[]; pending_invoices: ChatInvoice[] },
): { response: string; suggested_actions: SuggestedAction[] } {
  const lower = message.toLowerCase().replace(/\bisthere\b/g, "is there");
  const draft = context.pending_invoices.filter((i) => i.status === "draft");
  const overdue = context.pending_invoices.filter((i) => i.status === "sent");
  const completed = context.recent_jobs.filter((j) => j.status === "completed");
  const wantsInvoice = /\b(invoic\w*|inv)\b/.test(lower);

  if (wantsInvoice) {
    const stopWords = new Set(["do", "we", "have", "an", "a", "the", "invoice", "invoices", "invoic", "invocie", "inv", "for", "is", "there", "any", "bro", "answer", "me", "or", "no"]);
    const terms = lower
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((term) => term.length > 1 && !stopWords.has(term) && !term.startsWith("invoic"));
    const matchesInvoice = (invoice: ChatInvoice) =>
      terms.length > 0 &&
      terms.some((term) => (invoice.client_name ?? "").toLowerCase().includes(term));
    const invoice = context.pending_invoices.find(matchesInvoice);
    if (invoice) {
      return {
        response:
          "Yes - I found an invoice for " +
          (invoice.client_name ?? "that client") +
          ". It is currently " +
          invoice.status +
          " for $" +
          invoice.total.toFixed(2) +
          ".",
        suggested_actions: [{ label: "Open invoice", action: "view_invoice:" + invoice.id }],
      };
    }
    if (terms.length > 0) {
      const requested = terms.join(" ").toUpperCase();
      const knownInvoiceNames = context.pending_invoices
        .map((i) => i.client_name)
        .filter((name): name is string => Boolean(name && name !== "Unknown client"));
      return {
        response:
          "I can't find an invoice for " +
          requested +
          " in the current demo records. I found invoices for: " +
          (knownInvoiceNames.join(", ") || "none") +
          ".",
        suggested_actions: [{ label: "Open invoices", action: "open:/invoices" }],
      };
    }
  }

  if (/outstand|overdue|owe|chase|unpaid/.test(lower)) {
    if (overdue.length === 0 && draft.length === 0) {
      return {
        response:
          "Nothing outstanding right now - invoices are all sent or paid. Nice spot to be in.",
        suggested_actions: [{ label: "Open invoices", action: "open:/invoices" }],
      };
    }
    const lines: string[] = [];
    for (const i of overdue) {
      lines.push(
        (i.client_name ?? "client") +
          " owes $" +
          i.total.toFixed(2) +
          " (sent, awaiting payment)",
      );
    }
    for (const i of draft) {
      lines.push(
        (i.client_name ?? "client") +
          " has a draft of $" +
          i.total.toFixed(2) +
          " ready to send",
      );
    }
    const actions: SuggestedAction[] = [];
    if (overdue[0]) {
      actions.push({
        label: "Chase " + (overdue[0].client_name ?? "payment"),
        action: "view_invoice:" + overdue[0].id,
      });
    }
    if (draft[0]) {
      actions.push({
        label: "Send " + (draft[0].client_name ?? "draft"),
        action: "view_invoice:" + draft[0].id,
      });
    }
    return {
      response: "Here's what's open: " + lines.join("; ") + ".",
      suggested_actions: actions,
    };
  }

  if (/draft/.test(lower) && completed.length > 0) {
    const job = completed[0];
    return {
      response:
        (job.client_name ?? "Client") +
        " is ready for an invoice - " +
        job.description.slice(0, 80),
      suggested_actions: [
        {
          label: "Draft invoice for " + (job.client_name ?? "job"),
          action: "draft_invoice:job_id=" + job.id,
        },
        { label: "Open jobs", action: "open:/jobs" },
      ],
    };
  }

  if (/quote/.test(lower)) {
    return {
      response:
        "I can draft a quote from any open job - just point me at one and I'll size it up.",
      suggested_actions: [
        { label: "Open quotes", action: "open:/quotes" },
        { label: "Open jobs", action: "open:/jobs" },
      ],
    };
  }

  if (/hello|hi|kia ora|how/.test(lower)) {
    return {
      response:
        "Hi - you've got " +
        context.recent_jobs.length +
        " jobs and " +
        context.pending_invoices.length +
        " invoices on file. What's next on the list?",
      suggested_actions: [
        { label: "What's outstanding?", action: "open:/invoices" },
        { label: "Open dashboard", action: "open:/today" },
      ],
    };
  }

  return {
    response:
      "Got it. I'll keep that in mind. Want me to surface anything specific from your jobs or invoices?",
    suggested_actions: [
      { label: "Open jobs", action: "open:/jobs" },
      { label: "Open invoices", action: "open:/invoices" },
    ],
  };
}

export async function POST(request: Request) {
  console.log("[POST /api/brain/chat] called");
  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    const errResp = { error: "Invalid JSON body" };
    console.log("[POST /api/brain/chat] returning:", errResp);
    return NextResponse.json(errResp, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  const conversation_id = body.conversation_id ?? "anon";
  const context = {
    recent_jobs:
      body.context?.recent_jobs?.length
        ? body.context.recent_jobs
        : demoStore.jobs.all().map((job) => ({
            id: job.id,
            client_name: job.client_name,
            description: job.description,
            status: job.status,
            location: job.location,
          })),
    pending_invoices:
      body.context?.pending_invoices?.length
        ? body.context.pending_invoices
        : demoStore.invoices.all().map((invoice) => ({
            id: invoice.id,
            job_id: invoice.job_id,
            client_name: invoice.client_name,
            total: invoice.total,
            status: invoice.status,
          })),
  };

  console.log(
    "[POST /api/brain/chat] called with: conv_id=",
    conversation_id,
    "msg_len=",
    message.length,
  );

  if (!message) {
    const errResp = { error: "message is required" };
    console.log("[POST /api/brain/chat] returning:", errResp);
    return NextResponse.json(errResp, { status: 400 });
  }

  const response = buildFallback(message, context);
  console.log(
    "[POST /api/brain/chat] returning response with",
    response.suggested_actions.length,
    "suggested actions",
  );
  return NextResponse.json(response);
}
