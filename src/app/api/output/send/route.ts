import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/format";

type DocumentType = "invoice" | "quote" | "message";

const FROM_ADDRESS = "Admin Ghost <onboarding@resend.dev>";

function isDocumentType(v: unknown): v is DocumentType {
  return v === "invoice" || v === "quote" || v === "message";
}

type LineItem = {
  id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  type?: "labour" | "material";
};

type ClientRow = { name: string | null; email: string | null } | null;
type JobRow = {
  description: string | null;
  location: string | null;
  clients: ClientRow;
} | null;

type InvoiceRow = {
  id: string;
  line_items: LineItem[] | null;
  labour_total: number | string;
  materials_total: number | string;
  gst: number | string;
  total: number | string;
  due_date: string | null;
  jobs: JobRow;
};

type QuoteRow = {
  id: string;
  line_items: LineItem[] | null;
  total: number | string;
  expires_at: string | null;
  jobs: JobRow;
};

type MessageRow = {
  id: string;
  subject: string | null;
  body: string;
  jobs: JobRow;
};

function toNumber(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

function lineItemsHtml(items: LineItem[]) {
  if (!items?.length) return "";
  const rows = items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px dashed #e2e8f0;color:#0B1220;">${escapeHtml(i.description)} × ${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px dashed #e2e8f0;text-align:right;color:#0B1220;font-variant-numeric:tabular-nums;">${formatCurrency(toNumber(i.total))}</td>
      </tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0;">${rows}</table>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailShell(title: string, bodyHtml: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#F8FAFC;font-family:-apple-system,'SF Pro Text','Inter',system-ui,sans-serif;color:#0B1220;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;border:1px solid #E2E8F0;">
    <div style="padding:24px 22px;background:linear-gradient(160deg,#FF5E4D 0%,#C8413B 125%);color:#fff;">
      <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;opacity:0.78;margin-bottom:4px;">Admin Ghost</div>
      <div style="font-size:28px;font-weight:800;letter-spacing:-0.6px;">${escapeHtml(title)}</div>
    </div>
    <div style="padding:22px;">${bodyHtml}</div>
  </div>
</body></html>`;
}

async function buildInvoiceEmail(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, id: string) {
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, line_items, labour_total, materials_total, gst, total, due_date, jobs(description, location, clients(name, email))",
    )
    .eq("id", id)
    .single<InvoiceRow>();

  if (error || !data) throw new Error(error?.message ?? "Invoice not found");

  const job = data.jobs;
  const client = job?.clients ?? null;
  if (!client?.email) throw new Error("Client email is missing on this invoice");

  const total = toNumber(data.total);
  const subtotal = toNumber(data.labour_total) + toNumber(data.materials_total);
  const gst = toNumber(data.gst);
  const dueDate = data.due_date
    ? new Date(data.due_date).toLocaleDateString("en-NZ")
    : "—";

  const html = emailShell(
    `Invoice — ${formatCurrency(total)}`,
    `
    <p style="margin:0 0 8px;font-size:14px;color:#64748B;">Kia ora ${escapeHtml(client.name ?? "")},</p>
    <p style="margin:0 0 16px;font-size:14.5px;line-height:1.55;">Thanks for your work — please find your invoice below.</p>
    ${job?.description ? `<p style="margin:0 0 12px;font-size:13.5px;color:#475569;line-height:1.5;"><strong style="color:#0B1220;">Job:</strong> ${escapeHtml(job.description)}</p>` : ""}
    ${lineItemsHtml(data.line_items ?? [])}
    <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:13.5px;">
      <tr><td style="padding:4px 0;color:#64748B;">Subtotal</td><td style="text-align:right;font-variant-numeric:tabular-nums;">${formatCurrency(subtotal)}</td></tr>
      <tr><td style="padding:4px 0;color:#64748B;">GST (15%)</td><td style="text-align:right;font-variant-numeric:tabular-nums;">${formatCurrency(gst)}</td></tr>
      <tr><td style="padding:10px 0 4px;border-top:2px solid #0B1220;font-weight:800;font-size:16px;">Total (NZD)</td><td style="text-align:right;border-top:2px solid #0B1220;font-weight:800;font-size:16px;font-variant-numeric:tabular-nums;padding-top:10px;">${formatCurrency(total)}</td></tr>
    </table>
    <p style="margin:18px 0 0;font-size:13px;color:#64748B;">Due ${escapeHtml(dueDate)}.</p>
    `,
  );

  return {
    to: client.email,
    subject: `Invoice ${formatCurrency(total)} — Admin Ghost`,
    html,
    text: `Hi ${client.name ?? ""}, your invoice total is ${formatCurrency(total)}, due ${dueDate}.`,
  };
}

async function buildQuoteEmail(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, id: string) {
  const { data, error } = await supabase
    .from("quotes")
    .select(
      "id, line_items, total, expires_at, jobs(description, location, clients(name, email))",
    )
    .eq("id", id)
    .single<QuoteRow>();

  if (error || !data) throw new Error(error?.message ?? "Quote not found");

  const job = data.jobs;
  const client = job?.clients ?? null;
  if (!client?.email) throw new Error("Client email is missing on this quote");

  const total = toNumber(data.total);
  const expires = data.expires_at
    ? new Date(data.expires_at).toLocaleDateString("en-NZ")
    : "—";

  const html = emailShell(
    `Quote — ${formatCurrency(total)}`,
    `
    <p style="margin:0 0 8px;font-size:14px;color:#64748B;">Kia ora ${escapeHtml(client.name ?? "")},</p>
    <p style="margin:0 0 16px;font-size:14.5px;line-height:1.55;">Here's your quote for the job.</p>
    ${job?.description ? `<p style="margin:0 0 12px;font-size:13.5px;color:#475569;line-height:1.5;"><strong style="color:#0B1220;">Job:</strong> ${escapeHtml(job.description)}</p>` : ""}
    ${lineItemsHtml(data.line_items ?? [])}
    <p style="margin:14px 0 0;font-size:16px;font-weight:800;">Total (NZD): ${formatCurrency(total)}</p>
    <p style="margin:8px 0 0;font-size:13px;color:#64748B;">Valid until ${escapeHtml(expires)}.</p>
    `,
  );

  return {
    to: client.email,
    subject: `Quote ${formatCurrency(total)} — Admin Ghost`,
    html,
    text: `Hi ${client.name ?? ""}, your quote is ${formatCurrency(total)}, valid until ${expires}.`,
  };
}

async function buildMessageEmail(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, id: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("id, subject, body, jobs(description, location, clients(name, email))")
    .eq("id", id)
    .single<MessageRow>();

  if (error || !data) throw new Error(error?.message ?? "Message not found");

  const client = data.jobs?.clients ?? null;
  if (!client?.email) throw new Error("Client email is missing on this message");

  const html = emailShell(
    data.subject ?? "A message from Admin Ghost",
    `<p style="margin:0;font-size:14.5px;line-height:1.55;white-space:pre-wrap;">${escapeHtml(data.body)}</p>`,
  );

  return {
    to: client.email,
    subject: data.subject ?? "A message from Admin Ghost",
    html,
    text: data.body,
  };
}

export async function POST(request: Request) {
  let body: { document_id?: string; document_type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { document_id, document_type } = body;

  if (!document_id || typeof document_id !== "string") {
    return NextResponse.json(
      { error: "document_id is required" },
      { status: 400 },
    );
  }
  if (!isDocumentType(document_type)) {
    return NextResponse.json(
      { error: "document_type must be 'invoice', 'quote', or 'message'" },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured" },
      { status: 500 },
    );
  }

  const supabase = await createSupabaseServerClient();

  let email: { to: string; subject: string; html: string; text: string };
  try {
    if (document_type === "invoice") {
      email = await buildInvoiceEmail(supabase, document_id);
    } else if (document_type === "quote") {
      email = await buildQuoteEmail(supabase, document_id);
    } else {
      email = await buildMessageEmail(supabase, document_id);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load document";
    return NextResponse.json({ error: message }, { status: 404 });
  }

  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: email.to,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });

  if (sendError) {
    console.error("[send] resend error:", sendError);
    return NextResponse.json(
      { error: "Email delivery failed", detail: sendError.message },
      { status: 502 },
    );
  }

  const sent_at = new Date().toISOString();
  const table =
    document_type === "invoice"
      ? "invoices"
      : document_type === "quote"
        ? "quotes"
        : "messages";

  const update =
    document_type === "quote"
      ? { status: "sent" }
      : { status: "sent", sent_at };

  const { error: dbError } = await supabase
    .from(table)
    .update(update)
    .eq("id", document_id);

  if (dbError) {
    console.error("[send] supabase error:", dbError);
    return NextResponse.json(
      { error: "Email sent but failed to mark as sent", detail: dbError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ sent: true, sent_at });
}
