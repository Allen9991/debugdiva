import { NextResponse } from "next/server";

import { buildReminderQueue } from "@/lib/reminders/engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Capture, Invoice, Job, Quote } from "@/lib/types";

export const dynamic = "force-dynamic";

const demoUserId = "11111111-1111-1111-1111-111111111111";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfToday.getDate() + 1);

  const [
    jobsResult,
    jobsTodayResult,
    invoicesResult,
    quotesResult,
    capturesResult,
  ] = await Promise.all([
    supabase.from("jobs").select("*").eq("user_id", demoUserId),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", demoUserId)
      .gte("updated_at", startOfToday.toISOString())
      .lt("updated_at", startOfTomorrow.toISOString()),
    supabase
      .from("invoices")
      .select("*, jobs!inner(id, user_id, location)")
      .eq("jobs.user_id", demoUserId)
      .in("status", ["draft", "sent"]),
    supabase
      .from("quotes")
      .select("*, jobs!inner(id, user_id, location)")
      .eq("jobs.user_id", demoUserId),
    supabase.from("captures").select("*").eq("user_id", demoUserId),
  ]);

  const firstError =
    jobsResult.error ??
    jobsTodayResult.error ??
    invoicesResult.error ??
    quotesResult.error ??
    capturesResult.error;

  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const jobs = (jobsResult.data ?? []) as Job[];
  const invoices = (invoicesResult.data ?? []) as Invoice[];
  const quotes = (quotesResult.data ?? []) as Quote[];
  const captures = (capturesResult.data ?? []) as Capture[];
  const pendingActions = buildReminderQueue({
    jobs,
    invoices,
    quotes,
    captures,
  });

  return NextResponse.json({
    pending_actions: pendingActions,
    stats: {
      jobs_today: jobsTodayResult.count ?? 0,
      unpaid_invoices: invoices.filter((invoice) => invoice.status === "sent").length,
      quotes_pending: quotes.filter((quote) => quote.status === "sent").length,
      receipts_unlinked: captures.filter((capture) => capture.type === "receipt" && !capture.job_id)
        .length,
    },
  });
}
