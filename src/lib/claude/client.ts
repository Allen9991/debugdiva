import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "node:fs";
import path from "node:path";

export const CLAUDE_TIMEOUT_MS = 10_000;

let cached: Anthropic | null = null;
let cachedKey: string | undefined;

function readEnvLocal(name: string): string | undefined {
  try {
    const raw = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (key !== name) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      return value;
    }
  } catch {
    // ignore — file missing or unreadable
  }
  return undefined;
}

export function getEnvVar(name: string): string | undefined {
  const fromProcess = process.env[name];
  if (fromProcess && fromProcess.length > 0) return fromProcess;
  return readEnvLocal(name);
}

function getClient(): Anthropic {
  const apiKey = getEnvVar("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local and restart the dev server.",
    );
  }
  if (!cached || cachedKey !== apiKey) {
    cached = new Anthropic({
      apiKey,
      timeout: CLAUDE_TIMEOUT_MS,
      maxRetries: 0,
    });
    cachedKey = apiKey;
  }
  return cached;
}

export const claudeClient = {
  get messages() {
    return getClient().messages;
  },
};
