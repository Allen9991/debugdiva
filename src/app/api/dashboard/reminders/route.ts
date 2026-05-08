import { NextResponse } from "next/server";

import { demoCaptures, demoInvoices, demoJobs, demoQuotes } from "@/lib/demo-data";
import { buildReminderQueue } from "@/lib/reminders/engine";

export async function GET() {
  return NextResponse.json({
    reminders: buildReminderQueue({
      jobs: demoJobs,
      invoices: demoInvoices,
      quotes: demoQuotes,
      captures: demoCaptures,
    }),
  });
}
