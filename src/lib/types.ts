export type Job = {
  id: string;
  title: string;
};

export type CaptureType = "voice" | "receipt";

export type VoiceCaptureResult = {
  text: string;
  confidence: number;
  duration_ms: number;
  capture_id: string;
};

export type ReceiptCaptureResult = {
  image_url: string;
  capture_id: string;
};

export type CaptureHandoffStatus = "idle" | "sending" | "accepted" | "error";

export type RecentCapture =
  | {
      type: "voice";
      captureId: string;
      transcript: string;
      confidence: number;
      durationMs: number;
    }
  | {
      type: "receipt";
      captureId: string;
      imageUrl: string;
    };
