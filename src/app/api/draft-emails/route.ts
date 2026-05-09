import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";
import { getEnvVar } from "@/lib/claude/client";

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

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}

function cleanJobBrief(value: string) {
  return value
    .replace(/\b(can you|could you|please)?\s*(write|draft|make|create)\s+(me\s+)?(a\s+)?(draft\s+)?email\b/gi, "")
    .replace(/\b(just|like|um|uh|you know|idk)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildFallbackDraftEmail(input: {
  client_name: string;
  client_email?: string;
  job_description?: string;
  location?: string;
  transcript?: string;
}) {
  const client = input.client_name || "Client";
  const description = cleanSentence(
    cleanJobBrief(input.job_description || input.transcript || "your job"),
  );
  const location = cleanSentence(input.location || "");
  const costMatch = (input.transcript ?? input.job_description ?? "").match(/\$?\b(\d+(?:\.\d{1,2})?)\s*(?:bucks|dollars)?\b/i);
  const costLine = costMatch ? "The total comes to around $" + Number(costMatch[1]).toFixed(2) + "." : "";
  const subject = "Job completion update for " + client;
  const body = [
    "Hi " + firstName(client) + ",",
    "",
    "Just letting you know the job has been completed" + (location ? " at " + location : "") + ".",
    description && description.toLowerCase() !== "your job" ? "The work completed was: " + description + "." : "",
    costLine,
    "Please let me know if you have any questions.",
    "",
    "Cheers,",
    "Mike",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, body };
}

async function buildAiDraftEmail(input: {
  client_name: string;
  client_email?: string;
  job_description?: string;
  location?: string;
  transcript?: string;
}) {
  const apiKey = getEnvVar("OPENAI_API_KEY");
  if (!apiKey) return buildFallbackDraftEmail(input);

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
        {
          role: "system",
          content:
            "You write polished, concise client emails for a New Zealand trades business called Ghostly. Return only JSON with subject and body. Do not quote the user's spoken request. Extract the actual business intent, remove filler words, and write a professional email from Mike. Use plain text only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            client_name: input.client_name,
            client_email: input.client_email ?? null,
            job_location: input.location ?? null,
            extracted_job_description: input.job_description ?? null,
            voice_request: input.transcript ?? null,
          }),
        },
      ],
    }),
  });

  if (!response.ok) return buildFallbackDraftEmail(input);
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) return buildFallbackDraftEmail(input);
  try {
    const parsed = JSON.parse(stripJsonFences(content)) as { subject?: string; body?: string };
    if (!parsed.subject || !parsed.body) return buildFallbackDraftEmail(input);
    return { subject: parsed.subject.trim(), body: parsed.body.trim() };
  } catch {
    return buildFallbackDraftEmail(input);
  }
}

export async function GET() {
  return NextResponse.json({ draftEmails: demoStore.draftEmails.all() });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const client_name = String(body.client_name ?? "").trim();
  if (!client_name) {
    return NextResponse.json({ error: "client_name is required" }, { status: 400 });
  }

  const client_email =
    typeof body.client_email === "string" ? body.client_email.trim() : undefined;
  const generated = await buildAiDraftEmail({
    client_name,
    client_email,
    job_description:
      typeof body.job_description === "string" ? body.job_description : undefined,
    location: typeof body.location === "string" ? body.location : undefined,
    transcript: typeof body.transcript === "string" ? body.transcript : undefined,
  });

  const draftEmail = demoStore.draftEmails.create({
    client_name,
    client_email,
    subject:
      typeof body.subject === "string" && body.subject.trim()
        ? cleanSentence(body.subject)
        : generated.subject,
    body:
      typeof body.email_body === "string" && body.email_body.trim()
        ? body.email_body.trim()
        : generated.body,
  });

  return NextResponse.json({ draftEmail }, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const deleted = demoStore.draftEmails.delete(id);
  if (!deleted) return NextResponse.json({ error: "Draft email not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
