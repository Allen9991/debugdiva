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

const DEMO_TRANSCRIPT =
  "Finished leak repair for Sarah at 25 Queen Street. Two hours labour. Used sealant, pipe fitting, replacement valve. Materials around 75. Job tested and complete.";

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

    const captureId = crypto.randomUUID();
    const successResp = {
      text: DEMO_TRANSCRIPT,
      confidence: 0.93,
      duration_ms: 18000,
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
