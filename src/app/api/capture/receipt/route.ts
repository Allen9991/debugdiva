const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);

export async function POST(request: Request) {
  console.log("[POST /api/capture/receipt] called");
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      const errResp = {
        error: "Expected multipart/form-data with an image file in the 'image' field.",
      };
      console.log("[POST /api/capture/receipt] returning:", errResp);
      return Response.json(errResp, { status: 400 });
    }

    if (!SUPPORTED_IMAGE_TYPES.has(image.type)) {
      const errResp = { error: "Unsupported image type '" + (image.type || "unknown") + "'." };
      console.log("[POST /api/capture/receipt] returning:", errResp);
      return Response.json(errResp, { status: 415 });
    }

    console.log(
      "[POST /api/capture/receipt] called with: image bytes=",
      image.size,
      "type=",
      image.type,
    );

    const captureId = crypto.randomUUID();
    const imageUrl = "local-preview://" + captureId;

    const successResp = { image_url: imageUrl, capture_id: captureId };
    console.log("[POST /api/capture/receipt] returning:", successResp);
    return Response.json(successResp);
  } catch (error) {
    console.error("[POST /api/capture/receipt] threw:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while uploading the receipt.",
      },
      { status: 500 },
    );
  }
}
