"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Mahi } from "@/components/mahi";

type Message = { who: "mahi" | "me"; text: string };

const SEED: Message[] = [
  {
    who: "mahi",
    text: "Hi Mike. I can see your jobs, drafts, and receipts - what's first?",
  },
];

const CONVERSATION_ID = "floating-mahi";

export function FloatingMahiChat() {
  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>(SEED);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    console.log("[FloatingMahiChat] sending message:", trimmed);
    setMessages((prev) => [...prev, { who: "me", text: trimmed }]);
    setDraft("");
    setSending(true);

    try {
      const res = await fetch("/api/brain/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversation_id: CONVERSATION_ID,
          context: { recent_jobs: [], pending_invoices: [] },
        }),
      });
      const payload = await res.json().catch(() => ({}));
      console.log("[FloatingMahiChat] received response:", payload);

      if (!res.ok) {
        const errMsg = payload?.error ?? "Ghostly couldn't reply (" + res.status + ").";
        setMessages((prev) => [
          ...prev,
          { who: "mahi", text: "Sorry - " + errMsg + " Try again in a sec." },
        ]);
        return;
      }

      const replyText: string =
        typeof payload?.response === "string" && payload.response.length > 0
          ? payload.response
          : "Got it - I'll keep that in mind.";

      setMessages((prev) => [...prev, { who: "mahi", text: replyText }]);
    } catch (err) {
      console.error("[FloatingMahiChat] send threw:", err);
      setMessages((prev) => [
        ...prev,
        { who: "mahi", text: "I lost the connection for a sec - give it another go." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(draft);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          console.log("[FloatingMahiChat] reopened");
          setOpen(true);
        }}
        aria-label="Open Ghostly chat"
        style={{
          position: "fixed",
          right: 28,
          bottom: 28,
          zIndex: 50,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent), #1A5155)",
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
        boxShadow: "0 18px 45px rgba(15,23,42,0.25)",
        zIndex: 50,
      }}
    >
      <div
        style={{
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "linear-gradient(135deg, var(--accent), #1A5155)",
          color: "#fff",
        }}
      >
        <Mahi size={32} mood="happy" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>Ghostly</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>
            {sending ? "Thinking..." : "Online - ready to help"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            console.log("[FloatingMahiChat] closed");
            setOpen(false);
          }}
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
          x
        </button>
      </div>

      <div
        ref={scrollRef}
        style={{
          padding: 14,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "var(--bg, #F8FAFC)",
          maxHeight: 360,
          overflowY: "auto",
        }}
      >
        {messages.map((m, i) => (
          <Bubble key={i} who={m.who}>
            {m.text}
          </Bubble>
        ))}

        {sending && (
          <Bubble who="mahi">
            <span aria-label="Ghostly is typing">
              <span style={{ opacity: 0.6 }}>...</span>
            </span>
          </Bubble>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: 4,
            height: 40,
            borderRadius: 10,
            background: "#fff",
            border: "1px solid var(--border, #E2E8F0)",
            display: "flex",
            alignItems: "center",
            padding: "0 4px 0 12px",
            gap: 8,
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask Ghostly..."
            disabled={sending}
            style={{
              flex: 1,
              fontSize: 13,
              border: "none",
              outline: "none",
              background: "transparent",
              color: "var(--ink, #0B1220)",
            }}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="Send"
            onClick={() => console.log("[FloatingMahiChat] send button clicked")}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background:
                sending || !draft.trim()
                  ? "rgba(15,23,42,0.18)"
                  : "var(--accent, #FF5E4D)",
              border: "none",
              color: "#fff",
              cursor: sending || !draft.trim() ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 12l16-8-6 16-3-7-7-1z"
                stroke="#fff"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </form>
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
          background: me ? "var(--ink, #0B1220)" : "#fff",
          color: me ? "#fff" : "var(--ink, #0B1220)",
          fontSize: 12.5,
          lineHeight: 1.45,
          border: me ? "none" : "1px solid var(--border, #E2E8F0)",
          borderBottomRightRadius: me ? 4 : 12,
          borderBottomLeftRadius: me ? 12 : 4,
        }}
      >
        {children}
      </div>
    </div>
  );
}
