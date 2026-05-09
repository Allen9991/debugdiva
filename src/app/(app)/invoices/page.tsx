import Link from "next/link";
import { GhostlyFrame } from "@/components/shell/GhostlyFrame";
import { Card, Eyebrow, Pill } from "@/components/ui/primitives";
import { getBaseUrl } from "@/lib/server/base-url";

type InvoiceSummary = {
  job_id: string;
  client_name: string;
  location: string;
  description: string;
  total: number;
  status: "draft" | "sent" | "paid";
  due_date: string;
  created_at: string;
};

async function getInvoices(): Promise<InvoiceSummary[]> {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/output/invoices`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load invoices");
  }

  const data = await res.json();
  return data.invoices;
}

function money(value: number) {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(value);
}

function statusTone(status: InvoiceSummary["status"]): "amber" | "accent" | "emerald" {
  if (status === "paid") return "emerald";
  if (status === "sent") return "accent";
  return "amber";
}

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  const paidTotal = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const draftCount = invoices.filter((invoice) => invoice.status === "draft").length;
  const outstanding = invoices
    .filter((invoice) => invoice.status !== "paid")
    .reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <GhostlyFrame
      eyebrow="Output zone"
      title="Invoices that feel ready to send."
      description="Ghostly keeps the handoff from job note to polished invoice fast, editable, and trustworthy so cash can move without the late-night admin scramble."
      aside={<InvoicesAside outstanding={outstanding} draftCount={draftCount} paidTotal={paidTotal} />}
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
            <InvoiceMetric label="Outstanding" value={money(outstanding)} helper="Draft or sent invoices still to collect" />
            <InvoiceMetric label="Draft invoices" value={String(draftCount)} helper="Ready for review before sending" />
            <InvoiceMetric label="Paid so far" value={money(paidTotal)} helper="Cash already back in the business" />
          </div>
        </Card>

        <div style={{ display: "grid", gap: 14 }}>
          {invoices.map((invoice) => (
            <Link
              key={invoice.job_id}
              href={`/invoices/${invoice.job_id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <Card padding={20}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Pill tone={statusTone(invoice.status)}>{invoice.status}</Pill>
                        <Pill tone="outline">
                          Due {new Date(invoice.due_date).toLocaleDateString("en-NZ")}
                        </Pill>
                      </div>
                      <h2 style={{ margin: "12px 0 0", fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
                        {invoice.client_name}
                      </h2>
                      <p style={{ margin: "5px 0 0", fontSize: 14.5, color: "var(--muted)" }}>
                        {invoice.location}
                      </p>
                    </div>

                    <div className="tabular-nums" style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--muted)" }}>
                        Total
                      </div>
                      <div style={{ marginTop: 6, fontSize: 26, fontWeight: 800, letterSpacing: -0.7 }}>
                        {money(invoice.total)}
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--ink)" }}>
                    {invoice.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </GhostlyFrame>
  );
}

function InvoiceMetric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div style={{ borderRadius: 16, border: "1px solid var(--border)", background: "#fff", padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "var(--muted)" }}>
        {label}
      </div>
      <div className="tabular-nums" style={{ marginTop: 8, fontSize: 28, fontWeight: 800, letterSpacing: -0.7 }}>
        {value}
      </div>
      <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.5, color: "var(--muted)" }}>
        {helper}
      </p>
    </div>
  );
}

function InvoicesAside({
  outstanding,
  draftCount,
  paidTotal,
}: {
  outstanding: number;
  draftCount: number;
  paidTotal: number;
}) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card padding={18}>
        <Eyebrow>Cashflow pulse</Eyebrow>
        <div className="tabular-nums" style={{ marginTop: 8, fontSize: 30, fontWeight: 800, letterSpacing: -0.8 }}>
          {money(outstanding)}
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>
          Still sitting in the pipeline. For the Sunday demo, this is where Ghostly proves it is not just neat, it gets businesses paid faster.
        </p>
      </Card>

      <Card padding={18}>
        <Eyebrow>AI angle</Eyebrow>
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <Pill tone="amber">{draftCount} draft invoices to review</Pill>
          <Pill tone="emerald">{money(paidTotal)} already paid</Pill>
        </div>
      </Card>

      <Card padding={18}>
        <Eyebrow>Best demo step</Eyebrow>
        <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.6, color: "var(--muted)" }}>
          Open Sarah&rsquo;s draft after capture, show the GST breakdown, then hold to approve and send.
        </p>
      </Card>
    </div>
  );
}
