"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  body: string;
  href?: string;
  unread: boolean;
  created_at: string;
};

type SearchItem = {
  id: string;
  href: string;
  title: string;
  meta: string;
  keywords: string;
};

const TITLE_MAP: { match: RegExp; label: string }[] = [
  { match: /^\/today/, label: "Dashboard" },
  { match: /^\/capture/, label: "Capture" },
  { match: /^\/jobs\/new/, label: "New job" },
  { match: /^\/jobs\/[^/]+/, label: "Job detail" },
  { match: /^\/jobs/, label: "Jobs" },
  { match: /^\/invoices\/[^/]+/, label: "Invoice detail" },
  { match: /^\/invoices/, label: "Invoices" },
  { match: /^\/quotes/, label: "Quotes" },
  { match: /^\/draft-emails\/[^/]+/, label: "Draft email detail" },
  { match: /^\/draft-emails/, label: "Draft Emails" },
  { match: /^\/assistant/, label: "Assistant" },
  { match: /^\/settings/, label: "Settings" },
  { match: /^\/login/, label: "Sign in" },
];

function titleFor(pathname: string): string {
  for (const entry of TITLE_MAP) {
    if (entry.match.test(pathname)) return entry.label;
  }
  if (pathname === "/" || pathname === "") return "Dashboard";
  return "Ghostly";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m";
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours + "h";
  const days = Math.round(hours / 24);
  return days + "d";
}

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    if (bellOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [bellOpen]);

  useEffect(() => {
    let cancelled = false;
    async function loadSearchItems() {
      try {
        const [jobsRes, invoicesRes, quotesRes] = await Promise.all([
          fetch("/api/jobs", { cache: "no-store" }),
          fetch("/api/invoices", { cache: "no-store" }),
          fetch("/api/quotes", { cache: "no-store" }),
        ]);
        const [jobsJson, invoicesJson, quotesJson] = await Promise.all([
          jobsRes.json().catch(() => ({ jobs: [] })),
          invoicesRes.json().catch(() => ({ invoices: [] })),
          quotesRes.json().catch(() => ({ quotes: [] })),
        ]);
        if (cancelled) return;
        const jobs = (jobsJson.jobs ?? []).map((job: Record<string, unknown>) => ({
          id: "job-" + String(job.id),
          href: "/jobs/" + String(job.id),
          title: String(job.client_name ?? "Unnamed job"),
          meta: "Job - " + String(job.location ?? job.status ?? ""),
          keywords: [job.client_name, job.location, job.description, job.status, "job", "jobs"].join(" "),
        }));
        const invoices = (invoicesJson.invoices ?? []).map((invoice: Record<string, unknown>) => ({
          id: "invoice-" + String(invoice.id),
          href: "/invoices/" + String(invoice.id),
          title: String(invoice.client_name ?? "Unnamed invoice"),
          meta: "Invoice - " + String(invoice.status ?? ""),
          keywords: [invoice.client_name, invoice.location, invoice.description, invoice.status, "invoice", "invoices"].join(" "),
        }));
        const quotes = (quotesJson.quotes ?? []).map((quote: Record<string, unknown>) => ({
          id: "quote-" + String(quote.id),
          href: "/quotes",
          title: String(quote.client_name ?? "Unnamed quote"),
          meta: "Quote - " + String(quote.status ?? ""),
          keywords: [quote.client_name, quote.location, quote.description, quote.status, "quote", "quotes"].join(" "),
        }));
        setSearchItems([...jobs, ...invoices, ...quotes]);
      } catch (err) {
        console.error("[TopBar] failed to load search index:", err);
      }
    }
    loadSearchItems();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!bellOpen) return;
    let cancelled = false;
    setLoading(true);
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { notifications: Notification[] }) => {
        if (cancelled) return;
        setNotifications(data.notifications ?? []);
      })
      .catch((err) => {
        console.error("[TopBar] failed to load notifications:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bellOpen]);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const searchMatches = search.trim()
    ? searchItems
        .filter((item) => item.keywords.toLowerCase().includes(search.trim().toLowerCase()))
        .slice(0, 6)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = search.trim();
    console.log("[TopBar] search submitted:", q);
    if (!q) return;
    const lower = q.toLowerCase();
    if (searchMatches[0]) router.push(searchMatches[0].href);
    else if (lower.includes("invoice")) router.push("/invoices");
    else if (lower.includes("quote")) router.push("/quotes");
    else router.push("/jobs?search=" + encodeURIComponent(q));
    setSearchOpen(false);
  };

  return (
    <header
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 24px",
        background: "var(--surface, #fff)",
        borderBottom: "1px solid var(--border, #E2E8F0)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: -0.3, color: "var(--ink, #0B1220)", minWidth: 120 }}>
        {titleFor(pathname)}
      </h1>

      <form onSubmit={handleSearchSubmit} style={{ flex: 1, maxWidth: 420, position: "relative" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted, #64748B)" }}>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search jobs, invoices, quotes..."
          aria-label="Search"
          style={{
            width: "100%",
            height: 36,
            border: "1px solid var(--border, #E2E8F0)",
            borderRadius: 10,
            padding: "0 12px 0 32px",
            background: "var(--bg, #F8FAFC)",
            fontSize: 13,
            color: "var(--ink, #0B1220)",
            outline: "none",
          }}
        />
        {searchOpen && search.trim() && (
          <div style={{ position: "absolute", top: 42, left: 0, right: 0, background: "var(--surface, #fff)", border: "1px solid var(--border, #E2E8F0)", borderRadius: 12, boxShadow: "0 14px 34px rgba(15,23,42,0.16)", padding: 6, zIndex: 70 }}>
            {searchMatches.length === 0 && (
              <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--muted, #64748B)" }}>No matching jobs, invoices, or quotes.</div>
            )}
            {searchMatches.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => {
                  setSearch(item.title);
                  setSearchOpen(false);
                }}
                style={{ display: "block", padding: "10px 12px", borderRadius: 9, textDecoration: "none", color: "var(--ink, #0B1220)" }}
              >
                <div style={{ fontSize: 13, fontWeight: 700 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted, #64748B)", marginTop: 2 }}>{item.meta}</div>
              </Link>
            ))}
          </div>
        )}
      </form>

      <div style={{ flex: 1 }} />

      <div ref={wrapRef} style={{ position: "relative" }}>
        <button
          type="button"
          aria-label="Notifications"
          aria-expanded={bellOpen}
          onClick={() => {
            console.log("[TopBar] notification bell clicked");
            setBellOpen((v) => !v);
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "1px solid var(--border, #E2E8F0)",
            background: bellOpen ? "var(--bg, #F8FAFC)" : "var(--surface, #fff)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            color: "var(--ink, #0B1220)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9zm5 13a2 2 0 002 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {unreadCount > 0 && (
            <span aria-hidden style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "var(--accent, #FF5E4D)", boxShadow: "0 0 0 2px var(--surface, #fff)" }} />
          )}
        </button>

        {bellOpen && (
          <div role="menu" style={{ position: "absolute", top: 44, right: 0, width: 360, background: "var(--surface, #fff)", border: "1px solid var(--border, #E2E8F0)", borderRadius: 14, boxShadow: "0 16px 40px rgba(15,23,42,0.18)", padding: 10, zIndex: 60 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px 8px" }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Notifications</div>
              <div style={{ fontSize: 11, color: "var(--muted, #64748B)", fontWeight: 600 }}>{unreadCount} unread</div>
            </div>

            {loading && <div style={{ padding: 16, fontSize: 13, color: "var(--muted, #64748B)", textAlign: "center" }}>Loading...</div>}

            {!loading && notifications.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: "var(--muted, #64748B)", textAlign: "center" }}>You&rsquo;re all caught up.</div>
            )}

            {!loading && notifications.slice(0, 5).map((n) => {
              const inner = (
                <div style={{ display: "flex", gap: 10, padding: "10px 8px", borderRadius: 10, cursor: n.href ? "pointer" : "default" }}>
                  <span aria-hidden style={{ marginTop: 5, width: 8, height: 8, borderRadius: "50%", background: n.unread ? "var(--accent, #FF5E4D)" : "var(--border, #E2E8F0)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink, #0B1220)" }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted, #64748B)", marginTop: 2, lineHeight: 1.4 }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: "var(--muted, #64748B)", marginTop: 4 }}>{timeAgo(n.created_at)} ago</div>
                  </div>
                </div>
              );
              return n.href ? (
                <Link
                  key={n.id}
                  href={n.href}
                  onClick={() => {
                    console.log("[TopBar] notification clicked ->", n.href);
                    setBellOpen(false);
                  }}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        aria-label="Open settings"
        onClick={() => {
          console.log("[TopBar] avatar clicked -> /settings");
          router.push("/settings");
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "none",
          background: "var(--ink, #0B1220)",
          color: "#fff",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        MK
      </button>
    </header>
  );
}
