"use client";

import { useRouter } from "next/navigation";
import { ChatPanel } from "@/components/brain/ChatPanel";
import type { ChatRequest, SuggestedAction } from "@/lib/claude/schemas";

type Props = {
  conversationId: string;
  context: ChatRequest["context"];
};

function routeForAction(action: SuggestedAction) {
  if (action.action.startsWith("open:")) {
    return action.action.slice("open:".length);
  }

  if (action.action.startsWith("view_invoice:")) {
    return "/invoices/" + action.action.slice("view_invoice:".length);
  }

  return null;
}

export function AssistantChat({ conversationId, context }: Props) {
  const router = useRouter();

  async function handleAction(action: SuggestedAction) {
    if (action.action.startsWith("draft_invoice:job_id=")) {
      const jobId = action.action.slice("draft_invoice:job_id=".length);
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const payload = (await response.json()) as {
        invoice?: { id: string };
        error?: string;
      };

      if (!response.ok || !payload.invoice?.id) {
        throw new Error(payload.error ?? "Could not draft invoice.");
      }

      router.push("/invoices/" + payload.invoice.id);
      return;
    }

    const route = routeForAction(action);
    if (route) {
      router.push(route);
    }
  }

  return (
    <ChatPanel
      conversationId={conversationId}
      context={context}
      onActionInvoked={(action) => {
        void handleAction(action);
      }}
      className="min-h-[620px]"
    />
  );
}
