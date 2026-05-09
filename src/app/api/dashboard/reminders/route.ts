import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";

type Reminder = {
  id: string;
  type: "draft_invoice" | "overdue_invoice" | "stale_quote" | "unlinked_receipt";
  title: string;
  body: string;
  href?: string;
  priority: "high" | "medium" | "low";
  due_at: string;
};

function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));
}

function nzd(value: number) {
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(value);
}

export async function GET() {
  console.log("[GET /api/dashboard/reminders] called");

  const reminders: Reminder[] = [];

  for (const inv of demoStore.invoices.all()) {
    if (inv.status === "draft") {
      reminders.push({
        id: "r-draft-" + inv.id,
        type: "draft_invoice",
        title: "Send draft invoice to " + inv.client_name,
        body: nzd(inv.total) + " ready for send",
        href: "/invoices/" + inv.id,
        priority: "high",
        due_at: inv.due_date,
      });
    }
    if (inv.status === "sent" && new Date(inv.due_date) < new Date()) {
      reminders.push({
        id: "r-overdue-" + inv.id,
        type: "overdue_invoice",
        title: "Chase overdue payment from " + inv.client_name,
        body: "Due " + inv.due_date + ". " + nzd(inv.total) + " outstanding.",
        href: "/invoices/" + inv.id,
        priority: "high",
        due_at: inv.due_date,
      });
    }
  }

  for (const q of demoStore.quotes.all()) {
    if (q.status === "sent" && daysAgo(q.created_at) > 3) {
      reminders.push({
        id: "r-quote-" + q.id,
        type: "stale_quote",
        title: "Follow up quote with " + q.client_name,
        body: "Sent " + daysAgo(q.created_at) + " days ago. Worth a nudge.",
        href: "/quotes",
        priority: "medium",
        due_at: q.expires_at,
      });
    }
  }

  reminders.push({
    id: "r-receipt-bunnings",
    type: "unlinked_receipt",
    title: "Link Bunnings receipt to a job",
    body: "Captured 2 hrs ago - $75.00 plumbing materials.",
    href: "/capture",
    priority: "medium",
    due_at: new Date().toISOString().slice(0, 10),
  });

  const response = { reminders };
  console.log("[GET /api/dashboard/reminders] returning:", reminders.length, "reminders");
  return NextResponse.json(response);
}
