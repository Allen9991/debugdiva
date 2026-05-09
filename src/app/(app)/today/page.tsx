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
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    (host ? `${protocol}://${host}` : "http://localhost:3000")
  );
}

async function getDashboardData(baseUrl: string): Promise<DashboardData> {
  const response = await fetch(`${baseUrl}/api/dashboard/today`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to load dashboard data");
  return response.json();
}

async function getJobs(baseUrl: string): Promise<DesktopJob[]> {
  try {
    const res = await fetch(`${baseUrl}/api/jobs`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { jobs: DesktopJob[] };
    return data.jobs ?? [];
  } catch {
    return [];
  }
}

async function getBrainSummary(baseUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/api/brain/summary`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { summary?: string };
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

function actionTone(priority: Priority): "amber" | "soft" | "emerald" {
  if (priority === "high") return "amber";
  if (priority === "medium") return "soft";
  return "emerald";
}

function formatDateEyebrow(date = new Date()) {
  return date
    .toLocaleDateString("en-NZ", {
      weekday: "long",
      day: "numeric",
      month: "short",
    })
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
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        paddingBottom: 110,
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, var(--ink) 0%, var(--accent) 200%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Mahi size={22} mood="happy" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: -0.4,
                  lineHeight: 1,
                }}
              >
                Ghostly
              </div>
              <Eyebrow style={{ marginTop: 2 }}>{dateEyebrow}</Eyebrow>
            </div>
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--ink)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            MT
          </div>
        </header>

        {/* Hero gradient card */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: "var(--radius-hero)",
            padding: "24px 22px 22px",
            background:
              "linear-gradient(160deg, var(--accent) 0%, #C8413B 125%)",
            boxShadow: "var(--shadow-hero)",
            color: "#fff",
          }}
        >
          {/* decorative blobs */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: -40,
              right: -30,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.13)",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: -50,
              right: 30,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
            }}
          />

          {/* Mahi peeking */}
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 14,
              transform: "rotate(6deg)",
            }}
          >
            <Mahi size={88} mood="cheer" hardhat />
          </div>

          <div style={{ position: "relative", maxWidth: "60%" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.78)",
              }}
            >
              Kia ora, Mike
            </div>
            <h1
              style={{
                margin: "8px 0 6px",
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: -0.7,
                lineHeight: 1.08,
              }}
            >
              Your admin is under control.
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: 13.5,
                fontWeight: 500,
                lineHeight: 1.45,
                color: "rgba(255,255,255,0.88)",
              }}
            >
              {dashboard.pending_actions.length} thing
              {dashboard.pending_actions.length === 1 ? "" : "s"} need attention
              today.
            </p>
          </div>

          {/* Frosted-glass stat tile strip */}
          <div
            style={{
              position: "relative",
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                style={{
                  background: "rgba(255,255,255,0.16)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  borderRadius: 14,
                  padding: "10px 10px 12px",
                  backdropFilter: "blur(6px)",
                }}
              >
                <div
                  className="tabular-nums"
                  style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.05 }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    color: "rgba(255,255,255,0.85)",
                    marginTop: 2,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mahi summary card (client — thinking → happy) */}
        <MahiSummary />

        {/* Pending actions */}
        <Card padding={18}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <Eyebrow>Pending actions</Eyebrow>
            <Pill tone="soft">{dashboard.pending_actions.length} open</Pill>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {dashboard.pending_actions.map((action, index) => {
              const tone = actionTone(action.priority);
              const ctaIsAccent = action.priority === "high";
              return (
                <div
                  key={`${action.label}-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    background: "var(--surface)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 6,
                      }}
                    >
                      <Pill tone="soft">{actionLabel(action.type)}</Pill>
                      <Pill tone={tone}>{action.priority}</Pill>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--ink)",
                        lineHeight: 1.4,
                      }}
                    >
                      {action.label}
                    </div>
                  </div>
                  <Link
                    href={action.job_id ? `/jobs/${action.job_id}` : "/capture"}
                    style={{
                      flexShrink: 0,
                      height: 38,
                      padding: "0 14px",
                      borderRadius: 10,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                      background: ctaIsAccent ? "var(--accent)" : "var(--ink)",
                      color: "#fff",
                      boxShadow: ctaIsAccent
                        ? "var(--shadow-accent)"
                        : "var(--shadow-elevated)",
                    }}
                  >
                    Review
                  </Link>
                </div>
              );
            })}
            {dashboard.pending_actions.length === 0 && (
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--muted)",
                  margin: "8px 2px",
                }}
              >
                Nothing pending. Mahi is keeping an eye on the day.
              </p>
            )}
          </div>
        </Card>

        {/* Recent jobs */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              padding: "4px 4px 8px",
            }}
          >
            <Eyebrow>Recent jobs</Eyebrow>
            <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 700 }}>
              This week
            </span>
          </div>
          <Card padding={0} style={{ overflow: "hidden" }}>
            {jobs.slice(0, 4).map((job, i) => {
              const tone =
                job.status === "paid" || job.status === "invoiced"
                  ? { p: "emerald" as const, label: "Paid" }
                  : job.status === "quoted"
                    ? { p: "soft" as const, label: "Quote" }
                    : job.status === "completed"
                      ? { p: "amber" as const, label: "Draft" }
                      : { p: "soft" as const, label: job.status };
              const labour = (job.labour_hours ?? 0) * 95;
              const materials = job.materials.reduce(
                (s, m) => s + (m.cost ?? 0),
                0,
              );
              const amount = `$${Math.round(labour + materials)}`;
              return (
                <div key={job.id}>
                  {i > 0 && (
                    <div
                      style={{
                        height: 1,
                        background: "var(--border)",
                        marginLeft: 18,
                      }}
                    />
                  )}
                  <Link
                    href={`/jobs/${job.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "14px 16px",
                      gap: 12,
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14.5,
                            fontWeight: 700,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {job.client_name}
                        </div>
                        <Pill tone={tone.p}>{tone.label}</Pill>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--muted)",
                          marginTop: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {job.location ?? ""}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--faint)",
                          marginTop: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {job.description}
                      </div>
                    </div>
                    <div
                      className="tabular-nums"
                      style={{
                        background: "#F1F5F9",
                        borderRadius: 10,
                        padding: "8px 10px",
                        fontSize: 14,
                        fontWeight: 800,
                        color: "var(--ink)",
                      }}
                    >
                      {amount}
                    </div>
                  </Link>
                </div>
              );
            })}
            {jobs.length === 0 && (
              <div
                style={{
                  padding: 18,
                  fontSize: 13.5,
                  color: "var(--muted)",
                }}
              >
                No jobs yet. Capture your first one.
              </div>
            )}
          </Card>
        </div>

        {/* Speak job CTA — gradient ink → accent */}
        <Link
          href="/capture"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            height: 62,
            borderRadius: 18,
            textDecoration: "none",
            background:
              "linear-gradient(135deg, var(--ink) 0%, var(--accent) 200%)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: -0.2,
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--accent)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 0 4px rgba(255,94,77,0.2)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="3" width="6" height="12" rx="3" fill="#fff" />
              <path
                d="M5 11a7 7 0 0014 0M12 18v3"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </span>
          Tell Mahi about a job
        </Link>
      </div>

      {/* Bottom nav (mobile only) */}
      <nav
        aria-label="Primary"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: 22,
          paddingTop: 8,
          background:
            "linear-gradient(180deg, rgba(248,250,252,0) 0%, var(--bg) 35%)",
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            alignItems: "center",
            padding: "0 8px",
            maxWidth: 720,
            margin: "0 auto",
          }}
        >
          <NavItem href="/today" label="Today" active icon={<HomeIcon />} />
          <NavItem href="/invoices" label="Invoices" icon={<InvIcon />} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Link
              href="/capture"
              aria-label="Capture"
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "var(--ink)",
                color: "#fff",
                marginTop: -22,
                boxShadow:
                  "0 8px 22px rgba(11,18,32,0.35), 0 0 0 4px var(--bg)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="9" y="3" width="6" height="12" rx="3" fill="#fff" />
                <path
                  d="M5 11a7 7 0 0014 0M12 18v3"
                  stroke="#fff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          </div>
          <NavItem href="/jobs" label="Jobs" icon={<JobsIcon />} />
          <NavItem href="/assistant" label="Assistant" icon={<AssistIcon />} />
        </div>
      </nav>
    </main>
    </>
  );
}

function NavItem({
  href,
  label,
  active = false,
  icon,
}: {
  href: string;
  label: string;
  active?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: "6px 0",
        color: active ? "var(--ink)" : "var(--faint)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 0.2,
        textDecoration: "none",
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7H10v7H6a2 2 0 01-2-2v-9z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InvIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 3h9l4 4v14H6V3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 12h7M9 16h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function JobsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function AssistIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6c0-1.1.9-2 2-2h12a2 2 0 012 2v9a2 2 0 01-2 2h-7l-5 4v-4H6a2 2 0 01-2-2V6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}
