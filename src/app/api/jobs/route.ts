import { NextResponse } from "next/server";

import { getJobsWithClients } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json({ jobs: getJobsWithClients() });
}
