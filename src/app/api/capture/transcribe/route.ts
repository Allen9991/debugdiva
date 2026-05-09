import { captureMemory } from "@/lib/capture-memory";
import { createWhisperClient } from "@/lib/whisper/client";

const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
]);

export async function POST(request: Request) {
  console.log("[POST /api/capture/transcribe] called");
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      const errResp = {
        error: "Expected multipart/form-data with an audio file in the 'audio' field.",
      };
      console.log("[POST /api/capture/transcribe] returning:", errResp);
      return Response.json(errResp, { status: 400 });
    }

    if (!SUPPORTED_AUDIO_TYPES.has(audio.type)) {
      const errResp = { error: "Unsupported audio type '" + (audio.type || "unknown") + "'." };
      console.log("[POST /api/capture/transcribe] returning:", errResp);
      return Response.json(errResp, { status: 415 });
    }

    console.log(
      "[POST /api/capture/transcribe] called with: audio bytes=",
      audio.size,
      "type=",
      audio.type,
    );

    const whisper = createWhisperClient();
    const transcription = await whisper.transcribe(audio);
    if (!transcription.text) {
      return Response.json(
        { error: "The recording was transcribed, but no speech was detected." },
        { status: 422 },
      );
    }

    const captureId = crypto.randomUUID();
    captureMemory.save({
      id: captureId,
      type: "voice",
      raw_text: transcription.text,
      image_url: null,
      created_at: new Date().toISOString(),
    });

    const successResp = {
      text: transcription.text,
      confidence: transcription.confidence,
      duration_ms: transcription.durationMs,
      capture_id: captureId,
    };
    console.log(
      "[POST /api/capture/transcribe] returning: capture_id=",
      successResp.capture_id,
      "text_len=",
      successResp.text.length,
    );
    return Response.json(successResp);
  } catch (error) {
    console.error("[POST /api/capture/transcribe] threw:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while transcribing audio.",
      },
      { status: 500 },
    );
  }
}
