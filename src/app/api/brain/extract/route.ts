import { NextResponse } from "next/server";
import { captureMemory } from "@/lib/capture-memory";
import { claudeClient, CLAUDE_TIMEOUT_MS, getEnvVar } from "@/lib/claude/client";
import { buildExtractVoicePrompt } from "@/lib/claude/prompts/extract-voice";
import {
  ExtractVoiceResponseSchema,
  type ExtractVoiceResponse,
} from "@/lib/claude/schemas";

export const runtime = "nodejs";

const CLAUDE_MODEL = "claude-sonnet-4-5";
const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

function extractTextFromClaude(message: {
  content: Array<{ type: string; text?: string }>;
}) {
  for (const block of message.content) {
    if (block.type === "text" && typeof block.text === "string") {
      return block.text;
    }
  }
  return "";
}

function stripJsonFences(s: string) {
  const trimmed = s.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function titleCaseName(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseNumberWord(value: string) {
  const lower = value.toLowerCase();
  const words: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  return Number.isFinite(Number(lower)) ? Number(lower) : words[lower] ?? null;
}

function fallbackExtractVoice(transcript: string): ExtractVoiceResponse {
  const text = transcript.trim();
  const lower = text.toLowerCase();
  const missing = new Set<string>();

  const clientMatch =
    lower.match(/\b(?:for|at|client)\s+([a-z]+(?:\s+[a-z]+)?)/i) ??
    lower.match(/\b([a-z]+(?:\s+[a-z]+)?)\s+(?:at|on)\s+\d+/i);
  const client_name = clientMatch?.[1] ? titleCaseName(clientMatch[1]) : null;
  if (!client_name) missing.add("client_name");

  const locationMatch =
    text.match(/\b(?:at|on)\s+(\d+[A-Za-z]?\s+[^.]+?)(?:\.|,|$)/i) ??
    text.match(/\b(location|address)\s+([^.,]+)/i);
  const job_location = locationMatch?.[2] ?? locationMatch?.[1] ?? null;
  if (!job_location) missing.add("job_location");

  const hoursMatch = lower.match(/\b(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\s*(?:hours?|hrs?|h)\b/);
  const labour_hours = hoursMatch?.[1] ? parseNumberWord(hoursMatch[1]) : null;
  if (labour_hours == null) missing.add("labour_hours");

  const materialSection =
    text.match(/\b(?:used|materials?|parts?)\s+([^.]*)/i)?.[1] ?? "";
  const materialCost = lower.match(/\b(?:materials?|parts?)\s+(?:around|about|cost|were|was)?\s*\$?(\d+(?:\.\d+)?)/i);
  const rawMaterials = materialSection
    .replace(/\b(?:around|about)?\s*\$?\d+(?:\.\d+)?\b/gi, "")
    .split(/,| and /i)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
  const materials = rawMaterials.map((name) => ({
    name,
    cost: rawMaterials.length === 1 && materialCost?.[1] ? Number(materialCost[1]) : null,
    quantity: null,
  }));
  if (materials.length > 0 && materials.some((item) => item.cost == null)) {
    missing.add("materials.cost");
  }

  const job_description = text || null;
  if (!job_description) missing.add("job_description");

  const clarifying_question = missing.has("client_name")
    ? "Who was this job for?"
    : missing.has("job_location")
      ? "What address or location was the job at?"
      : missing.has("labour_hours")
        ? "How many labour hours should I put on this?"
        : missing.has("materials.cost")
          ? "What did the materials cost?"
          : null;

  return {
    client_name,
    job_location,
    labour_hours,
    materials,
    job_description,
    total_estimate: null,
    missing_fields: Array.from(missing),
    clarifying_question,
    confidence: missing.size > 2 ? 0.55 : missing.size > 0 ? 0.72 : 0.84,
  };
}

async function extractWithClaude(transcript: string) {
  const message = await claudeClient.messages.create(
    {
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: buildExtractVoicePrompt("tradie"),
      messages: [{ role: "user", content: transcript }],
    },
    { timeout: CLAUDE_TIMEOUT_MS },
  );
  const raw = extractTextFromClaude(message);
  const parsed = JSON.parse(stripJsonFences(raw));
  return ExtractVoiceResponseSchema.parse(parsed);
}

async function extractWithOpenAi(transcript: string) {
  const apiKey = getEnvVar("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getEnvVar("OPENAI_EXTRACTION_MODEL") ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildExtractVoicePrompt("tradie") },
        { role: "user", content: transcript },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI extraction failed (${response.status}): ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI extraction returned no content.");
  }

  return ExtractVoiceResponseSchema.parse(JSON.parse(stripJsonFences(content)));
}

export async function POST(request: Request) {
  let body: { capture_id?: string; type?: string; transcript?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const captureId = body.capture_id;
  if (!captureId || typeof captureId !== "string") {
    return NextResponse.json({ error: "capture_id is required" }, { status: 400 });
  }

  const captureType = body.type === "receipt" ? "receipt" : "voice";
  const capture = captureMemory.get(captureId);
  const rawText = capture?.raw_text ?? body.transcript?.trim() ?? "";
  if (!capture && !rawText) {
    return NextResponse.json({ error: "Capture not found. Record a new voice note first." }, { status: 404 });
  }

  if (captureType === "receipt") {
    return NextResponse.json(
      { error: "Real receipt OCR is not wired yet. Voice capture is the live MVP path." },
      { status: 501 },
    );
  }

  if (!rawText) {
    return NextResponse.json({ error: "Capture has no transcript." }, { status: 400 });
  }

  let extracted: ExtractVoiceResponse;
  let extraction_provider: "openai" | "claude" | "local-parser";

  if (getEnvVar("OPENAI_API_KEY")) {
    try {
      extracted = await extractWithOpenAi(rawText);
      extraction_provider = "openai";
    } catch (error) {
      console.error("[extract] OpenAI extraction failed, using local parser:", error);
      extracted = fallbackExtractVoice(rawText);
      extraction_provider = "local-parser";
    }
  } else if (getEnvVar("ANTHROPIC_API_KEY")) {
    try {
      extracted = await extractWithClaude(rawText);
      extraction_provider = "claude";
    } catch (error) {
      console.error("[extract] Claude extraction failed, using local parser:", error);
      extracted = fallbackExtractVoice(rawText);
      extraction_provider = "local-parser";
    }
  } else {
    extracted = fallbackExtractVoice(rawText);
    extraction_provider = "local-parser";
  }

  return NextResponse.json({
    status: "accepted",
    message:
      extraction_provider === "openai" || extraction_provider === "claude"
        ? "Voice capture extracted with AI and ready for review."
        : "Voice capture transcribed. Add OPENAI_API_KEY for real transcription and AI extraction.",
    extracted,
    transcript: rawText,
    capture_id: captureId,
    extraction_provider,
    processed_at: new Date().toISOString(),
  });
}
