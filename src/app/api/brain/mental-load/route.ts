import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";
import { claudeClient, CLAUDE_TIMEOUT_MS, getEnvVar } from "@/lib/claude/client";

export const runtime = "nodejs";

export type LoadLevel = "light" | "moderate" | "heavy" | "overloaded";

export type LoadFactor = {
  label: string;
  detail: string;
  points: number;
};

export type MentalLoadResponse = {
  level: LoadLevel;
  score: number;
  max_score: number;
  summary: string;
  tips: string[];
  factors: LoadFactor[];
};

function calcLoad(): { score: number; factors: LoadFactor[]; contextLines: string[] } {
  const now = new Date();
  const invoices = demoStore.invoices.all();
  const quotes = demoStore.quotes.all();
  const jobs = demoStore.jobs.all();

  const factors: LoadFactor[] = [];
  const contextLines: string[] = [];
  let score = 0;

  for (const inv of invoices) {
    if (inv.status === "sent" && new Date(inv.due_date) < now) {
      const daysOverdue = Math.floor(
        (now.getTime() - new Date(inv.due_date).getTime()) / 86_400_000,
      );
      factors.push({
        label: `Overdue invoice: ${inv.client_name}`,
        detail: `$${inv.total.toFixed(0)} — ${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`,
        points: 3,
      });
      contextLines.push(
        `Overdue invoice: ${inv.client_name}, NZD $${inv.total.toFixed(2)}, ${daysOverdue} days past due`,
      );
      score += 3;
    }
  }

  for (const inv of invoices) {
    if (inv.status === "draft") {
      factors.push({
        label: `Draft invoice: ${inv.client_name}`,
        detail: `$${inv.total.toFixed(0)} — ready to send`,
        points: 2,
      });
      contextLines.push(
        `Draft invoice ready to send: ${inv.client_name}, NZD $${inv.total.toFixed(2)}`,
      );
      score += 2;
    }
  }

  for (const job of jobs) {
    if (job.status === "completed" && !demoStore.invoices.forJob(job.id)) {
      factors.push({
        label: `Completed job not invoiced: ${job.client_name}`,
        detail: "Job done but no invoice created yet",
        points: 2,
      });
      contextLines.push(
        `Completed job with no invoice: ${job.client_name} — ${job.description.slice(0, 60)}`,
      );
      score += 2;
    }
  }

  for (const q of quotes) {
    if (q.status === "sent") {
      const daysSinceSent = q.sent_at
        ? Math.floor((now.getTime() - new Date(q.sent_at).getTime()) / 86_400_000)
        : 0;
      factors.push({
        label: `Quote pending: ${q.client_name}`,
        detail: `Sent ${daysSinceSent} day${daysSinceSent === 1 ? "" : "s"} ago — no reply yet`,
        points: 1,
      });
      contextLines.push(
        `Quote awaiting reply: ${q.client_name}, sent ${daysSinceSent} days ago, NZD $${q.total.toFixed(2)}`,
      );
      score += 1;
    }
  }

  const receiptsUnlinked = 1;
  factors.push({
    label: `${receiptsUnlinked} unlinked receipt`,
    detail: "Bunnings receipt needs attaching to a job",
    points: 1,
  });
  contextLines.push(`Unlinked receipts: 1 (Bunnings receipt waiting for a job)`);
  score += 1;

  return { score, factors, contextLines };
}

function scoreToLevel(score: number): LoadLevel {
  if (score <= 2) return "light";
  if (score <= 5) return "moderate";
  if (score <= 9) return "heavy";
  return "overloaded";
}

