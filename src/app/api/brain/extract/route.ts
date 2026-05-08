const SUPPORTED_CAPTURE_TYPES = new Set(["voice", "receipt"]);

type ExtractRequest = {
  capture_id?: string;
  type?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExtractRequest;

    if (!body.capture_id) {
      return Response.json(
        { error: "capture_id is required." },
        { status: 400 },
      );
    }

    if (!body.type || !SUPPORTED_CAPTURE_TYPES.has(body.type)) {
      return Response.json(
        { error: "type must be 'voice' or 'receipt'." },
        { status: 400 },
      );
    }

    return Response.json({
      status: "accepted",
      capture_id: body.capture_id,
      message:
        body.type === "voice"
          ? "Voice capture handed to Brain Zone. Extraction can start now."
          : "Receipt capture handed to Brain Zone. Extraction can start now.",
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to hand off capture for extraction.",
      },
      { status: 500 },
    );
  }
}
