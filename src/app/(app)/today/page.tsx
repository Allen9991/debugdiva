import { headers } from "next/headers";
import Link from "next/link";
import { MahiSummary } from "@/components/brain/MahiSummary";
import { CaptureHub } from "@/components/capture/CaptureHub";
import { Mahi } from "@/components/mahi";
import { Card, Eyebrow, Pill } from "@/components/ui/primitives";
import {
  DesktopToday,
  type DesktopJob,
  type DesktopPendingAction,
} from "@/components/today/DesktopToday";

type Priority = "high" | "medium" | "low";

type PendingAction = {
  type: "send_invoice" | "follow_up_quote" | "attach_receipt" | "missing_info";
  label: string;
  job_id?: string;
  priority: Priority;
};

type DashboardData = {
  pending_actions: PendingAction[];
  stats: {
    jobs_today: number;
    unpaid_invoices: number;
    quotes_pending: number;
    receipts_unlinked: number;
  };
};

async function getBaseUrl() {
  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (host ? `${protocol}://${host}` : "http://localhost:3000")
  );
}

async function getDashboardData(baseUrl: string): Promise<DashboardData> {
  console.log("[TodayPage] fetching /api/dashboard/today");
  try {
    const response = await fetch(baseUrl + "/api/dashboard/today", { cache: "no-store" });
    if (!response.ok) {
      console.error("[TodayPage] dashboard fetch failed:", response.status);
      return {
        pending_actions: [],
        stats: { jobs_today: 0, unpaid_invoices: 0, quotes_pending: 0, receipts_unlinked: 0 },
      };
    }
    const data = await response.json();
    console.log(
      "[TodayPage] dashboard returned",
      data.pending_actions?.length ?? 0,
      "pending actions",
    );
    return data;
  } catch (err) {
    console.error("[TodayPage] dashboard fetch threw:", err);
    return {
      pending_actions: [],
      stats: { jobs_today: 0, unpaid_invoices: 0, quotes_pending: 0, receipts_unlinked: 0 },
    };
  }
}

async function getJobs(baseUrl: string): Promise<DesktopJob[]> {
  try {
    const response = await fetch(baseUrl + "/api/jobs", { cache: "no-store" });
    if (!response.ok) return [];
    const data = (await response.json()) as { jobs: DesktopJob[] };
    return data.jobs ?? [];
  } catch {
    return [];
  }
}

async function getBrainSummary(baseUrl: string): Promise<string | null> {
  try {
    const response = await fetch(baseUrl + "/api/brain/summary", { cache: "no-store" });
    if (!response.ok) return null;
    const data = (await response.json()) as { summary?: string };
    return data.summary ?? null;
  } catch {
    return null;
  }
}

function actionLabel(type: PendingAction["type"]) {
  if (type === "send_invoice") return "Invoice";
  if (type === "follow_up_quote") return "Quote";
  if (type === "attach_receipt") return "Receipt";
  return "Missing info";
}

function actionHref(action: PendingAction) {
  if (action.type === "send_invoice" && action.job_id) return "/invoices/" + action.job_id;
  if (action.type === "follow_up_quote") return "/quotes";
  if (action.type === "attach_receipt") {
    return action.job_id ? "/jobs/" + action.job_id + "#captures" : "/capture";
  }
  return action.job_id ? "/jobs/" + action.job_id : "/assistant";
}

function actionTone(priority: Priority): "amber" | "soft" | "emerald" {
  if (priority === "high") return "amber";
  if (priority === "medium") return "soft";
  return "emerald";
}

function formatDateEyebrow(date = new Date()) {
  return date
    .toLocaleDateString("en-NZ", { weekday: "long", day: "numeric", month: "short" })
    .toUpperCase();
}

