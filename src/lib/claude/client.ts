import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey && process.env.NODE_ENV !== "test") {
  console.warn("[claude] ANTHROPIC_API_KEY is not set");
}

export const CLAUDE_TIMEOUT_MS = 10_000;

export const claudeClient = new Anthropic({
  apiKey: apiKey ?? "",
  timeout: CLAUDE_TIMEOUT_MS,
  maxRetries: 0,
});
