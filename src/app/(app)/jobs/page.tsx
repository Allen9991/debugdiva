import Link from "next/link";
import { headers } from "next/headers";
import { Eyebrow, Pill } from "@/components/ui/primitives";

type JobStatus =
  | "new"
  | "quoted"
  | "approved"
  | "in_progress"
  | "completed"
  | "invoiced"
  | "paid";

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
  console.log("[JobsPage] fetching /api/jobs");
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const response = await fetch(protocol + "://" + host + "/api/jobs", { cache: "no-store" });
  if (!response.ok) {
    console.error("[JobsPage] failed to load jobs:", response.status);
    return [];
  }
  const data = await response.json();
  console.log("[JobsPage] loaded", data.jobs?.length ?? 0, "jobs");
  return data.jobs ?? [];
}

function statusTone(status: JobStatus): { bg: string; fg: string } {
  const map: Record<JobStatus, { bg: string; fg: string }> = {
    new: { bg: "#DBEAFE", fg: "#1E3A8A" },
    quoted: { bg: "#EDE9FE", fg: "#5B21B6" },
    approved: { bg: "#DBEAFE", fg: "#1E3A8A" },
    in_progress: { bg: "#FEF3C7", fg: "#92400E" },
    completed: { bg: "#D1FAE5", fg: "#065F46" },
    invoiced: { bg: "#EDE9FE", fg: "#5B21B6" },
    paid: { bg: "#D1FAE5", fg: "#065F46" },
  };
  return map[status] ?? map.new;
}

function formatStatus(status: JobStatus) {
  return status.replace("_", " ");
}

function materialsTotal(materials: { name: string; cost: number }[]) {
  return materials.reduce((sum, item) => sum + item.cost, 0);
}

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #F8FAFC)", color: "var(--ink, #0B1220)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <Eyebrow>Job memory</Eyebrow>
            <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Jobs</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--muted, #64748B)", lineHeight: 1.5 }}>
              Every job keeps the client, location, materials, captures, invoices, and follow-ups in one place.
            </p>
          </div>
          <Link
            href="/jobs/new"
            style={{ height: 38, padding: "0 16px", borderRadius: 10, background: "var(--accent, #FF5E4D)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            + New job
          </Link>
        </header>

        <section style={{ background: "#fff", borderRadius: 18, border: "1px solid var(--border, #E2E8F0)", padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>Active jobs</div>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted, #64748B)" }}>
              {jobs.length} job{jobs.length === 1 ? "" : "s"} on file
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {jobs.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>
                No jobs yet. Create one with the button above or capture a voice note from the Today page.
              </p>
            )}
            {jobs.map((job) => {
              const tone = statusTone(job.status);
              return (
                <Link
                  key={job.id}
                  href={"/jobs/" + job.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderRadius: 14, border: "1px solid var(--border, #E2E8F0)", background: "var(--bg, #F8FAFC)", textDecoration: "none", color: "var(--ink, #0B1220)" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      <Pill style={{ background: tone.bg, color: tone.fg }}>{formatStatus(job.status)}</Pill>
                      <Pill tone="soft">{job.labour_hours}h labour</Pill>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{job.client_name}</div>
                    <div style={{ fontSize: 13, color: "var(--muted, #64748B)", marginTop: 2 }}>{job.location}</div>
                    <div style={{ fontSize: 13, color: "var(--muted, #64748B)", marginTop: 4, lineHeight: 1.45 }}>{job.description}</div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right", background: "#fff", border: "1px solid var(--border, #E2E8F0)", borderRadius: 12, padding: "10px 14px", minWidth: 110 }}>
                    <div style={{ fontSize: 11, color: "var(--muted, #64748B)", fontWeight: 600 }}>Materials</div>
                    <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>
                      ${materialsTotal(job.materials).toFixed(2)}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted, #64748B)", marginTop: 2 }}>
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
