import type { CaptureType } from "@/lib/types";

export type StoredCapture = {
  id: string;
  type: CaptureType;
  raw_text: string | null;
  image_url: string | null;
  created_at: string;
};

const globalCaptureStore = globalThis as typeof globalThis & {
  __debugDivaCaptures?: Map<string, StoredCapture>;
};

const captures = (globalCaptureStore.__debugDivaCaptures ??= new Map());

export const captureMemory = {
  save(capture: StoredCapture) {
    captures.set(capture.id, capture);
    return capture;
  },
  get(id: string) {
    return captures.get(id) ?? null;
  },
};
