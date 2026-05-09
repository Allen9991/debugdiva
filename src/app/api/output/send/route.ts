import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DocumentType = "invoice" | "quote" | "message";

function isDocumentType(v: unknown): v is DocumentType {
  return v === "invoice" || v === "quote" || v === "message";
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

  const supabase = await createSupabaseServerClient();
  const sent_at = new Date().toISOString();

  // Quotes don't have a sent_at column in the migration; invoices and
  // messages do. Branch the update payload accordingly.
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

  const { error } = await supabase
    .from(table)
    .update(update)
    .eq("id", document_id);

  if (error) {
    console.error("[send] supabase error:", error);
    return NextResponse.json(
      { error: "Failed to mark document as sent", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ sent: true, sent_at });
}
