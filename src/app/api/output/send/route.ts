import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";

type DocumentType = "invoice" | "quote" | "message";

function isDocumentType(v: unknown): v is DocumentType {
  return v === "invoice" || v === "quote" || v === "message";
}

export async function POST(request: Request) {
  console.log("[POST /api/output/send] called");
  let body: { document_id?: string; document_type?: string };
  try {
    body = await request.json();
  } catch {
    const errResp = { error: "Invalid JSON body" };
    console.log("[POST /api/output/send] returning:", errResp);
    return NextResponse.json(errResp, { status: 400 });
  }

  const { document_id, document_type } = body;
  console.log("[POST /api/output/send] called with:", {
    document_id,
    document_type,
  });

  if (!document_id || typeof document_id !== "string") {
    const errResp = { error: "document_id is required" };
    console.log("[POST /api/output/send] returning:", errResp);
    return NextResponse.json(errResp, { status: 400 });
  }
  if (!isDocumentType(document_type)) {
    const errResp = {
      error: "document_type must be 'invoice', 'quote', or 'message'",
    };
    console.log("[POST /api/output/send] returning:", errResp);
    return NextResponse.json(errResp, { status: 400 });
  }

  const sent_at = new Date().toISOString();

  if (document_type === "invoice") {
    const inv =
      demoStore.invoices.get(document_id) ??
      demoStore.invoices.forJob(document_id);
    if (inv) {
      demoStore.invoices.update(inv.id, { status: "sent", sent_at });
      demoStore.notifications.push({
        title: "Invoice sent to " + inv.client_name,
        body: "Marked as sent. Reminder will fire if payment is overdue.",
        href: "/invoices/" + inv.id,
      });
    }
  }

  const response = { sent: true, sent_at, simulated: true };
  console.log("[POST /api/output/send] returning:", response);
  return NextResponse.json(response);
}
