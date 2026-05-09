import { headers } from "next/headers";
import Link from "next/link";
import { Pill } from "@/components/ui/primitives";
import { DeleteRecordButton } from "@/components/ui/DeleteRecordButton";

type InvoiceSummary = {
  id: string;
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
  console.log("[InvoicesPage] fetching /api/invoices");
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const res = await fetch(protocol + "://" + host + "/api/invoices", { cache: "no-store" });
  if (!res.ok) {
    console.error("[InvoicesPage] failed to load invoices:", res.status);
    return [];
  }
  const data = await res.json();
  console.log("[InvoicesPage] loaded", data.invoices?.length ?? 0, "invoices");
  return data.invoices ?? [];
}

function statusTone(status: string): { bg: string; fg: string } {
  if (status === "paid") return { bg: "#D1FAE5", fg: "#065F46" };
  if (status === "sent") return { bg: "#DBEAFE", fg: "#1E3A8A" };
  return { bg: "#FEF3C7", fg: "#92400E" };
}

function money(value: number) {
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(value);
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #F8FAFC)", color: "var(--ink, #0B1220)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <section style={{ background: "#fff", borderRadius: 18, border: "1px solid var(--border, #E2E8F0)", padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>All invoices</div>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted, #64748B)" }}>
              {invoices.length} invoice{invoices.length === 1 ? "" : "s"} on file
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invoices.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>
                No invoices yet. Capture a completed job from the Dashboard page or draft one from a job&rsquo;s detail page.
              </p>
            )}
            {invoices.map((invoice) => {
              const tone = statusTone(invoice.status);
              return (
                <div
                  key={invoice.id}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderRadius: 14, border: "1px solid var(--border, #E2E8F0)", background: "var(--bg, #F8FAFC)", color: "var(--ink, #0B1220)" }}
                >
                  <Link href={"/invoices/" + invoice.id} style={{ flex: 1, minWidth: 0, color: "inherit", textDecoration: "none" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      <Pill style={{ background: tone.bg, color: tone.fg }}>{titleCase(invoice.status)}</Pill>
                      <Pill tone="soft">Due {new Date(invoice.due_date).toLocaleDateString("en-NZ")}</Pill>
                      <Pill tone="soft">Created {new Date(invoice.created_at).toLocaleDateString("en-NZ")}</Pill>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{invoice.client_name}</div>
                    <div style={{ fontSize: 13, color: "var(--muted, #64748B)", marginTop: 2 }}>{invoice.location}</div>
                    <div style={{ fontSize: 13, color: "var(--muted, #64748B)", marginTop: 4, lineHeight: 1.45 }}>{invoice.description}</div>
                  </Link>
                  <div style={{ flexShrink: 0, textAlign: "right", display: "grid", gap: 8, justifyItems: "end" }}>
                    <div style={{ background: "#fff", border: "1px solid var(--border, #E2E8F0)", borderRadius: 12, padding: "10px 14px", minWidth: 110 }}>
                    <div style={{ fontSize: 11, color: "var(--muted, #64748B)", fontWeight: 600 }}>Total</div>
                    <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{money(invoice.total)}</div>
                    </div>
                    <DeleteRecordButton endpoint={"/api/invoices?id=" + invoice.id} label="Remove" confirmLabel="Delete invoice" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
