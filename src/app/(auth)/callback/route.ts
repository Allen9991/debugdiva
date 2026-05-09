import { NextResponse } from "next/server";

export async function GET(request: Request) {
  console.log("[GET /auth/callback] called");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  console.log("[GET /auth/callback] called with: code=", code ? "<present>" : null);
  const target = new URL("/today", url.origin);
  console.log("[GET /auth/callback] returning redirect to:", target.toString());
  return NextResponse.redirect(target);
}
