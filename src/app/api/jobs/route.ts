import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobWithClient } from "@/lib/types";

export const dynamic = "force-dynamic";

const demoUserId = "11111111-1111-1111-1111-111111111111";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*, client:clients(*)")
    .eq("user_id", demoUserId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const jobs = ((data ?? []) as JobWithClient[]).map((job) => ({
    ...job,
    client_name: job.client?.name ?? "Unknown client",
  }));

  return NextResponse.json({ jobs });
}
