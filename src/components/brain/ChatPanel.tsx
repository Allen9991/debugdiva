"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChatMessage, type ChatMessageData } from "./ChatMessage";
import type {
  ChatRequest,
  ChatResponse,
  SuggestedAction,
} from "@/lib/claude/schemas";

type Props = {
  conversationId: string;
  context: ChatRequest["context"];
  onActionInvoked?: (action: SuggestedAction) => void;
  className?: string;
  // Override the fetch endpoint in tests/storybook.
  endpoint?: string;
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function ChatPanel({
  conversationId,
  context,
  onActionInvoked,
  className,
  endpoint = "/api/brain/chat",
}: Props) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Snapshot context per render so the most recent state is sent with each turn.
  const liveContext = useMemo(() => context, [context]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isSending]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isSending) return;

      const userMessage: ChatMessageData = {
        id: makeId(),
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsSending(true);
      setError(null);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            conversation_id: conversationId,
            context: liveContext,
          } satisfies ChatRequest),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Chat failed (${res.status})`);
        }

        const data = (await res.json()) as ChatResponse;
        setMessages((prev) => [
          ...prev,
          {
            id: makeId(),
            role: "assistant",
            content: data.response,
            suggested_actions: data.suggested_actions,
          },
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong";
        setError(msg);
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, endpoint, isSending, liveContext],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <section
      className={cn(
        "flex flex-col h-full min-h-0 bg-white border border-slate-200 rounded-2xl overflow-hidden",
        className,
      )}
    >
      <header className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 shrink-0">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
        <h2 className="text-sm font-semibold text-slate-900">Admin Ghost</h2>
        <span className="text-xs text-slate-500 ml-auto">Your AI admin</span>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-3 space-y-3"
      >
        {messages.length === 0 && (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-slate-600">
              Ask me about your jobs, invoices, or anything admin.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try: &ldquo;What&rsquo;s outstanding?&rdquo;
            </p>
          </div>
        )}

        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} onAction={onActionInvoked} />
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl rounded-bl-md px-3.5 py-2.5">
              <span className="inline-flex gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: "120ms" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: "240ms" }}
                />
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-100 p-2 sm:p-3 flex items-center gap-2 shrink-0"
      >
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Admin Ghost…"
          disabled={isSending}
          className="flex-1 h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-400 focus:bg-white disabled:opacity-60"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isSending}
          className="h-11 px-4 rounded-xl bg-slate-900 text-white text-sm font-semibold active:bg-slate-800 disabled:opacity-50"
        >
          Send
        </Button>
      </form>
    </section>
  );
}
