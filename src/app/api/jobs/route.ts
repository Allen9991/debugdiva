import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";

export async function GET() {
  console.log("[GET /api/jobs] called");
  const jobs = demoStore.jobs.all();
  const response = { jobs };
  console.log("[GET /api/jobs] returning:", jobs.length, "jobs");
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  console.log("[POST /api/jobs] called with:", body);

  const client_name = String(body.client_name ?? "").trim();
  const description = String(body.description ?? "").trim();
  const location = String(body.location ?? "").trim();
  const status = (body.status as string) ?? "new";
  const labour_hours =
    typeof body.labour_hours === "number" ? body.labour_hours : 0;
  const materials = Array.isArray(body.materials)
    ? (body.materials as { name: string; cost: number }[])
    : [];
  const client_email =
    typeof body.client_email === "string" ? body.client_email : undefined;

  if (!client_name) {
    const errResp = { error: "client_name is required" };
    console.log("[POST /api/jobs] returning error:", errResp);
    return NextResponse.json(errResp, { status: 400 });
  }

  const job = demoStore.jobs.create({
    client_name,
    client_email,
    location: location || "Address TBC",
    description: description || "(No description provided)",
    status: status as
      | "new"
      | "quoted"
      | "approved"
      | "in_progress"
      | "completed"
      | "invoiced"
      | "paid",
    labour_hours,
    materials,
  });

  const response = { job };
  console.log("[POST /api/jobs] returning new job id:", job.id);
  return NextResponse.json(response, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const deleted = demoStore.jobs.delete(id);
  if (!deleted) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
