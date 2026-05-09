"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("mike@kahuplumbing.co.nz");
  const [password, setPassword] = useState("Test123!");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log("[LoginPage] submit clicked, email:", email);

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      console.log("[LoginPage] /api/auth/login response:", data);

      if (!res.ok) {
        throw new Error(data?.error ?? "Sign in failed");
      }
      router.push("/today");
      router.refresh();
    } catch (err) {
      console.error("[LoginPage] login threw:", err);
      setError(err instanceof Error ? err.message : "Couldn't sign in");
      setSubmitting(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(255,94,77,0.18), transparent 38%), linear-gradient(180deg, #F8FAFC 0%, #EEF7F2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          border: "1px solid #E2E8F0",
          borderRadius: 18,
          padding: 28,
          boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #FF5E4D, #1A5155)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
            }}
          >
            DD
          </span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>DebugDiva</div>
            <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600 }}>Tradie admin, sorted.</div>
          </div>
        </div>

        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.4 }}>Sign in</h1>
        <p style={{ margin: "4px 0 18px", fontSize: 13.5, color: "#64748B" }}>
          Pick up where you left off. Mahi&rsquo;s been keeping an eye on things.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              style={{
                height: 42,
                padding: "0 12px",
                borderRadius: 10,
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                fontSize: 14,
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              minLength={4}
              style={{
                height: 42,
                padding: "0 12px",
                borderRadius: 10,
                border: "1px solid #E2E8F0",
                background: "#F8FAFC",
                fontSize: 14,
                outline: "none",
              }}
            />
          </label>

          {error && (
            <div role="alert" style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#991B1B", padding: "10px 12px", borderRadius: 10, fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              height: 44,
              borderRadius: 12,
              background: "#FF5E4D",
              color: "#fff",
              border: "none",
              fontSize: 14,
              fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
              boxShadow: "0 8px 22px rgba(255,94,77,0.35)",
            }}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ margin: "16px 0 0", fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
          Demo mode: any email + password works. Real Supabase auth kicks in when configured.
        </p>
      </div>
    </main>
  );
}
