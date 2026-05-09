import Link from "next/link";
import { headers } from "next/headers";
import { DeleteRecordButton } from "@/components/ui/DeleteRecordButton";
import { Eyebrow, Pill } from "@/components/ui/primitives";

type DraftEmail = {
  id: string;
  client_name: string;
  client_email?: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
};

async function getDraftEmails(): Promise<DraftEmail[]> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const response = await fetch(protocol + "://" + host + "/api/draft-emails", { cache: "no-store" });
  if (!response.ok) return [];
  const data = await response.json();
  return data.draftEmails ?? [];
}

export default async function DraftEmailsPage() {
  const draftEmails = await getDraftEmails();

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #F8FAFC)", color: "var(--ink, #0B1220)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
        <section style={{ background: "#fff", borderRadius: 18, border: "1px solid var(--border, #E2E8F0)", padding: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
            <div>
              <Eyebrow>Draft Emails</Eyebrow>
              <div style={{ marginTop: 4, fontSize: 17, fontWeight: 800, letterSpacing: -0.3 }}>
                Client email drafts
              </div>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted, #64748B)" }}>
                {draftEmails.length} draft email{draftEmails.length === 1 ? "" : "s"} on file
              </p>
            </div>
            <Link
              href="/capture"
              style={{ height: 38, padding: "0 16px", borderRadius: 10, background: "var(--accent, #FF5E4D)", color: "#fff", fontSize: 13, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              + Capture email
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {draftEmails.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>
                No draft emails yet. Use Capture and ask Ghostly to draft an email for a client.
              </p>
            )}
            {draftEmails.map((email) => (
              <div
                key={email.id}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 16px", borderRadius: 14, border: "1px solid var(--border, #E2E8F0)", background: "var(--bg, #F8FAFC)", color: "var(--ink, #0B1220)" }}
              >
                <Link href={"/draft-emails/" + email.id} style={{ flex: 1, minWidth: 0, color: "inherit", textDecoration: "none" }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                    <Pill tone="soft">Created {new Date(email.created_at).toLocaleDateString("en-NZ")}</Pill>
                    <Pill tone="outline">{email.client_email || "No email added"}</Pill>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{email.subject}</div>
                  <div style={{ fontSize: 13, color: "var(--muted, #64748B)", marginTop: 2 }}>{email.client_name}</div>
                  <div style={{ fontSize: 13, color: "var(--muted, #64748B)", marginTop: 4, lineHeight: 1.45 }}>
                    {email.body.split("\n").find(Boolean) ?? "Draft email"}
                  </div>
                </Link>
                <DeleteRecordButton endpoint={"/api/draft-emails?id=" + email.id} label="Remove" confirmLabel="Delete draft" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
