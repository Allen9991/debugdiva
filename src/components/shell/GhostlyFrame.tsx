"use client";

import type { CSSProperties, ReactNode } from "react";

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
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(255,94,77,0.12), transparent 28%), linear-gradient(180deg, #FAFBFD 0%, #F2F4F8 100%)",
        color: "var(--ink)",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "24px 16px 80px",
        }}
      >
        <PageHeader eyebrow={eyebrow} title={title} description={description} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: aside ? "minmax(0,1fr) 320px" : "minmax(0,1fr)",
            gap: 18,
            alignItems: "start",
            marginTop: 18,
          }}
        >
          <div style={{ minWidth: 0 }}>{children}</div>
          {aside ? <div style={{ minWidth: 0 }}>{aside}</div> : null}
        </div>
      </div>
    </main>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  const style: CSSProperties = { padding: "28px 26px" };

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
            fontSize: 42,
            lineHeight: 1,
            letterSpacing: -1.2,
            fontWeight: 800,
          }}
        >
          {title}
        </h1>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 15.5,
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
