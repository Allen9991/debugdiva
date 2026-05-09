import { NextResponse } from "next/server";

import { buildReminderQueueFromDatabase } from "@/lib/reminders/engine";

export const dynamic = "force-dynamic";

const demoUserId = "11111111-1111-1111-1111-111111111111";

export async function GET() {
  try {
    return NextResponse.json({
      reminders: await buildReminderQueueFromDatabase(demoUserId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reminders";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
