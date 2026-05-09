import { NextResponse } from "next/server";
import { demoStore } from "@/lib/demo-store";
import { claudeClient, CLAUDE_TIMEOUT_MS, getEnvVar } from "@/lib/claude/client";

export const runtime = "nodejs";

export type BurnoutRisk = "on_track" | "watch" | "at_risk" | "overloaded";

export type PipelineJob = {
  client_name: string;
  description: string;
  status: string;
  labour_hours: number;
  weight: number;
};

export type WorkloadForecastResponse = {
  risk: BurnoutRisk;
  logged_hours: number;
  pipeline_hours: number;
  projected_total: number;
  max_weekly_hours: number;
  utilization_pct: number;
  days_remaining: number;
  hours_per_day_remaining: number;
  summary: string;
  tips: string[];
  pipeline_jobs: PipelineJob[];
};

type WorkPreferences = {
  preferred_finish_hour: number;
  max_weekly_hours: number;
  work_weekends: boolean;
};

function getWeekBounds() {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return { now, monday };
}

function calcDaysRemaining(prefs: WorkPreferences) {
  const day = new Date().getDay();
  if (prefs.work_weekends) {
    return day === 0 ? 0 : 7 - day;
  }
  if (day === 0 || day === 6) return 0;
  return 5 - day;
}

function calcWorkload(prefs: WorkPreferences) {
  const { now, monday } = getWeekBounds();
  const jobs = demoStore.jobs.all();

  const loggedThisWeek = jobs
    .filter(
      (j) =>
        (j.status === "completed" || j.status === "invoiced" || j.status === "paid") &&
        new Date(j.updated_at) >= monday,
    )
    .reduce((sum, j) => sum + j.labour_hours, 0);

  const pipelineJobs: PipelineJob[] = [];

  for (const j of jobs) {
    if (j.status === "in_progress" || j.status === "approved") {
      pipelineJobs.push({ client_name: j.client_name, description: j.description, status: j.status, labour_hours: j.labour_hours, weight: 1 });
    } else if (j.status === "new") {
      pipelineJobs.push({ client_name: j.client_name, description: j.description, status: j.status, labour_hours: j.labour_hours, weight: 0.9 });
    } else if (j.status === "quoted") {
      pipelineJobs.push({ client_name: j.client_name, description: j.description, status: j.status, labour_hours: j.labour_hours, weight: 0.5 });
    }
  }

  const pipelineHours = pipelineJobs.reduce((sum, j) => sum + j.labour_hours * j.weight, 0);
  const projectedTotal = loggedThisWeek + pipelineHours;
  const utilizationPct = prefs.max_weekly_hours > 0
    ? Math.round((projectedTotal / prefs.max_weekly_hours) * 100)
    : 0;

  const daysRemaining = calcDaysRemaining(prefs);
  const hoursPerDayRemaining = daysRemaining > 0
    ? Math.round(((prefs.max_weekly_hours - loggedThisWeek) / daysRemaining) * 10) / 10
    : 0;

  let risk: BurnoutRisk;
  if (utilizationPct <= 80) risk = "on_track";
  else if (utilizationPct <= 100) risk = "watch";
  else if (utilizationPct <= 125) risk = "at_risk";
  else risk = "overloaded";

  void now;
  return { loggedThisWeek, pipelineJobs, pipelineHours, projectedTotal, utilizationPct, daysRemaining, hoursPerDayRemaining, risk };
}

function buildFallbackTips(
  risk: BurnoutRisk,
  prefs: WorkPreferences,
  data: ReturnType<typeof calcWorkload>,
): { summary: string; tips: string[] } {
  const finishTime = `${prefs.preferred_finish_hour > 12 ? prefs.preferred_finish_hour - 12 : prefs.preferred_finish_hour}${prefs.preferred_finish_hour >= 12 ? "pm" : "am"}`;
  const bigJob = [...data.pipelineJobs].sort((a, b) => b.labour_hours - a.labour_hours)[0];

  const summaries: Record<BurnoutRisk, string> = {
    on_track: `You're tracking well this week — ${Math.round(data.projectedTotal)} hrs projected against your ${prefs.max_weekly_hours}hr limit.`,
    watch: `Getting full — ${Math.round(data.projectedTotal)} hrs projected. Worth keeping an eye on.`,
    at_risk: `This week's looking heavy at ~${Math.round(data.projectedTotal)} hrs. Something might need to shift.`,
    overloaded: `You're over capacity at ~${Math.round(data.projectedTotal)} hrs. Time to push something to next week.`,
  };

  const tipSets: Record<BurnoutRisk, string[]> = {
    on_track: [
      `You're finishing by ${finishTime} most days — keep that boundary. It's what keeps next week manageable too.`,
      bigJob ? `${bigJob.client_name}'s job (${bigJob.labour_hours} hrs) is your biggest upcoming piece — block the time now so it doesn't creep into evenings.` : `Block your biggest job in the calendar so it doesn't drift into evenings.`,
      `With ${data.daysRemaining} day${data.daysRemaining === 1 ? "" : "s"} left, you have room — but don't book anything else without checking this forecast first.`,
    ],
    watch: [
      bigJob ? `${bigJob.client_name}'s job is ${bigJob.labour_hours} hrs — if it runs over, you'll blow your ${prefs.max_weekly_hours}hr limit. Flag it now.` : `Your biggest job is the risk — flag it if it looks like running over.`,
      `Protect your ${finishTime} finish. No new bookings this week unless something else moves.`,
      data.daysRemaining > 0 ? `${data.daysRemaining} work day${data.daysRemaining === 1 ? "" : "s"} left — push any non-urgent admin to Monday morning.` : `Week's nearly done. Don't add anything new — let it close out.`,
    ],
    at_risk: [
      bigJob ? `Consider moving ${bigJob.client_name}'s job (${bigJob.labour_hours} hrs) to next week — it's your biggest single block and would bring this week into a safer range.` : `Push your biggest upcoming job to next week — it's the fastest way to get back into range.`,
      `Let the assistant draft a polite delay message for any client you're rescheduling — takes 30 seconds.`,
      `Your ${finishTime} finish is important — working past it when you're already over capacity compounds fatigue fast.`,
    ],
    overloaded: [
      bigJob ? `You need to move at least one job. ${bigJob.client_name}'s (${bigJob.labour_hours} hrs) is the logical one to push — it's your largest and likely most reschedulable.` : `Something has to move to next week. Look at your pipeline and pick the most reschedulable job.`,
      `Call or text clients today before they're expecting you — rescheduling is fine, no-showing isn't.`,
      `Once this week closes, set a firm cap: no more than ${prefs.max_weekly_hours} hrs booked before the week starts. Use this forecast as your check.`,
    ],
  };

  return { summary: summaries[risk], tips: tipSets[risk] };
}

