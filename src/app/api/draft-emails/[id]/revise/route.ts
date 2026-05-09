import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";
import { getEnvVar } from "@/lib/claude/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

function stripJsonFences(s: string) {
  const trimmed = s.trim();
  const match = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match ? match[1].trim() : trimmed;
}

function cleanSentence(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : "";
}

function removeLastParagraph(current: string) {
  const parts = current.trim().split(/\n\s*\n/).filter(Boolean);
  if (parts.length <= 1) return current;
  return parts.slice(0, -1).join("\n\n");
}

function extractRevisionAnchors(instruction: string) {
  const lower = instruction.toLowerCase();
  const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    .filter((day) => lower.includes(day));
  const times = Array.from(
    instruction.matchAll(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?|am|pm)\b/gi),
    (match) => match[0].toLowerCase().replace(/\s+/g, " "),
  );
  return { weekdays, times };
}

function revisionKeepsAnchors(revised: { body: string }, instruction: string) {
  const anchors = extractRevisionAnchors(instruction);
  const body = revised.body.toLowerCase();
  const hasWeekdays = anchors.weekdays.every((day) => body.includes(day));
  const hasTimes = anchors.times.every((time) => body.includes(time.replace(/\./g, "")) || body.includes(time));
  const removesTomorrow = instruction.toLowerCase().includes("tuesday") && body.includes("tomorrow");
  return hasWeekdays && hasTimes && !removesTomorrow;
}

function reviseAvailabilityEmail(current: string, instruction: string) {
  const lines = current.split("\n").map((line) => line.trim());
  const greeting = lines.find((line) => /^hi\b/i.test(line)) || "Hi there,";
  const signoffIndex = lines.findIndex((line) => /^(best|cheers|thanks),?$/i.test(line));
  const signoff = signoffIndex >= 0 ? lines.slice(signoffIndex).filter(Boolean).join("\n") : "Best,\nMike";
  const anchors = extractRevisionAnchors(instruction);
  const time = anchors.times[0] ?? "the requested time";
  const day = anchors.weekdays[0] ? anchors.weekdays[0].charAt(0).toUpperCase() + anchors.weekdays[0].slice(1) : "the requested day";

  return [
    greeting,
    "",
    "I will only be available at the job site at " + time + " on " + day + ". Would that work for you?",
    "",
    "Thanks in advance. I am looking forward to seeing you then.",
    "",
    signoff,
  ].join("\n");
}

function reviseBody(current: string, instruction: string) {
  const cleaned = cleanSentence(instruction);
  const lower = cleaned.toLowerCase();
  if (!cleaned) return current;

  if (lower.includes("remove") && (lower.includes("last") || lower.includes("bottom"))) {
    return removeLastParagraph(current);
  }

  if (/\b(available|availability|time|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(cleaned)) {
    return reviseAvailabilityEmail(current, instruction);
  }

  const addMatch = cleaned.match(/\b(?:add|include|mention)\b\s+(.+)/i);
  if (addMatch?.[1]) {
    return current.replace(
      /Please let me know if you have any questions\./i,
      cleanSentence(addMatch[1]) + " Please let me know if you have any questions.",
    );
  }

  if (lower.includes("shorter") || lower.includes("more concise")) {
    const lines = current.split("\n").filter(Boolean);
    return lines.slice(0, Math.min(lines.length, 5)).join("\n");
  }

  if (lower.includes("friendlier")) {
    return current.replace("Let me know", "Happy to help, and let me know");
  }

  return current;
}

async function reviseWithAi(input: {
  subject: string;
  body: string;
  instruction: string;
}) {
  const apiKey = getEnvVar("OPENAI_API_KEY");
  if (!apiKey) return null;

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getEnvVar("OPENAI_EXTRACTION_MODEL") ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You revise professional client emails for a New Zealand trades business. Return only JSON with subject and body. Apply every concrete detail from the user's instruction to the existing email, especially dates, weekdays, times, prices, names, locations, and removals. Replace outdated conflicting text instead of leaving it in place. Do not append the instruction itself. If they ask to remove text, remove it. Keep the email polished, concise, and ready to send from Mike.",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    const parsed = JSON.parse(stripJsonFences(content)) as { subject?: string; body?: string };
    if (!parsed.subject || !parsed.body) return null;
    return { subject: parsed.subject.trim(), body: parsed.body.trim() };
  } catch {
    return null;
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const draftEmail = demoStore.draftEmails.get(id);
  if (!draftEmail) {
    return NextResponse.json({ error: "Draft email not found" }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const instruction = String(body.instruction ?? "").trim();
  if (!instruction) {
    return NextResponse.json({ error: "instruction is required" }, { status: 400 });
  }

  const aiRevision = await reviseWithAi({
    subject: draftEmail.subject,
    body: draftEmail.body,
    instruction,
  });
  const subjectMatch = instruction.match(/\bsubject\s+(?:to|as)\s+(.+)/i);
  const usableAiRevision = aiRevision && revisionKeepsAnchors(aiRevision, instruction) ? aiRevision : null;
  const patch = usableAiRevision ??
    (subjectMatch?.[1]
      ? { subject: cleanSentence(subjectMatch[1]) }
      : { body: reviseBody(draftEmail.body, instruction) });

  const updated = demoStore.draftEmails.update(id, patch);
  return NextResponse.json({ draftEmail: updated });
}
