import { headers } from "next/headers";
import Link from "next/link";
import { Eyebrow, Pill } from "@/components/ui/primitives";

type JobStatus = "new" | "quoted" | "approved" | "in_progress" | "completed" | "invoiced" | "paid";

type Job = {
  id: string;
  client_name: string;
  location: string;
  description: string;
  status: JobStatus;
  labour_hours: number;
  materials: { name: string; cost: number }[];
};

async function getJobs(): Promise<Job[]> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const response = await fetch(`${protocol}://${host}/api/jobs`, { cache: "no-store" });
  if (!response.ok) throw new Error("Failed to load jobs");
  const data = await response.json();
  return data.jobs;
}

function statusTone(status: JobStatus): { bg: string; fg: string } {
  const map: Record<JobStatus, { bg: string; fg: string }> = {
    new:         { bg: "var(--focus-soft)",  fg: "var(--focus)" },
    quoted:      { bg: "var(--quote-bg)",    fg: "var(--quote-fg)" },
    approved:    { bg: "var(--focus-soft)",  fg: "var(--focus)" },
    in_progress: { bg: "var(--amber-bg)",    fg: "var(--amber-fg)" },
    completed:   { bg: "var(--draft-bg)",    fg: "var(--draft-fg)" },
    invoiced:    { bg: "var(--quote-bg)",    fg: "var(--quote-fg)" },
    paid:        { bg: "var(--emerald-bg)",  fg: "var(--emerald-fg)" },
  };
  return map[status];
}

function formatStatus(status: JobStatus) {
  return status.replace("_", " ");
}

function materialsTotal(materials: { name: string; cost: number }[]) {
  return materials.reduce((sum, item) => sum + item.cost, 0);
}

const NAV = [
  { label: "Today", href: "/" },
  { label: "Jobs", href: "/jobs", active: true },
  { label: "Invoices", href: "/invoices" },
  { label: "Quotes", href: "/quotes" },
  { label: "Assistant", href: "/assistant" },
];

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        <header>
          <Eyebrow>Job memory</Eyebrow>
          <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Jobs</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>
            Every job keeps the client, location, materials, captures, invoices, and follow-ups in one place.
          </p>
        </header>

        <nav className="gh-mobile-only" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                background: item.active ? "var(--accent)" : "var(--surface)",
                color: item.active ? "#fff" : "var(--muted)",
                border: `1px solid ${item.active ? "transparent" : "var(--border)"}`,
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <section
          style={{
            background: "var(--surface)",
            borderRadius: "var(--radius-card-lg)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
            padding: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Active jobs</div>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>
                Demo plumber jobs for Ghost Plumbing
              </p>
            </div>
            <button
              style={{
                height: 38,
                padding: "0 16px",
                borderRadius: 10,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              + New job
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {jobs.map((job) => {
              const tone = statusTone(job.status);
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    textDecoration: "none",
                    color: "var(--ink)",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      <Pill style={{ background: tone.bg, color: tone.fg }}>{formatStatus(job.status)}</Pill>
                      <Pill tone="soft">{job.labour_hours}h labour</Pill>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{job.client_name}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{job.location}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, lineHeight: 1.45 }}>{job.description}</div>
                  </div>
                  <div
                    style={{
                      flexShrink: 0,
                      textAlign: "right",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "10px 14px",
                      minWidth: 110,
                    }}
                  >
                    <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Materials</div>
                    <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
                      ${materialsTotal(job.materials).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {job.materials.length} item{job.materials.length === 1 ? "" : "s"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
