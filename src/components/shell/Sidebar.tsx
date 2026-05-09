"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mahi } from "@/components/mahi";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
};

const NAV: NavItem[] = [
  {
    id: "today",
    label: "Today",
    href: "/today",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7H10v7H6a2 2 0 01-2-2v-9z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "capture",
    label: "Capture",
    href: "/capture",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "jobs",
    label: "Jobs",
    href: "/jobs",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9 6V4h6v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "invoices",
    label: "Invoices",
    href: "/invoices",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 3h9l4 4v14H6V3z" stroke="currentColor" strokeWidth="1.7" />
        <path d="M9 12h7M9 16h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "quotes",
    label: "Quotes",
    href: "/quotes",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M5 7h14M5 12h10M5 17h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "assistant",
    label: "Assistant",
    href: "/assistant",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
        <path d="M4 12h2M18 12h2M12 4v2M12 18v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="gh-desktop-only"
      style={{
        background: "var(--ink, #0B1220)",
        color: "#fff",
        padding: "20px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        height: "100vh",
        width: 232,
        flexShrink: 0,
        zIndex: 80,
        boxSizing: "border-box",
      }}
    >
      <Link
        href="/today"
        onClick={() => console.log("[Sidebar] logo clicked -> /today")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "4px 8px 16px",
          textDecoration: "none",
          color: "#fff",
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: "linear-gradient(135deg, var(--accent, #FF5E4D), #1A5155)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mahi size={22} mood="happy" accent="var(--mahi-yellow, #FFD13F)" />
        </span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>DebugDiva</div>
          <div style={{ fontSize: 10, opacity: 0.55, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase" }}>
            Tradie admin
          </div>
        </div>
      </Link>

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((item) => {
          const isActive =
            item.href === "/today"
              ? pathname === "/today" || pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => console.log("[Sidebar] nav clicked -> " + item.href)}
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: 9,
                background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                gap: 11,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                textDecoration: "none",
                position: "relative",
              }}
            >
              {isActive && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: -14,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 2,
                    background: "var(--accent, #FF5E4D)",
                  }}
                />
              )}
              <span style={{ width: 16, display: "inline-flex", color: isActive ? "var(--accent, #FF5E4D)" : "inherit" }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ flex: 1 }} />

      <div
        style={{
          padding: 14,
          borderRadius: 14,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <Mahi size={36} mood="happy" />
        <div style={{ flex: 1, fontSize: 11.5, lineHeight: 1.4, opacity: 0.85 }}>
          <b style={{ color: "#fff" }}>Mahi</b> learned your van rate this week.
        </div>
      </div>

      <div style={{ padding: "12px 8px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <div
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          MK
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>Mike Kahu</div>
          <div style={{ fontSize: 10.5, opacity: 0.55 }}>Kahu Plumbing Ltd</div>
        </div>
      </div>
    </aside>
  );
}
