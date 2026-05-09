import { headers } from "next/headers";
import Link from "next/link";
import { Eyebrow, Pill } from "@/components/ui/primitives";

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
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const res = await fetch(`${protocol}://${host}/api/output/invoices`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load invoices");
  const data = await res.json();
  return data.invoices;
}

function statusTone(status: string): "emerald" | "accent" | "amber" {
  if (status === "paid") return "emerald";
  if (status === "sent") return "accent";
  return "amber";
}

function money(value: number) {
  return new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" }).format(value);
}

const NAV = [
  { label: "Today", href: "/" },
  { label: "Jobs", href: "/jobs" },
  { label: "Invoices", href: "/invoices", active: true },
  { label: "Quotes", href: "/quotes" },
  { label: "Assistant", href: "/assistant" },
];

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Eyebrow>Output zone</Eyebrow>
            <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>Invoices</h1>
            <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--muted)", lineHeight: 1.5 }}>
              Turn completed jobs into professional invoices.
            </p>
          </div>
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
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>All invoices</div>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>
              {invoices.length} invoice{invoices.length === 1 ? "" : "s"} on file
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invoices.map((invoice) => (
              <Link
                key={invoice.job_id}
                href={`/invoices/${invoice.job_id}`}
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
                    <Pill tone={statusTone(invoice.status)}>{invoice.status}</Pill>
                    <Pill tone="soft">Due {new Date(invoice.due_date).toLocaleDateString("en-NZ")}</Pill>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{invoice.client_name}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{invoice.location}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4, lineHeight: 1.45 }}>{invoice.description}</div>
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
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>Total</div>
                  <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{money(invoice.total)}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
