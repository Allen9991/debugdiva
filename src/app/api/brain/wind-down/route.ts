import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";
import { claudeClient, CLAUDE_TIMEOUT_MS, getEnvVar } from "@/lib/claude/client";

export const runtime = "nodejs";

export type WindDownResponse = {
  celebration: string;
  tomorrow_list: { label: string; priority: "high" | "medium" | "low" }[];
  stats: {
    jobs_completed_week: number;
    revenue_invoiced_week: number;
    new_bookings_week: number;
  };
};

function getWeekStart() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function calcWeekWins() {
  const weekStart = getWeekStart();
  const jobs = demoStore.jobs.all();
  const invoices = demoStore.invoices.all();

  const completedThisWeek = jobs.filter(
    (j) =>
      (j.status === "completed" || j.status === "invoiced" || j.status === "paid") &&
      new Date(j.updated_at) >= weekStart,
  );

  const newBookingsThisWeek = jobs.filter(
    (j) => new Date(j.created_at) >= weekStart,
  );

  const revenueThisWeek = invoices
    .filter(
      (i) =>
        (i.status === "sent" || i.status === "paid") &&
        new Date(i.created_at) >= weekStart,
    )
    .reduce((sum, i) => sum + i.total, 0);

  return {
    completedThisWeek,
    newBookingsThisWeek,
    revenueThisWeek,
  };
}

function buildTomorrowList() {
  const now = new Date();
  const jobs = demoStore.jobs.all();
  const invoices = demoStore.invoices.all();
  const quotes = demoStore.quotes.all();

  const items: { label: string; priority: "high" | "medium" | "low" }[] = [];

  for (const inv of invoices) {
    if (inv.status === "draft") {
      items.push({ label: `Send draft invoice for ${inv.client_name} ($${inv.total.toFixed(0)})`, priority: "high" });
    }
    if (inv.status === "sent" && new Date(inv.due_date) < now) {
      items.push({ label: `Chase overdue payment from ${inv.client_name}`, priority: "high" });
    }
  }

  for (const job of jobs) {
    if (job.status === "completed" && !demoStore.invoices.forJob(job.id)) {
      items.push({ label: `Create invoice for ${job.client_name}`, priority: "high" });
    }
  }

  for (const q of quotes) {
    if (q.status === "sent") {
      items.push({ label: `Follow up quote with ${q.client_name}`, priority: "medium" });
    }
  }

  items.push({ label: "Link unassigned Bunnings receipt to a job", priority: "medium" });

  return items.slice(0, 3);
}

function buildFallback(
  wins: ReturnType<typeof calcWeekWins>,
  tomorrowList: ReturnType<typeof buildTomorrowList>,
): WindDownResponse {
  const { completedThisWeek, newBookingsThisWeek, revenueThisWeek } = wins;

  let celebration = "";
  const parts: string[] = [];

  if (completedThisWeek.length > 0) {
    const names = completedThisWeek.map((j) => j.client_name).join(", ");
    parts.push(`Solid week — you wrapped ${completedThisWeek.length} job${completedThisWeek.length === 1 ? "" : "s"} (${names})`);
  }
  if (revenueThisWeek > 0) {
    parts.push(`$${revenueThisWeek.toFixed(0)} invoiced and on its way`);
  }
  if (newBookingsThisWeek.length > 0) {
    parts.push(`${newBookingsThisWeek.length} new booking${newBookingsThisWeek.length === 1 ? "" : "s"} locked in`);
  }
  if (parts.length === 0) {
    celebration = "Quiet one today — sometimes that's exactly what's needed. Tomorrow is fresh.";
  } else {
    celebration = parts.join(". ") + ". Clock off knowing the work speaks for itself.";
  }

  return {
    celebration,
    tomorrow_list: tomorrowList,
    stats: {
      jobs_completed_week: completedThisWeek.length,
      revenue_invoiced_week: revenueThisWeek,
      new_bookings_week: newBookingsThisWeek.length,
    },
  };
}

async function buildClaudeWindDown(
  wins: ReturnType<typeof calcWeekWins>,
  tomorrowList: ReturnType<typeof buildTomorrowList>,
): Promise<WindDownResponse> {
  const { completedThisWeek, newBookingsThisWeek, revenueThisWeek } = wins;

  const winsDesc = [
    completedThisWeek.length > 0
      ? `Jobs completed this week: ${completedThisWeek.map((j) => `${j.client_name} (${j.labour_hours} hrs)`).join(", ")}`
      : null,
    revenueThisWeek > 0 ? `Revenue invoiced this week: NZD $${revenueThisWeek.toFixed(2)}` : null,
    newBookingsThisWeek.length > 0
      ? `New jobs booked this week: ${newBookingsThisWeek.map((j) => j.client_name).join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const tomorrowDesc = tomorrowList
    .map((t, i) => `${i + 1}. ${t.label} [${t.priority}]`)
    .join("\n");

  const prompt = `You are Ghostly, a friendly AI admin assistant for NZ tradies.

It's end-of-day for Mike Kahu. Here's what he achieved this week:
${winsDesc || "Quiet week — no jobs completed yet."}

Top 3 things for tomorrow:
${tomorrowDesc}

Write a short, warm celebration message (2-3 sentences) that:
- Calls out specific wins with client names and amounts where relevant
- Sounds like a genuine Kiwi mate — proud but not cheesy
- Ends with a line that lets him mentally clock off

Respond with valid JSON only, no markdown:
{"celebration": "..."}`;

  const message = await claudeClient.messages.create(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    },
    { timeout: CLAUDE_TIMEOUT_MS },
  );

  const text = message.content.find((b) => b.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON");
  const parsed = JSON.parse(match[0]) as { celebration?: string };

  return {
    celebration: parsed.celebration ?? buildFallback(wins, tomorrowList).celebration,
    tomorrow_list: tomorrowList,
    stats: {
      jobs_completed_week: completedThisWeek.length,
      revenue_invoiced_week: revenueThisWeek,
      new_bookings_week: newBookingsThisWeek.length,
    },
  };
}

export async function GET() {
  console.log("[GET /api/brain/wind-down] called");

  const wins = calcWeekWins();
  const tomorrowList = buildTomorrowList();

  if (getEnvVar("ANTHROPIC_API_KEY")) {
    try {
      const result = await buildClaudeWindDown(wins, tomorrowList);
      return NextResponse.json(result);
    } catch (err) {
      console.error("[wind-down] Claude failed, using fallback:", err);
    }
  }

  return NextResponse.json(buildFallback(wins, tomorrowList));
}
