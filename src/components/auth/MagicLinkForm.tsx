"use client";

import { FormEvent, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });

      if (error) {
        throw error;
      }

      setStatus("sent");
      setMessage("Magic link sent. Check your email and jump back in.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send magic link.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          required
          placeholder="mike@ghostplumbing.co.nz"
          className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 px-4 text-base outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="min-h-12 w-full rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "sending" ? "Sending link..." : "Send magic link"}
      </button>

      {message ? (
        <p className={`text-sm ${status === "error" ? "text-red-700" : "text-emerald-700"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
