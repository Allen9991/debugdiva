"use client";

import * as React from "react";
import { Mahi } from "@/components/mahi";

type WorkPreferences = {
  preferred_finish_hour: number;
  max_weekly_hours: number;
  work_weekends: boolean;
};

const FINISH_TIMES = [
  { label: "3:00 pm", value: 15 },
  { label: "4:00 pm", value: 16 },
  { label: "5:00 pm", value: 17 },
  { label: "6:00 pm", value: 18 },
  { label: "7:00 pm", value: 19 },
];

const MAX_HOURS_OPTIONS = [30, 35, 40, 45, 50, 55, 60];

export function WorkPreferences() {
  const [prefs, setPrefs] = React.useState<WorkPreferences | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d: { work_preferences?: WorkPreferences }) => {
        if (d.work_preferences) setPrefs(d.work_preferences);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!prefs) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ work_preferences: prefs }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // silently fail in demo
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof WorkPreferences>(key: K, value: WorkPreferences[K]) {
    setPrefs((p) => (p ? { ...p, [key]: value } : p));
    setSaved(false);
  }

  if (loading || !prefs) {
    return (
      <div style={{ padding: "22px 0" }}>
        <div style={{ height: 14, width: 160, borderRadius: 6, background: "var(--border)" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 18,
        border: "1px solid var(--border)",
        background: "#fff",
        overflow: "hidden",
        marginTop: 18,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 22px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <Mahi size={40} mood="happy" />
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.3, color: "var(--ink)" }}>
            Work style
          </div>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.4 }}>
            Ghostly uses these to calibrate your workload forecast and burnout warnings.
          </p>
        </div>
      </div>

      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Preferred finish time */}
        <FieldRow
          label="Preferred finish time"
          description="When do you like to wrap up for the day?"
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FINISH_TIMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => update("preferred_finish_hour", t.value)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 9,
                  border: "1.5px solid",
                  borderColor: prefs.preferred_finish_hour === t.value ? "var(--accent)" : "var(--border)",
                  background: prefs.preferred_finish_hour === t.value ? "var(--accent-soft, #E6F7F7)" : "#fff",
                  color: prefs.preferred_finish_hour === t.value ? "var(--accent)" : "var(--muted)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </FieldRow>

        {/* Max weekly hours */}
        <FieldRow
          label="Max weekly hours"
          description="The most you want to work in a week before Ghostly flags a risk."
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MAX_HOURS_OPTIONS.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => update("max_weekly_hours", h)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 9,
                  border: "1.5px solid",
                  borderColor: prefs.max_weekly_hours === h ? "var(--accent)" : "var(--border)",
                  background: prefs.max_weekly_hours === h ? "var(--accent-soft, #E6F7F7)" : "#fff",
                  color: prefs.max_weekly_hours === h ? "var(--accent)" : "var(--muted)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {h} hrs
              </button>
            ))}
          </div>
        </FieldRow>

        {/* Work weekends toggle */}
        <FieldRow
          label="Work weekends"
          description="Include Saturday and Sunday when calculating your weekly capacity."
        >
          <button
            type="button"
            role="switch"
            aria-checked={prefs.work_weekends}
            onClick={() => update("work_weekends", !prefs.work_weekends)}
            style={{
              width: 48,
              height: 28,
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: prefs.work_weekends ? "var(--accent)" : "var(--border)",
              position: "relative",
              transition: "background 0.2s",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 3,
                left: prefs.work_weekends ? 23 : 3,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                transition: "left 0.2s",
              }}
            />
          </button>
        </FieldRow>

        {/* Save */}
        <div style={{ paddingTop: 4 }}>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              height: 42,
              padding: "0 22px",
              borderRadius: 10,
              border: "none",
              background: saved ? "#10B981" : "var(--ink)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? "default" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "background 0.2s",
            }}
          >
            {saved ? "Saved ✓" : saving ? "Saving…" : "Save preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{label}</div>
        <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2 }}>{description}</div>
      </div>
      {children}
    </div>
  );
}
