import Link from "next/link";
import { Mahi } from "@/components/mahi";
import { MahiTag } from "@/components/ui/primitives";
import { FloatingMahiChat } from "./FloatingMahiChat";

type Priority = "high" | "medium" | "low";

export type DesktopPendingAction = {
  type: "send_invoice" | "follow_up_quote" | "attach_receipt" | "missing_info";
  label: string;
  job_id?: string;
  priority: Priority;
};

export type DesktopJob = {
  id: string;
  client_name: string;
  location: string | null;
  description: string;
  status: string;
  labour_hours: number | null;
  materials: { name: string; cost?: number | null }[];
};

export type DesktopStats = {
  jobs_today: number;
  unpaid_invoices: number;
  quotes_pending: number;
  receipts_unlinked: number;
};

export interface DesktopTodayProps {
  stats: DesktopStats;
  pendingActions: DesktopPendingAction[];
  jobs: DesktopJob[];
  brainSummary?: string | null;
  outstandingTotal: number;
  cashflowToday: number;
}

const NAV: { id: string; label: string; href: string; icon: keyof typeof ICONS }[] = [
  { id: "today", label: "Today", href: "/", icon: "home" },
  { id: "jobs", label: "Jobs", href: "/jobs", icon: "jobs" },
  { id: "invoices", label: "Invoices", href: "/invoices", icon: "inv" },
  { id: "quotes", label: "Quotes", href: "/quotes", icon: "quotes" },
  { id: "capture", label: "Capture", href: "/capture", icon: "rec" },
  { id: "assistant", label: "Assistant", href: "/assistant", icon: "cli" },
];

const ICONS = {
  home: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7H10v7H6a2 2 0 01-2-2v-9z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
  jobs: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  inv: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6 3h9l4 4v14H6V3z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M9 12h7M9 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  quotes: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M5 7h14M5 12h10M5 17h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  rec: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
  cli: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
};

function formatNzd(n: number) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

function statusTone(status: string): { bg: string; fg: string; label: string } {
  if (status === "paid" || status === "invoiced")
    return { bg: "var(--emerald-bg)", fg: "var(--emerald-fg)", label: "Paid" };
  if (status === "quoted")
    return { bg: "var(--quote-bg)", fg: "var(--quote-fg)", label: "Quote" };
  if (status === "completed")
    return { bg: "var(--draft-bg)", fg: "var(--draft-fg)", label: "Draft" };
  return { bg: "var(--focus-soft)", fg: "var(--muted)", label: status };
}

