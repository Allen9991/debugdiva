// In-memory conversation history for the chat endpoint.
// Hackathon-grade: lost on server restart. If we need durability later,
// move this to a Supabase `conversations` table (Jayden's domain).

export type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const MAX_TURNS_PER_CONVERSATION = 20;

const store = new Map<string, ChatTurn[]>();

export function getHistory(conversationId: string): ChatTurn[] {
  return store.get(conversationId) ?? [];
}

export function appendTurn(conversationId: string, turn: ChatTurn): void {
  const existing = store.get(conversationId) ?? [];
  const next = [...existing, turn];
  // Keep the tail — older turns drop off so context stays bounded.
  const trimmed =
    next.length > MAX_TURNS_PER_CONVERSATION
      ? next.slice(next.length - MAX_TURNS_PER_CONVERSATION)
      : next;
  store.set(conversationId, trimmed);
}

export function resetConversation(conversationId: string): void {
  store.delete(conversationId);
}
