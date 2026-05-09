import Link from "next/link";
import { GhostlyFrame } from "@/components/shell/GhostlyFrame";
import { Card, Eyebrow, Pill } from "@/components/ui/primitives";
import { getBaseUrl } from "@/lib/server/base-url";

type JobStatus =
  | "new"
  | "quoted"
  | "approved"
  | "in_progress"
  | "completed"
  | "invoiced"
  | "paid";

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
};

type Job = {
  id: string;
  client_name: string;
  client: Client;
  location: string;
  description: string;
  status: JobStatus;
  labour_hours: number;
  materials: { name: string; cost: number }[];
  created_at: string;
  updated_at: string;
};

type JobsResponse = {
  jobs: Job[];
};

async function getJobs(): Promise<Job[]> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}/api/jobs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load jobs");
  }

  const data: JobsResponse = await response.json();
  return data.jobs;
}

function statusTone(status: JobStatus) {
  const tones: Record<JobStatus, { tone: "soft" | "amber" | "emerald" | "accent"; label: string }> = {
    new: { tone: "soft", label: "New" },
    quoted: { tone: "accent", label: "Quoted" },
    approved: { tone: "soft", label: "Approved" },
    in_progress: { tone: "amber", label: "In progress" },
    completed: { tone: "emerald", label: "Completed" },
    invoiced: { tone: "accent", label: "Invoiced" },
    paid: { tone: "emerald", label: "Paid" },
  };

  return tones[status];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

function materialsTotal(materials: { name: string; cost: number }[]) {
  return materials.reduce((sum, item) => sum + item.cost, 0);
}

export default async function JobsPage() {
  const jobs = await getJobs();
  const completedJobs = jobs.filter((job) => job.status === "completed" || job.status === "paid").length;
  const totalLabour = jobs.reduce((sum, job) => sum + job.labour_hours, 0);

  return (
    <GhostlyFrame
      eyebrow="Job memory"
      title="Every job kept in one place."
      description="Ghostly turns scattered job notes into a usable memory system so client, location, labour, materials, drafts, and follow-ups stay connected."
      aside={<JobsAside jobs={jobs} />}
    >
      <div style={{ display: "grid", gap: 18 }}>
        <Card padding={20}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <Metric label="Total jobs" value={String(jobs.length)} helper="Tracked in the Ghostly demo workspace" />
            <Metric label="Completed" value={String(completedJobs)} helper="Ready to invoice or already paid" />
            <Metric label="Labour hours" value={`${totalLabour}h`} helper="Captured from notes and structured records" />
          </div>
        </Card>

        <div style={{ display: "grid", gap: 14 }}>
          {jobs.map((job) => {
            const status = statusTone(job.status);
            const total = materialsTotal(job.materials) + job.labour_hours * 95;

            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <Card padding={20}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <Pill tone={status.tone}>{status.label}</Pill>
                          <Pill tone="outline">{job.labour_hours}h labour</Pill>
                        </div>
                        <h2 style={{ margin: "12px 0 0", fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
                          {job.client_name}
                        </h2>
                        <p style={{ margin: "5px 0 0", fontSize: 14.5, color: "var(--muted)" }}>
                          {job.location}
                        </p>
                      </div>

                      <div
                        className="tabular-nums"
                        style={{
                          minWidth: 120,
                          textAlign: "right",
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--muted)" }}>
                          Est. value
                        </div>
                        <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, letterSpacing: -0.6 }}>
                          {formatCurrency(total)}
                        </div>
                      </div>
                    </div>

                    <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--ink)" }}>
                      {job.description}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                        gap: 10,
                      }}
                    >
                      <MiniStat label="Materials" value={formatCurrency(materialsTotal(job.materials))} />
                      <MiniStat label="Items used" value={String(job.materials.length)} />
                      <MiniStat label="Updated" value={new Date(job.updated_at).toLocaleDateString("en-NZ")} />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </GhostlyFrame>
  );
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div style={{ borderRadius: 16, background: "#fff", border: "1px solid var(--border)", padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--muted)" }}>
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, letterSpacing: -0.7 }}>
        {value}
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--muted)" }}>
        {helper}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 14,
        background: "rgba(255,255,255,0.72)",
        border: "1px solid var(--border)",
        padding: 14,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", color: "var(--muted)" }}>
        {label}
      </div>
      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function JobsAside({ jobs }: { jobs: Job[] }) {
  const nextJob = jobs[0];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card padding={18}>
        <Eyebrow>How Ghostly helps</Eyebrow>
        <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>
          Tradies do not need another spreadsheet. They need a calm memory. This tab is where messy capture turns into dependable records.
        </p>
      </Card>

      {nextJob ? (
        <Card padding={18}>
          <Eyebrow>Next likely action</Eyebrow>
          <h2 style={{ margin: "8px 0 0", fontSize: 20, fontWeight: 800, letterSpacing: -0.4 }}>
            Review {nextJob.client_name}
          </h2>
          <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>
            Job detail is the anchor point for invoice drafts, material receipts, and follow-up messages.
          </p>
          <Link
            href={`/jobs/${nextJob.id}`}
            style={{
              marginTop: 14,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 42,
              padding: "0 16px",
              borderRadius: 12,
              background: "var(--ink)",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Open job
          </Link>
        </Card>
      ) : null}
    </div>
  );
}
