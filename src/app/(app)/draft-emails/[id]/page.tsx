"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";

type DraftEmail = {
  id: string;
  client_name: string;
  client_email?: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
};

function preferredMimeType() {
  if (typeof MediaRecorder === "undefined") return "audio/webm";
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c)) ?? "audio/webm";
}

export default function DraftEmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [draftEmail, setDraftEmail] = useState<DraftEmail | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/draft-emails/" + id, { cache: "no-store" });
      const json = await res.json();
      if (cancelled) return;
      if (res.ok && json.draftEmail) {
        setDraftEmail(json.draftEmail);
        setSubject(json.draftEmail.subject);
        setBody(json.draftEmail.body);
      } else {
        setMessage(json.error ?? "Could not load draft email.");
      }
    }
    load();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [id]);

  async function saveDraft() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/draft-emails/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const json = await res.json();
      if (!res.ok || !json.draftEmail) throw new Error(json.error ?? "Could not save draft email.");
      setDraftEmail(json.draftEmail);
      setEditing(false);
      setMessage("Draft email saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save draft email.");
    } finally {
      setBusy(false);
    }
  }

  async function startCapture() {
    setMessage(null);
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessage("This browser cannot record audio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: preferredMimeType() });
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start();
      setRecording(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Microphone access was denied.");
    }
  }

  async function stopCapture() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    setBusy(true);
    setRecording(false);

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      recorder.stop();
    });
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;

    try {
      const file = new File([blob], "draft-email-change.webm", { type: blob.type || "audio/webm" });
      const formData = new FormData();
      formData.append("audio", file);
      const transcribeRes = await fetch("/api/capture/transcribe", { method: "POST", body: formData });
      const transcribeJson = await transcribeRes.json();
      if (!transcribeRes.ok || !transcribeJson.text) {
        throw new Error(transcribeJson.error ?? "Could not understand that capture.");
      }

      const reviseRes = await fetch("/api/draft-emails/" + id + "/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: transcribeJson.text }),
      });
      const reviseJson = await reviseRes.json();
      if (!reviseRes.ok || !reviseJson.draftEmail) {
        throw new Error(reviseJson.error ?? "Could not update draft email.");
      }
      setDraftEmail(reviseJson.draftEmail);
      setSubject(reviseJson.draftEmail.subject);
      setBody(reviseJson.draftEmail.body);
      setMessage("Capture applied: " + transcribeJson.text);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not update draft email.");
    } finally {
      setBusy(false);
    }
  }

  if (!draftEmail) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg, #F8FAFC)" }}>
        <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>{message ?? "Loading draft email..."}</div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg, #F8FAFC)", color: "var(--ink, #0B1220)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 16px", display: "grid", gap: 16 }}>
        <Link href="/draft-emails" style={{ fontSize: 13, color: "var(--muted, #64748B)", textDecoration: "none", fontWeight: 600 }}>
          &larr; Back to draft emails
        </Link>

        <section style={{ background: "#fff", border: "1px solid var(--border, #E2E8F0)", borderRadius: 18, padding: 24, display: "grid", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase", color: "var(--muted, #64748B)" }}>
                Draft email
              </div>
              <h1 style={{ margin: "6px 0 4px", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>
                {draftEmail.client_name}
              </h1>
              <div style={{ fontSize: 13, color: "var(--muted, #64748B)" }}>
                Created {new Date(draftEmail.created_at).toLocaleString("en-NZ")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing((value) => !value)}
              style={{ height: 38, padding: "0 16px", borderRadius: 10, border: "1px solid var(--border, #E2E8F0)", background: "#fff", color: "var(--ink, #0B1220)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {editing ? "Preview" : "Edit"}
            </button>
          </div>

          {editing ? (
            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 700 }}>
                Subject
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  style={{ height: 42, borderRadius: 10, border: "1px solid var(--border, #E2E8F0)", padding: "0 12px", fontSize: 14 }}
                />
              </label>
              <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 700 }}>
                Email
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={12}
                  style={{ borderRadius: 12, border: "1px solid var(--border, #E2E8F0)", padding: 12, fontSize: 14, lineHeight: 1.55, resize: "vertical" }}
                />
              </label>
              <button
                type="button"
                onClick={saveDraft}
                disabled={busy}
                style={{ height: 44, borderRadius: 12, border: "none", background: "var(--accent, #FF5E4D)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1 }}
              >
                {busy ? "Saving..." : "Save draft"}
              </button>
            </div>
          ) : (
            <article style={{ border: "1px solid var(--border, #E2E8F0)", borderRadius: 14, padding: 18, background: "var(--bg, #F8FAFC)" }}>
              <div style={{ fontSize: 13, color: "var(--muted, #64748B)", marginBottom: 6 }}>Subject</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{draftEmail.subject}</h2>
              <pre style={{ margin: "18px 0 0", whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14.5, lineHeight: 1.6, color: "var(--ink, #0B1220)" }}>
                {draftEmail.body}
              </pre>
            </article>
          )}

          <section style={{ border: "1px solid var(--border, #E2E8F0)", borderRadius: 14, padding: 16, background: "var(--surface, #fff)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>Capture changes</div>
                <div style={{ fontSize: 13, color: "var(--muted, #64748B)", marginTop: 2 }}>
                  Tell Ghostly what to add, change, or set as the subject.
                </div>
              </div>
              <button
                type="button"
                onClick={recording ? stopCapture : startCapture}
                disabled={busy && !recording}
                style={{ height: 44, padding: "0 18px", borderRadius: 12, border: "none", background: recording ? "#DC2626" : "var(--ink, #0B1220)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: busy && !recording ? "not-allowed" : "pointer", opacity: busy && !recording ? 0.7 : 1 }}
              >
                {recording ? "Stop capture" : busy ? "Updating..." : "Capture"}
              </button>
            </div>
            {message && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 12, background: "var(--focus-soft, #EAF4F2)", color: "var(--ink, #0B1220)", fontSize: 13 }}>
                {message}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
