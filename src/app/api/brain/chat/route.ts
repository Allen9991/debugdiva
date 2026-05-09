import { NextResponse } from "next/server";
import { claudeClient, CLAUDE_TIMEOUT_MS } from "@/lib/claude/client";
import { buildChatSystemPrompt } from "@/lib/claude/prompts/chat-system";
import { ChatRequestSchema, ChatResponseSchema } from "@/lib/claude/schemas";
import {
  appendTurn,
  getHistory,
} from "@/lib/claude/conversation-store";

export const runtime = "nodejs";

const CLAUDE_MODEL = "claude-sonnet-4-5";
const BUSINESS_TYPE = "tradie";

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
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { message, conversation_id, context } = parsed.data;

  const systemPrompt = buildChatSystemPrompt(BUSINESS_TYPE, context);
  const history = getHistory(conversation_id);

  const messages = [
    ...history.map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: message },
  ];

  let raw: string;
  try {
    const claudeMessage = await claudeClient.messages.create(
      {
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      },
      { timeout: CLAUDE_TIMEOUT_MS },
    );
    raw = extractTextFromClaude(claudeMessage);
  } catch (err: unknown) {
    const e = err as { name?: string; message?: string };
    const isTimeout =
      e?.name === "APIConnectionTimeoutError" ||
      e?.name === "AbortError" ||
      /timeout/i.test(e?.message ?? "");
    if (isTimeout) {
      return NextResponse.json(
        { error: "AI chat timed out" },
        { status: 408 },
      );
    }
    console.error("[chat] claude error:", err);
    return NextResponse.json(
      { error: "AI chat failed" },
      { status: 502 },
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripJsonFences(raw));
  } catch {
    return NextResponse.json(
      { error: "AI returned non-JSON output", raw },
      { status: 422 },
    );
  }

  const validation = ChatResponseSchema.safeParse(parsedJson);
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "AI output failed schema validation",
        issues: validation.error.issues,
      },
      { status: 422 },
    );
  }

  // Persist this turn pair after successful generation only — if Claude
  // failed or returned bad JSON we don't want a half-turn poisoning history.
  appendTurn(conversation_id, { role: "user", content: message });
  appendTurn(conversation_id, {
    role: "assistant",
    content: validation.data.response,
  });

  return NextResponse.json(validation.data);
}
