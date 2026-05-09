"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  endpoint: string;
  label: string;
  confirmLabel: string;
};

export function DeleteRecordButton({ endpoint, label, confirmLabel }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Could not delete this record.");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not delete this record.");
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          style={{ height: 32, padding: "0 10px", borderRadius: 9, border: "none", background: "#DC2626", color: "#fff", fontSize: 12, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.65 : 1 }}
        >
          {busy ? "Deleting..." : confirmLabel}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={busy}
          style={{ height: 32, padding: "0 10px", borderRadius: 9, border: "1px solid var(--border, #E2E8F0)", background: "#fff", color: "var(--ink, #0B1220)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(true);
      }}
      style={{ height: 32, padding: "0 10px", borderRadius: 9, border: "1px solid #FCA5A5", background: "#FEE2E2", color: "#991B1B", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
    >
      {label}
    </button>
  );
}