function jobAmount(job: DesktopJob): number {
  const labour = (job.labour_hours ?? 0) * 95;
  const materials = job.materials.reduce(
    (sum, m) => sum + (m.cost ?? 0),
    0,
  );
  return labour + materials;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DesktopToday({
  stats,
  pendingActions,
  jobs,
  brainSummary,
  outstandingTotal,
  cashflowToday,
}: DesktopTodayProps) {
  const today = new Date();
  const dateLabel = today
    .toLocaleDateString("en-NZ", {
      weekday: "long",
      day: "numeric",
      month: "short",
    })
    .toUpperCase();

  const recentJobs = jobs.slice(0, 4);
  const topActions = pendingActions.slice(0, 3);
  const cashflowWeek = outstandingTotal + cashflowToday;

  return (
      <main style={{ overflow: "auto", position: "relative", minHeight: "100vh", background: "var(--bg-desktop)", color: "var(--ink)" }}>
        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 28px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(244,239,232,0.85)",
            backdropFilter: "blur(8px)",
            position: "sticky",
            top: 0,
            zIndex: 5,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.4,
                color: "var(--muted)",
                textTransform: "uppercase",
              }}
            >
              {dateLabel}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginTop: 1 }}>
              Today
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SearchBox />
            <IconBtn label="?">?</IconBtn>
            <IconBtn label="Notifications">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 18l1.8-2V11a5.2 5.2 0 0110.4 0v5l1.8 2v1H5v-1z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M10 21h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </IconBtn>
            <Link
              href="/capture"
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 10,
                background: "var(--ink)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(11,18,32,0.18)",
              }}
            >
              + New job
            </Link>
          </div>
        </div>

        {/* HERO */}
        <section style={{ padding: "24px 28px 0" }}>
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 20,
              padding: "24px 28px",
              background:
                "linear-gradient(135deg, var(--accent) 0%, #1A5155 80%, var(--ink) 200%)",
              color: "#fff",
              boxShadow: "0 14px 36px rgba(44,122,123,0.25)",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: -50,
                right: 80,
                width: 200,
                height: 200,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                bottom: -80,
                right: -40,
                width: 240,
                height: 240,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
              }}
            />
            <div style={{ position: "absolute", right: 30, top: 16 }}>
              <Mahi size={140} mood="cheer" accent="var(--mahi-yellow)" hardhat />
            </div>

            <div style={{ position: "relative", maxWidth: "60%" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1.6,
                  opacity: 0.85,
                  textTransform: "uppercase",
                }}
              >
                Kia ora, Mike
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: -1,
                  lineHeight: 1.1,
                  marginTop: 6,
                }}
              >
                Mōrena. {pendingActions.length} thing
                {pendingActions.length === 1 ? "" : "s"} to wrap up before tomorrow.
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
                <Link
                  href="/capture"
                  style={{
                    height: 42,
                    padding: "0 16px",
                    borderRadius: 10,
                    background: "#fff",
                    color: "var(--ink)",
                    fontSize: 13.5,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
                      <rect x="9" y="3" width="6" height="12" rx="3" />
                      <path
                        d="M5 11a7 7 0 0014 0M12 18v3"
                        stroke="#fff"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  Tell Mahi about a job
                </Link>
                <Link
                  href="/invoices"
                  style={{
                    height: 42,
                    padding: "0 16px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.16)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.25)",
                    fontSize: 13.5,
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    textDecoration: "none",
                  }}
                >
                  Review drafts ({stats.unpaid_invoices})
                </Link>
              </div>
            </div>

            {/* Stat strip */}
            <div
              style={{
                position: "relative",
                marginTop: 24,
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              <StatTile n={stats.jobs_today} label="Jobs today" sub="Captured today" />
              <StatTile
                n={formatNzd(outstandingTotal)}
                label="Outstanding"
                sub={`${stats.quotes_pending} quote${stats.quotes_pending === 1 ? "" : "s"} pending`}
              />
              <StatTile
                n={stats.receipts_unlinked}
                label="Loose receipts"
                sub="Ready to attach"
              />
              <StatTile
                n={`${jobs.length}`}
                label="Active jobs"
                sub="In progress"
              />
            </div>
          </div>
        </section>

        {/* CONTENT GRID */}
        <section
          style={{
            padding: "20px 28px 28px",
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 18,
          }}
        >
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Mahi summary */}
            <div
              style={{
                padding: "16px 18px",
                borderRadius: 16,
                border: "1px solid var(--amber-border)",
                background: "#FFFBEB",
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
              }}
            >
              <Mahi size={48} mood="happy" />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <MahiTag />
                  <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
                    {brainSummary ? "Live" : "Heuristic"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    color: "var(--ink)",
                    margin: "6px 0 0",
                  }}
                >
                  {brainSummary ??
                    `${pendingActions.length} action${pendingActions.length === 1 ? "" : "s"} on the board today. ${stats.unpaid_invoices} invoice${stats.unpaid_invoices === 1 ? "" : "s"} still need following up, ${stats.receipts_unlinked} loose receipt${stats.receipts_unlinked === 1 ? "" : "s"} need attaching.`}
                </p>
                <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {topActions.map((a, i) => (
                    <Chip key={i} href={a.job_id ? `/jobs/${a.job_id}` : "/capture"}>
                      {shortActionLabel(a)}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            {/* Pending actions */}
            <Panel
              title="Pending actions"
              badge={pendingActions.length ? String(pendingActions.length) : undefined}
            >
              {pendingActions.length === 0 && (
                <div style={{ padding: "18px 18px", color: "var(--muted)", fontSize: 13.5 }}>
                  Nothing pending — Mahi is keeping an eye on the day.
                </div>
              )}
              {pendingActions.slice(0, 5).map((a, i) => {
                const job = jobs.find((j) => j.id === a.job_id);
                const amount = job ? jobAmount(job) : null;
                return (
                  <DTRow
                    key={`${a.label}-${i}`}
                    priority={a.priority}
                    title={a.label}
                    meta={job ? `${job.location ?? ""} · ${job.description}` : actionTypeLabel(a.type)}
                    amount={amount != null ? formatNzd(amount) : ""}
                    href={a.job_id ? `/jobs/${a.job_id}` : "/capture"}
                  />
                );
              })}
            </Panel>

            {/* Recent jobs */}
            <Panel title="Recent jobs" link={`View all (${jobs.length})`} linkHref="/jobs">
              {recentJobs.map((job) => {
                const tone = statusTone(job.status);
                return (
                  <DJobRow
                    key={job.id}
                    href={`/jobs/${job.id}`}
                    client={job.client_name}
                    loc={job.location ?? ""}
                    desc={job.description}
                    amount={formatNzd(jobAmount(job))}
                    tone={tone}
                  />
                );
              })}
              {recentJobs.length === 0 && (
                <div style={{ padding: 18, color: "var(--muted)", fontSize: 13.5 }}>
                  No jobs yet. Capture your first one.
                </div>
              )}
            </Panel>
          </div>

          {/* RIGHT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Voice capture widget */}
            <Link
              href="/capture"
              style={{
                padding: 18,
                borderRadius: 16,
                background: "var(--ink)",
                color: "#fff",
                position: "relative",
                overflow: "hidden",
                textDecoration: "none",
                display: "block",
              }}
            >
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: -40,
                  right: -30,
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: "rgba(44,122,123,0.13)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--accent)",
                    boxShadow: "0 0 0 4px rgba(44,122,123,0.2)",
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 1.4,
                    textTransform: "uppercase",
                    opacity: 0.7,
                  }}
                >
                  Voice capture
                </span>
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  marginTop: 6,
                  lineHeight: 1.45,
                  position: "relative",
                }}
              >
                Between jobs? Talk Mahi through one — he&rsquo;ll write the invoice.
              </div>
              <div
                style={{
                  marginTop: 14,
                  height: 44,
                  padding: "0 16px",
                  borderRadius: 10,
                  background: "var(--accent)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 6px 18px rgba(44,122,123,0.4)",
                  position: "relative",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="3" width="6" height="12" rx="3" fill="#fff" />
                  <path
                    d="M5 11a7 7 0 0014 0M12 18v3"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Hold space to talk
              </div>
            </Link>

            {/* Cashflow */}
            <div
              style={{
                borderRadius: 16,
                background: "#fff",
                border: "1px solid var(--border)",
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  Cashflow this week
                </div>
                <span style={{ fontSize: 22 }}>⛅</span>
              </div>
              <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 8 }}>
                <div
                  className="tabular-nums"
                  style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8 }}
                >
                  {formatNzd(cashflowWeek)}
                </div>
                {cashflowToday > 0 && (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: "var(--emerald-fg)",
                      fontWeight: 700,
                    }}
                  >
                    + {formatNzd(cashflowToday)} today
                  </div>
                )}
              </div>
              <div
                style={{
                  marginTop: 14,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 6,
                  height: 56,
                }}
              >
                {[24, 38, 18, 0, 30, 56, 42].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: `${h}%`,
                        background: i === 6 ? "var(--accent)" : "var(--border-strong)",
                        borderRadius: 4,
                        minHeight: 2,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 9.5,
                        color: "var(--faint)",
                        fontWeight: 700,
                      }}
                    >
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div
              style={{
                borderRadius: 16,
                background: "#fff",
                border: "1px solid var(--border)",
                padding: 18,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    color: "var(--muted)",
                  }}
                >
                  Schedule
                </div>
                <span style={{ fontSize: 11, color: "var(--faint)", fontWeight: 600 }}>
                  Tomorrow
                </span>
              </div>
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {recentJobs.slice(0, 3).map((job, i) => (
                  <ScheduleRow
                    key={job.id}
                    time={["08:30", "11:00", "14:30"][i] ?? "—"}
                    client={job.client_name}
                    what={job.description.slice(0, 40)}
                    color={i === 0 ? "var(--accent)" : "var(--faint)"}
                  />
                ))}
                {recentJobs.length === 0 && (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    Open day — nothing booked.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <FloatingMahiChat />
      </main>
  );
}

