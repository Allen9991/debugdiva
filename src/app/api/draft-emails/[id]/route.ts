import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const draftEmail = demoStore.draftEmails.get(id);
  if (!draftEmail) {
    return NextResponse.json({ error: "Draft email not found" }, { status: 404 });
  }
  return NextResponse.json({ draftEmail });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const patch: Record<string, unknown> = {};
  for (const key of ["client_name", "client_email", "subject", "body"] as const) {
    if (typeof body[key] === "string") patch[key] = body[key].trim();
  }

  const draftEmail = demoStore.draftEmails.update(id, patch);
  if (!draftEmail) {
    return NextResponse.json({ error: "Draft email not found" }, { status: 404 });
  }
  return NextResponse.json({ draftEmail });
}
