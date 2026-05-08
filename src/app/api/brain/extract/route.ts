import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { claudeClient, CLAUDE_TIMEOUT_MS } from "@/lib/claude/client";
import { buildExtractVoicePrompt } from "@/lib/claude/prompts/extract-voice";
import {
  ExtractVoiceResponseSchema,
  type ExtractVoiceResponse,
} from "@/lib/claude/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const CLAUDE_MODEL = "claude-sonnet-4-6";
const BUSINESS_TYPE = "tradie";
const CACHE_DIR = path.join(process.cwd(), "tests", "cache");

// [PENDING: confirm with Jayden] Using assumed schema for `captures`:
//   captures(id, kind, raw_text, image_url, audio_url, created_at, processed)
//   `kind` is 'voice' | 'receipt' (NOT 'type').

type CaptureRow = {
  id: string;
  kind: "voice" | "receipt";
  raw_text: string | null;
  image_url: string | null;
  audio_url: string | null;
  created_at: string;
  processed: boolean;
};

async function readCache(captureId: string): Promise<ExtractVoiceResponse | null> {
  try {
    const file = path.join(CACHE_DIR, `${captureId}.json`);
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    const result = ExtractVoiceResponseSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

async function writeCache(
  captureId: string,
  data: ExtractVoiceResponse,
): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const file = path.join(CACHE_DIR, `${captureId}.json`);
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("[extract] failed to write dev cache:", err);
  }
}

function extractTextFromClaude(message: {
  content: Array<{ type: string; text?: string }>;
}): string {
  for (const block of message.content) {
    if (block.type === "text" && typeof block.text === "string") {
      return block.text;
    }
  }
  return "";
}

function stripJsonFences(s: string): string {
  const trimmed = s.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

export async function POST(request: Request) {
  let body: { capture_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const captureId = body.capture_id;
  if (!captureId || typeof captureId !== "string") {
    return NextResponse.json(
      { error: "capture_id is required" },
      { status: 400 },
    );
  }

  // [PENDING: waiting on Jayden's real Supabase server client]
  // The current src/lib/supabase/server.ts is a stub. This block assumes
  // the real client returns a Supabase JS client supporting
  // `.from().select().eq().single()`.
  const supabase = createSupabaseServerClient() as unknown as {
    from: (t: string) => {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          single: () => Promise<{ data: CaptureRow | null; error: unknown }>;
        };
      };
    };
  };

  let capture: CaptureRow | null = null;
  try {
    const { data, error } = await supabase
      .from("captures")
      .select("id, kind, raw_text, image_url, audio_url, created_at, processed")
      .eq("id", captureId)
      .single();
    if (error) {
      console.error("[extract] supabase error:", error);
    }
    capture = data;
  } catch (err) {
    console.error("[extract] supabase threw:", err);
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }

  if (!capture) {
    return NextResponse.json({ error: "Capture not found" }, { status: 404 });
  }

  if (capture.kind === "receipt") {
    return NextResponse.json(
      { error: "Receipt extraction coming soon" },
      { status: 501 },
    );
  }

  if (!capture.raw_text || capture.raw_text.trim().length === 0) {
    return NextResponse.json(
      { error: "Capture has no transcript to extract from" },
      { status: 400 },
    );
  }

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const cached = await readCache(captureId);
    if (cached) {
      return NextResponse.json({
        extracted: cached,
        capture_id: captureId,
        processed_at: new Date().toISOString(),
        cached: true,
      });
    }
  }

  const systemPrompt = buildExtractVoicePrompt(BUSINESS_TYPE);

  let raw: string;
  try {
    const message = await claudeClient.messages.create(
      {
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: capture.raw_text }],
      },
      { timeout: CLAUDE_TIMEOUT_MS },
    );
    raw = extractTextFromClaude(message);
  } catch (err: unknown) {
    const e = err as { name?: string; status?: number; message?: string };
    const isTimeout =
      e?.name === "APIConnectionTimeoutError" ||
      e?.name === "AbortError" ||
      /timeout/i.test(e?.message ?? "");
    if (isTimeout) {
      return NextResponse.json(
        { error: "AI extraction timed out" },
        { status: 408 },
      );
    }
    console.error("[extract] claude error:", err);
    return NextResponse.json(
      { error: "AI extraction failed" },
      { status: 502 },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFences(raw));
  } catch {
    return NextResponse.json(
      { error: "AI returned non-JSON output", raw },
      { status: 422 },
    );
  }

  const validation = ExtractVoiceResponseSchema.safeParse(parsed);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "AI output failed schema validation",
        issues: validation.error.issues,
      },
      { status: 422 },
    );
  }

  if (isDev) {
    await writeCache(captureId, validation.data);
  }

  return NextResponse.json({
    extracted: validation.data,
    capture_id: captureId,
    processed_at: new Date().toISOString(),
  });
}
