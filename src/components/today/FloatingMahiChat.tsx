"use client";

import { useState } from "react";
import { Mahi } from "@/components/mahi";

type Message = { who: "mahi" | "me"; text: string };

const SEED: Message[] = [
  {
    who: "mahi",
    text: "Hey Mike — those four receipts? I've matched two to Sarah's job. Want me to bin the duplicate from BP?",
  },
  { who: "me", text: "Yeah bin it" },
  { who: "mahi", text: "Done. Anything else before you knock off?" },
];

export function FloatingMahiChat() {
  const [open, setOpen] = useState(true);
  const [messages] = useState<Message[]>(SEED);
  const [draft, setDraft] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open Mahi chat"
        style={{
          position: "fixed",
          right: 28,
          bottom: 28,
          zIndex: 50,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, var(--accent), #C8413B)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 12px 30px rgba(255,94,77,0.4)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Mahi size={36} mood="happy" />
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 28,
        bottom: 28,
        width: 320,
        borderRadius: 18,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "var(--shadow-mahi-float)",
        zIndex: 50,
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "linear-gradient(135deg, var(--accent), #C8413B)",
          color: "#fff",
        }}
      >
        <Mahi size={32} mood="happy" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Mahi</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>Online · ready to help</div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          style={{
            background: "rgba(255,255,255,0.18)",
            border: "none",
            color: "#fff",
            width: 26,
            height: 26,
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      <div
        style={{
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "var(--bg)",
          maxHeight: 360,
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <Bubble key={i} who={m.who}>
            {m.text}
          </Bubble>
        ))}

        <div
          style={{
            marginTop: 4,
            height: 40,
            borderRadius: 10,
            background: "#fff",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            padding: "0 8px 0 12px",
            gap: 8,
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask Mahi…"
            style={{
              flex: 1,
              fontSize: 13,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--ink)",
            }}
          />
          <button
            type="button"
            aria-label="Send"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--accent)",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff">
              <rect x="9" y="3" width="6" height="12" rx="3" />
              <path
                d="M5 11a7 7 0 0014 0M12 18v3"
                stroke="#fff"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  who,
  children,
}: {
  who: "mahi" | "me";
  children: React.ReactNode;
}) {
  const me = who === "me";
  return (
    <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start" }}>
      <div
        style={{
          maxWidth: "82%",
          padding: "8px 12px",
          borderRadius: 12,
          background: me ? "var(--ink)" : "#fff",
          color: me ? "#fff" : "var(--ink)",
          fontSize: 12.5,
          lineHeight: 1.45,
          border: me ? "none" : "1px solid var(--border)",
          borderBottomRightRadius: me ? 4 : 12,
          borderBottomLeftRadius: me ? 12 : 4,
        }}
      >
        {children}
      </div>
    </div>
  );
}
