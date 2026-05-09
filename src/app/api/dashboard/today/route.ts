import { NextResponse } from "next/server";

import { buildReminderQueue, getReminderSourceData } from "@/lib/reminders/engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const demoUserId = "11111111-1111-1111-1111-111111111111";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfToday.getDate() + 1);

  try {
    const [{ jobs, invoices, quotes, captures }, jobsTodayResult] = await Promise.all([
      getReminderSourceData(demoUserId),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", demoUserId)
        .gte("updated_at", startOfToday.toISOString())
        .lt("updated_at", startOfTomorrow.toISOString()),
    ]);

    if (jobsTodayResult.error) {
      throw new Error(jobsTodayResult.error.message);
    }

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
        receipts_unlinked: captures.filter(
          (capture) => capture.type === "receipt" && !capture.job_id,
        ).length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load dashboard";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