function buildFallbackTips(
  level: LoadLevel,
  factors: LoadFactor[],
): { summary: string; tips: string[] } {
  const sorted = [...factors].sort((a, b) => b.points - a.points);
  const tips: string[] = [];

  for (const factor of sorted.slice(0, 3)) {
    if (factor.label.startsWith("Overdue invoice")) {
      tips.push(
        `Chase that overdue payment — ${factor.detail}. A quick follow-up email now saves a lot of stress later.`,
      );
    } else if (factor.label.startsWith("Draft invoice")) {
      tips.push(
        `Send that draft invoice for ${factor.detail.split("$")[0].trim()} — money in motion beats money waiting.`,
      );
    } else if (factor.label.startsWith("Completed job")) {
      const client = factor.label.replace("Completed job not invoiced: ", "");
      tips.push(
        `${client}'s job is done but not invoiced yet — create it now while the details are fresh.`,
      );
    } else if (factor.label.startsWith("Quote pending")) {
      tips.push(
        `Follow up on that quote — ${factor.detail}. A quick nudge can turn a maybe into a yes.`,
      );
    } else if (factor.label.includes("receipt")) {
      tips.push(`Link that Bunnings receipt to a job before it gets lost — takes 30 seconds in Capture.`);
    } else {
      tips.push(`Sort ${factor.label.toLowerCase()} — ${factor.detail}.`);
    }
  }

  const summaries: Record<LoadLevel, string> = {
    light: "You're on top of things — just a couple of loose ends to tidy up.",
    moderate: "A few things are stacking up, but nothing you can't knock over today.",
    heavy: "Your plate's getting full. Let's knock off the highest-impact items first.",
    overloaded: "This is a lot. Let Ghostly help you work through the most urgent items.",
  };

  return { summary: summaries[level], tips };
}

async function buildClaudeTips(
  level: LoadLevel,
  score: number,
  contextLines: string[],
): Promise<{ summary: string; tips: string[] }> {
  const levelLabel = { light: "Low", moderate: "Moderate", heavy: "High", overloaded: "Very High" }[level];

  const prompt = `You are Ghostly, a friendly AI admin assistant for NZ tradies. The user's mental load score is ${score} (${levelLabel}).

Current admin items:
${contextLines.map((l) => `- ${l}`).join("\n")}

Write exactly 3 short, practical tips to reduce this load. Rules:
- Reference actual client names and dollar amounts where relevant
- Each tip is 1-2 sentences max, no numbering
- Tone: straight-talking Kiwi mate, not a therapist — practical and warm
- Focus on highest-impact actions first

Also write one short summary sentence (max 15 words) capturing how the load feels right now.

Respond with valid JSON only, no markdown:
{"summary": "...", "tips": ["...", "...", "..."]}`;

  const message = await claudeClient.messages.create(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    },
    { timeout: CLAUDE_TIMEOUT_MS },
  );

  const text = message.content.find((b) => b.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in Claude response");
  const parsed = JSON.parse(match[0]) as { summary?: string; tips?: string[] };
  if (!Array.isArray(parsed.tips) || parsed.tips.length < 3) throw new Error("Bad tips format");
  return { summary: parsed.summary ?? "", tips: parsed.tips.slice(0, 3) };
}

export async function GET() {
  console.log("[GET /api/brain/mental-load] called");

  const { score, factors, contextLines } = calcLoad();
  const level = scoreToLevel(score);
  const maxScore = 15;

  let summary: string;
  let tips: string[];

  if (getEnvVar("ANTHROPIC_API_KEY") && contextLines.length > 0) {
    try {
      const result = await buildClaudeTips(level, score, contextLines);
      summary = result.summary;
      tips = result.tips;
      console.log("[mental-load] Claude tips generated, level:", level);
    } catch (err) {
      console.error("[mental-load] Claude failed, using fallback:", err);
      const fallback = buildFallbackTips(level, factors);
      summary = fallback.summary;
      tips = fallback.tips;
    }
  } else {
    const fallback = buildFallbackTips(level, factors);
    summary = fallback.summary;
    tips = fallback.tips;
  }

  const response: MentalLoadResponse = { level, score, max_score: maxScore, summary, tips, factors };
  console.log("[mental-load] returning level:", level, "score:", score);
  return NextResponse.json(response);
}
