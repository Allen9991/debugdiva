"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mahi } from "@/components/mahi";
import { Eyebrow, Pill } from "@/components/ui/primitives";

type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/today",
    label: "Today",
    shortLabel: "Today",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-7H10v7H6a2 2 0 0 1-2-2v-9Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/capture",
    label: "Capture",
    shortLabel: "Capture",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3a4 4 0 0 1 4 4v4a4 4 0 0 1-8 0V7a4 4 0 0 1 4-4Z"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M5 11a7 7 0 0 0 14 0M12 18v3"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/jobs",
    label: "Jobs",
    shortLabel: "Jobs",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3"
          y="6"
          width="18"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="M9 6V4h6v2"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/invoices",
    label: "Invoices",
    shortLabel: "Bills",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M6 3h9l4 4v14H6V3Z" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M9 12h7M9 16h5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/quotes",
    label: "Quotes",
    shortLabel: "Quotes",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 7h14M5 12h10M5 17h14"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/assistant",
    label: "Assistant",
    shortLabel: "AI",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path
          d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/today") return pathname === "/" || pathname === "/today";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function GhostlyFrame({
  eyebrow,
  title,
  description,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(255,94,77,0.16), transparent 28%), linear-gradient(180deg, #FAFBFD 0%, #F2F4F8 100%)",
        color: "var(--ink)",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "24px 16px 112px",
        }}
      >
        <div
          className="gh-mobile-only"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "linear-gradient(145deg, var(--ink), var(--accent))",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              <Mahi size={24} mood="happy" hardhat />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.4 }}>
                Ghostly
              </div>
              <Eyebrow style={{ marginTop: 2 }}>Tradie admin</Eyebrow>
            </div>
          </div>
          <Pill tone="outline">Demo mode</Pill>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 18,
          }}
        >
          <div
            className="gh-desktop-only"
            style={{
              display: "grid",
              gridTemplateColumns: aside ? "240px minmax(0,1fr) 320px" : "240px minmax(0,1fr)",
              gap: 18,
              alignItems: "start",
            }}
          >
            <DesktopSidebar pathname={pathname} />
            <div style={{ minWidth: 0 }}>
              <PageHeader eyebrow={eyebrow} title={title} description={description} />
              <div style={{ marginTop: 18 }}>{children}</div>
            </div>
            {aside ? <div style={{ minWidth: 0 }}>{aside}</div> : null}
          </div>

          <div className="gh-mobile-only">
            <PageHeader eyebrow={eyebrow} title={title} description={description} compact />
            <div style={{ marginTop: 14 }}>{children}</div>
            {aside ? <div style={{ marginTop: 14 }}>{aside}</div> : null}
          </div>
        </div>
      </div>

      <MobileTabBar pathname={pathname} />
    </main>
  );
}

function DesktopSidebar({ pathname }: { pathname: string }) {
  return (
    <aside
      style={{
        position: "sticky",
        top: 18,
        borderRadius: 24,
        background: "var(--ink)",
        padding: 16,
        color: "#fff",
        minHeight: "calc(100vh - 36px)",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "4px 8px 18px" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "linear-gradient(145deg, var(--accent), #C8413B)",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Mahi size={26} mood="cheer" hardhat />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4 }}>Ghostly</div>
          <div style={{ fontSize: 11, opacity: 0.62, textTransform: "uppercase", letterSpacing: 1.3 }}>
            Tradie admin
          </div>
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                textDecoration: "none",
                padding: "12px 12px",
                borderRadius: 14,
                color: active ? "#fff" : "rgba(255,255,255,0.72)",
                background: active ? "rgba(255,255,255,0.09)" : "transparent",
                border: active ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
                fontSize: 14,
                fontWeight: active ? 700 : 500,
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div
        style={{
          marginTop: 18,
          borderRadius: 18,
          padding: 16,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Eyebrow style={{ color: "rgba(255,255,255,0.54)" }}>Demo flow</Eyebrow>
        <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "rgba(255,255,255,0.78)" }}>
          Voice note in the van. Invoice draft before dinner. Follow-up sent in under two minutes.
        </p>
      </div>
    </aside>
  );
}

function MobileTabBar({ pathname }: { pathname: string }) {
  return (
    <nav
      className="gh-mobile-only"
      aria-label="Primary"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: 12,
        borderRadius: 22,
        padding: 10,
        background: "rgba(11,18,32,0.94)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 16px 44px rgba(11,18,32,0.3)",
        display: "grid",
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
        gap: 6,
        zIndex: 50,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              textDecoration: "none",
              color: active ? "#fff" : "rgba(255,255,255,0.65)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              minHeight: 52,
              borderRadius: 14,
              background: active ? "rgba(255,255,255,0.1)" : "transparent",
              fontSize: 10.5,
              fontWeight: active ? 700 : 500,
            }}
          >
            <span>{item.icon}</span>
            <span>{item.shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  compact?: boolean;
}) {
  const style: CSSProperties = compact
    ? { padding: "20px 18px" }
    : { padding: "28px 26px" };

  return (
    <section
      style={{
        ...style,
        borderRadius: 24,
        background:
          "linear-gradient(155deg, rgba(255,94,77,0.96) 0%, rgba(200,65,59,1) 100%)",
        boxShadow: "var(--shadow-hero)",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -56,
          right: -24,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.14)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: -60,
          right: 60,
          width: 140,
          height: 140,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }}
      />

      <div style={{ position: "relative", maxWidth: 620 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,0.76)" }}>
          {eyebrow}
        </div>
        <h1
          style={{
            margin: "10px 0 0",
            fontSize: compact ? 32 : 42,
            lineHeight: compact ? 1.05 : 1,
            letterSpacing: -1.2,
            fontWeight: 800,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: compact ? 14.5 : 15.5,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.86)",
            maxWidth: 560,
          }}
        >
          {description}
        </p>
      </div>
    </section>
  );
}
