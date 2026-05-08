"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SuggestedAction } from "@/lib/claude/schemas";

export type ChatMessageRole = "user" | "assistant";

export type ChatMessageData = {
  id: string;
  role: ChatMessageRole;
  content: string;
  suggested_actions?: SuggestedAction[];
};

type Props = {
  message: ChatMessageData;
  onAction?: (action: SuggestedAction) => void;
};

export function ChatMessage({ message, onAction }: Props) {
  const isUser = message.role === "user";

  return (
    <article
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div className={cn("max-w-[85%] flex flex-col gap-2", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser
              ? "bg-slate-900 text-white rounded-br-md"
              : "bg-slate-100 text-slate-900 rounded-bl-md",
          )}
        >
          {message.content}
        </div>

        {!isUser &&
          message.suggested_actions &&
          message.suggested_actions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {message.suggested_actions.map((a, i) => (
                <Button
                  key={`${a.action}-${i}`}
                  onClick={() => onAction?.(a)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 active:bg-slate-100"
                >
                  {a.label}
                </Button>
              ))}
            </div>
          )}
      </div>
    </article>
  );
}