async function buildClaudeTips(
  risk: BurnoutRisk,
  prefs: WorkPreferences,
  data: ReturnType<typeof calcWorkload>,
): Promise<{ summary: string; tips: string[] }> {
  const finishTime = `${prefs.preferred_finish_hour > 12 ? prefs.preferred_finish_hour - 12 : prefs.preferred_finish_hour}${prefs.preferred_finish_hour >= 12 ? "pm" : "am"}`;
  const riskLabel = { on_track: "On track", watch: "Watch", at_risk: "At risk", overloaded: "Overloaded" }[risk];
  const pipelineDesc = data.pipelineJobs
    .map((j) => `  - ${j.client_name}: ${j.description.slice(0, 50)} (${j.labour_hours} hrs, status: ${j.status})`)
    .join("\n");

  const prompt = `You are Ghostly, a friendly AI admin assistant for NZ tradies.

User work preferences:
- Preferred finish time: ${finishTime}
- Max weekly hours: ${prefs.max_weekly_hours}
- Works weekends: ${prefs.work_weekends ? "yes" : "no"}

This week's workload:
- Hours logged so far: ${data.loggedThisWeek} hrs
- Pipeline (upcoming jobs):
${pipelineDesc || "  - None"}
- Projected total: ${Math.round(data.projectedTotal)} hrs
- Utilisation: ${data.utilizationPct}% of ${prefs.max_weekly_hours}hr limit
- Burnout risk: ${riskLabel}
- Work days remaining this week: ${data.daysRemaining}

Write exactly 2-3 forward-looking tips to help the user manage their workload. Rules:
- Reference specific client names and hours where helpful
- Respect their preferred finish time — mention it if relevant
- 1-2 sentences per tip, no numbering
- Tone: straight-talking Kiwi mate — practical, not preachy
- If risk is at_risk or overloaded, be direct about what needs to move

Also write one short summary sentence (max 18 words) about how this week is looking.

Respond with valid JSON only, no markdown:
{"summary": "...", "tips": ["...", "...", "..."]}`;

  const message = await claudeClient.messages.create(
    {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    },
    { timeout: CLAUDE_TIMEOUT_MS },
  );

  const text = message.content.find((b) => b.type === "text")?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in Claude response");
  const parsed = JSON.parse(match[0]) as { summary?: string; tips?: string[] };
  if (!Array.isArray(parsed.tips) || parsed.tips.length < 2) throw new Error("Bad tips format");
  return { summary: parsed.summary ?? "", tips: parsed.tips.slice(0, 3) };
}

export async function GET() {
  console.log("[GET /api/brain/workload-forecast] called");

  const settings = demoStore.settings.get();
  const prefs = settings.work_preferences;
  const data = calcWorkload(prefs);

  let summary: string;
  let tips: string[];

  if (getEnvVar("ANTHROPIC_API_KEY")) {
    try {
      const result = await buildClaudeTips(data.risk, prefs, data);
      summary = result.summary;
      tips = result.tips;
    } catch (err) {
      console.error("[workload-forecast] Claude failed, using fallback:", err);
      const fallback = buildFallbackTips(data.risk, prefs, data);
      summary = fallback.summary;
      tips = fallback.tips;
    }
  } else {
    const fallback = buildFallbackTips(data.risk, prefs, data);
    summary = fallback.summary;
    tips = fallback.tips;
  }

  const response: WorkloadForecastResponse = {
    risk: data.risk,
    logged_hours: data.loggedThisWeek,
    pipeline_hours: Math.round(data.pipelineHours * 10) / 10,
    projected_total: Math.round(data.projectedTotal * 10) / 10,
    max_weekly_hours: prefs.max_weekly_hours,
    utilization_pct: data.utilizationPct,
    days_remaining: data.daysRemaining,
    hours_per_day_remaining: data.hoursPerDayRemaining,
    summary,
    tips,
    pipeline_jobs: data.pipelineJobs,
  };

  console.log("[workload-forecast] risk:", data.risk, "projected:", data.projectedTotal);
  return NextResponse.json(response);
}