export default async function TodayPage() {
  const baseUrl = await getBaseUrl();
  const [dashboard, jobs, brainSummary] = await Promise.all([
    getDashboardData(baseUrl),
    getJobs(baseUrl),
    getBrainSummary(baseUrl),
  ]);

  const outstandingTotal = dashboard.stats.unpaid_invoices * 280;
  const cashflowToday = 0;
  const stats = [
    { label: "Jobs", value: dashboard.stats.jobs_today },
    { label: "Drafts", value: dashboard.stats.unpaid_invoices },
    { label: "Quotes", value: dashboard.stats.quotes_pending },
    { label: "Receipts", value: dashboard.stats.receipts_unlinked },
  ];
  const dateEyebrow = formatDateEyebrow();
  const desktopActions: DesktopPendingAction[] = dashboard.pending_actions;

  return (
    <>
      <div className="gh-desktop-only">
        <DesktopToday
          stats={dashboard.stats}
          pendingActions={desktopActions}
          jobs={jobs}
          brainSummary={brainSummary}
          outstandingTotal={outstandingTotal}
          cashflowToday={cashflowToday}
        />
      </div>

      <main
        className="gh-mobile-only"
        style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", paddingBottom: 48 }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, var(--ink) 0%, var(--accent) 200%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Mahi size={22} mood="happy" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1 }}>DebugDiva</div>
                <Eyebrow style={{ marginTop: 2 }}>{dateEyebrow}</Eyebrow>
              </div>
            </div>
          </header>

          <section style={{ position: "relative", overflow: "hidden", borderRadius: "var(--radius-hero)", padding: "24px 22px 22px", background: "linear-gradient(160deg, var(--accent) 0%, #1A5155 125%)", boxShadow: "var(--shadow-hero)", color: "#fff" }}>
            <div style={{ position: "relative", maxWidth: "60%" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,0.78)" }}>Kia ora, Mike</div>
              <h1 style={{ margin: "8px 0 6px", fontSize: 30, fontWeight: 800, letterSpacing: -0.7, lineHeight: 1.08 }}>Your admin is under control.</h1>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, lineHeight: 1.45, color: "rgba(255,255,255,0.88)" }}>
                {dashboard.pending_actions.length} thing{dashboard.pending_actions.length === 1 ? "" : "s"} need attention today.
              </p>
            </div>

            <div style={{ position: "relative", marginTop: 18, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {stats.map((stat) => (
                <div key={stat.label} style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 14, padding: "10px 10px 12px" }}>
                  <div className="tabular-nums" style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.05 }}>{stat.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.3, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </section>

          <MahiSummary />

          <Card padding={18}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Eyebrow>Pending actions</Eyebrow>
              <Pill tone="soft">{dashboard.pending_actions.length} open</Pill>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dashboard.pending_actions.map((action, index) => {
                const tone = actionTone(action.priority);
                const ctaIsAccent = action.priority === "high";
                return (
                  <div key={action.label + "-" + index} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 12px", border: "1px solid var(--border)", borderRadius: 14, background: "var(--surface)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                        <Pill tone="soft">{actionLabel(action.type)}</Pill>
                        <Pill tone={tone}>{action.priority}</Pill>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", lineHeight: 1.4 }}>{action.label}</div>
                    </div>
                    <Link
                      href={actionHref(action)}
                      style={{ flexShrink: 0, height: 38, padding: "0 14px", borderRadius: 10, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, textDecoration: "none", background: ctaIsAccent ? "var(--accent)" : "var(--ink)", color: "#fff" }}
                    >
                      Review
                    </Link>
                  </div>
                );
              })}
              {dashboard.pending_actions.length === 0 && (
                <p style={{ fontSize: 13.5, color: "var(--muted)", margin: "8px 2px" }}>Nothing pending. Mahi is keeping an eye on the day.</p>
              )}
            </div>
          </Card>

          <Card padding={18}>
            <div style={{ marginBottom: 12 }}>
              <Eyebrow>Quick capture</Eyebrow>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, marginTop: 4 }}>Tell Mahi about a job</div>
              <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.45 }}>Speak it while it&apos;s fresh. Mahi will draft the invoice.</p>
            </div>
            <CaptureHub />
          </Card>

          <Link
            href="/capture"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, height: 62, borderRadius: 18, textDecoration: "none", background: "linear-gradient(135deg, var(--ink) 0%, var(--accent) 200%)", color: "#fff", fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}
          >
            Speak a job note
          </Link>
        </div>
      </main>
    </>
  );
}
