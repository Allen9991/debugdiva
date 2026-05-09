import { NextResponse } from "next/server";
import { demoStore, type WorkPreferences } from "@/lib/demo-store";

export async function GET() {
  return NextResponse.json(demoStore.settings.get());
}

export async function PATCH(request: Request) {
  let body: { work_preferences?: Partial<WorkPreferences> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.work_preferences) {
    const updated = demoStore.settings.updateWorkPreferences(body.work_preferences);
    return NextResponse.json({ work_preferences: updated });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