function actionTypeLabel(type: DesktopPendingAction["type"]) {
  if (type === "send_invoice") return "Invoice action";
  if (type === "follow_up_quote") return "Quote follow-up";
  if (type === "attach_receipt") return "Receipt to attach";
  return "Missing info";
}

function shortActionLabel(a: DesktopPendingAction) {
  if (a.type === "send_invoice") return "Send invoice";
  if (a.type === "follow_up_quote") return "Nudge quote";
  if (a.type === "attach_receipt") return "Attach receipt";
  return a.label.slice(0, 24);
}

function StatTile({ n, label, sub }: { n: number | string; label: string; sub: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.13)",
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 14,
        padding: "12px 14px",
      }}
    >
      <div
        className="tabular-nums"
        style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}
      >
        {n}
      </div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          opacity: 0.85,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginTop: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{sub}</div>
    </div>
  );
}

function SearchBox() {
  return (
    <div
      style={{
        width: 280,
        height: 36,
        borderRadius: 10,
        background: "#fff",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "0 12px",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="7" stroke="var(--faint)" strokeWidth="1.8" />
        <path d="M16 16l4 4" stroke="var(--faint)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span style={{ flex: 1, fontSize: 12.5, color: "var(--faint)" }}>
        Search jobs, clients, receipts…
      </span>
      <span
        style={{
          fontSize: 10,
          color: "var(--faint)",
          padding: "2px 6px",
          border: "1px solid var(--border)",
          borderRadius: 4,
          fontWeight: 700,
        }}
      >
        ⌘K
      </span>
    </div>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        console.log("[DesktopToday IconBtn] clicked:", label);
        onClick?.();
      }}
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: "#fff",
        border: "1px solid var(--border)",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--muted)",
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  badge,
  link,
  linkHref,
  children,
}: {
  title: string;
  badge?: string;
  link?: string;
  linkHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            {title}
          </div>
          {badge && (
            <span
              style={{
                fontSize: 10.5,
                padding: "2px 6px",
                borderRadius: 999,
                background: "var(--draft-bg)",
                color: "var(--draft-fg)",
                fontWeight: 700,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        {link && (
          <Link
            href={linkHref ?? "#"}
            style={{
              color: "var(--muted)",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            {link} →
          </Link>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function DTRow({
  priority,
  title,
  meta,
  amount,
  href,
}: {
  priority: Priority;
  title: string;
  meta: string;
  amount: string;
  href: string;
}) {
  const isHigh = priority === "high";
  const dotColor = isHigh ? "var(--amber-bg-hi)" : "var(--faint)";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: dotColor,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
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
          {meta}
        </div>
      </div>
      {amount && (
        <div
          className="tabular-nums"
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "var(--ink)",
            marginRight: 6,
          }}
        >
          {amount}
        </div>
      )}
      <Link
        href={href}
        style={{
          height: 32,
          padding: "0 12px",
          borderRadius: 8,
          background: isHigh ? "var(--accent)" : "#fff",
          color: isHigh ? "#fff" : "var(--ink)",
          border: isHigh ? "none" : "1px solid var(--border-strong)",
          fontSize: 12,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          textDecoration: "none",
          boxShadow: isHigh ? "0 4px 12px rgba(44,122,123,0.33)" : "none",
        }}
      >
        Review
      </Link>
    </div>
  );
}

function DJobRow({
  href,
  client,
  loc,
  desc,
  amount,
  tone,
}: {
  href: string;
  client: string;
  loc: string;
  desc: string;
  amount: string;
  tone: { bg: string; fg: string; label: string };
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderBottom: "1px solid var(--border)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          flexShrink: 0,
          background: "var(--focus-soft)",
          color: "var(--muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {initials(client)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{client}</div>
          <span
            style={{
              height: 18,
              padding: "0 7px",
              borderRadius: 4,
              background: tone.bg,
              color: tone.fg,
              fontSize: 10,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            {tone.label}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            marginTop: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {loc} · {desc}
        </div>
      </div>
      <div
        className="tabular-nums"
        style={{ fontSize: 14.5, fontWeight: 800 }}
      >
        {amount}
      </div>
    </Link>
  );
}

function ScheduleRow({
  time,
  client,
  what,
  color,
}: {
  time: string;
  client: string;
  what: string;
  color: string;
}) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div
        className="tabular-nums"
        style={{
          width: 50,
          fontSize: 12,
          fontWeight: 700,
          color: "var(--muted)",
        }}
      >
        {time}
      </div>
      <div style={{ width: 3, height: 36, borderRadius: 2, background: color }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{client}</div>
        <div
          style={{
            fontSize: 11.5,
            color: "var(--muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {what}
        </div>
      </div>
    </div>
  );
}

function Chip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        height: 24,
        padding: "0 10px",
        borderRadius: 999,
        background: "#fff",
        border: "1px solid var(--border)",
        fontSize: 11.5,
        fontWeight: 600,
        color: "var(--ink)",
        display: "inline-flex",
        alignItems: "center",
        textDecoration: "none",
      }}
    >
      {children}
    </Link>
  );
}
