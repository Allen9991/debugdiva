const OPENAI_TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions";

type WhisperSegment = {
  avg_logprob?: number;
};

type WhisperResponse = {
  text?: string;
  duration?: number;
  segments?: WhisperSegment[];
};

function getOpenAiApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  return apiKey;
}

function calculateConfidence(segments: WhisperSegment[] | undefined) {
  if (!segments?.length) {
    return 0.82;
  }

  const probabilities = segments
    .map((segment) => segment.avg_logprob)
    .filter((value): value is number => typeof value === "number")
    .map((value) => Math.max(0, Math.min(1, Math.exp(value))));

  if (!probabilities.length) {
    return 0.82;
  }

  const average =
    probabilities.reduce((sum, value) => sum + value, 0) / probabilities.length;

  return Number(average.toFixed(2));
}

export function createWhisperClient() {
  return {
    provider: "openai" as const,
    async transcribe(audioFile: File) {
      const formData = new FormData();
      formData.append("file", audioFile, audioFile.name);
      formData.append("model", "whisper-1");
      formData.append("response_format", "verbose_json");

      const response = await fetch(OPENAI_TRANSCRIPTIONS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getOpenAiApiKey()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Whisper transcription failed (${response.status}): ${errorText}`,
        );
      }

      const payload = (await response.json()) as WhisperResponse;

      return {
        text: payload.text?.trim() ?? "",
        confidence: calculateConfidence(payload.segments),
        durationMs: Math.round((payload.duration ?? 0) * 1000),
      };
    },
  };
}
