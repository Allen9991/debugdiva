import { createWhisperClient } from "@/lib/whisper/client";

const SUPPORTED_AUDIO_TYPES = new Set([
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
]);
const CAPTURE_BUCKET = "captures";

type CaptureInsert = {
  id: string;
  type: "voice";
  raw_text: string;
  audio_url: string | null;
  processed: boolean;
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return { supabaseUrl, serviceRoleKey };
}

async function uploadAudioToSupabaseStorage(file: File, captureId: string) {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const fileExtension =
    file.type === "audio/webm"
      ? "webm"
      : file.type === "audio/mp3" || file.type === "audio/mpeg"
        ? "mp3"
        : file.type === "audio/mp4" || file.type === "audio/m4a" || file.type === "audio/x-m4a"
          ? "m4a"
          : "bin";
  const storagePath = `voice/${captureId}.${fileExtension}`;

  const uploadResponse = await fetch(
    `${config.supabaseUrl}/storage/v1/object/${CAPTURE_BUCKET}/${storagePath}`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: file,
    },
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Failed to upload audio capture: ${errorText}`);
  }

  return `${config.supabaseUrl}/storage/v1/object/public/${CAPTURE_BUCKET}/${storagePath}`;
}

async function persistCapture(record: CaptureInsert) {
  const config = getSupabaseConfig();

  if (!config) {
    return;
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/captures`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to persist capture: ${errorText}`);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File)) {
      return Response.json(
        { error: "Expected multipart/form-data with an audio file in the 'audio' field." },
        { status: 400 },
      );
    }

    if (!SUPPORTED_AUDIO_TYPES.has(audio.type)) {
      return Response.json(
        { error: `Unsupported audio type '${audio.type || "unknown"}'.` },
        { status: 415 },
      );
    }

    const whisper = createWhisperClient();
    const captureId = crypto.randomUUID();
    const transcription = await whisper.transcribe(audio);
    let audioUrl: string | null = null;

    try {
      const uploadedAudioUrl = await uploadAudioToSupabaseStorage(audio, captureId);
      audioUrl = uploadedAudioUrl ?? `local-audio://${captureId}`;

      await persistCapture({
        id: captureId,
        type: "voice",
        raw_text: transcription.text,
        audio_url: audioUrl,
        processed: false,
      });
    } catch (error) {
      console.error("Capture persistence skipped:", error);
    }

    return Response.json({
      text: transcription.text,
      confidence: transcription.confidence,
      duration_ms: transcription.durationMs,
      capture_id: captureId,
    });
  } catch (error) {
    console.error("Transcription route failed:", error);

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
