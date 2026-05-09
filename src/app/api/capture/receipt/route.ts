import {
  ensureCaptureBucket,
  getSupabaseServiceConfig,
  resolveCaptureUserId,
} from "@/lib/supabase/capture";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const RECEIPT_BUCKET = "captures";

type CaptureInsert = {
  id: string;
  user_id?: string;
  type: "receipt";
  image_url: string;
  processed: boolean;
};

async function uploadToSupabaseStorage(file: File, captureId: string) {
  const config = getSupabaseServiceConfig();

  if (!config) {
    return null;
  }

  await ensureCaptureBucket(config, RECEIPT_BUCKET);

  const fileExtension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/jpeg"
        ? "jpg"
        : "bin";
  const storagePath = `receipts/${captureId}.${fileExtension}`;

  const uploadResponse = await fetch(
    `${config.supabaseUrl}/storage/v1/object/${RECEIPT_BUCKET}/${storagePath}`,
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
    throw new Error(`Failed to upload receipt image: ${errorText}`);
  }

  return `${config.supabaseUrl}/storage/v1/object/public/${RECEIPT_BUCKET}/${storagePath}`;
}

async function persistCapture(record: CaptureInsert) {
  const config = getSupabaseServiceConfig();

  if (!config) {
    return;
  }

  const userId = await resolveCaptureUserId(config);
  const body = userId ? { ...record, user_id: userId } : record;

  const response = await fetch(`${config.supabaseUrl}/rest/v1/captures`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to persist receipt capture: ${errorText}`);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return Response.json(
        { error: "Expected multipart/form-data with an image file in the 'image' field." },
        { status: 400 },
      );
    }

    if (!SUPPORTED_IMAGE_TYPES.has(image.type)) {
      return Response.json(
        { error: `Unsupported image type '${image.type || "unknown"}'.` },
        { status: 415 },
      );
    }

    const captureId = crypto.randomUUID();
    let imageUrl = "";

    try {
      const uploadedUrl = await uploadToSupabaseStorage(image, captureId);

      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        imageUrl = `local-preview://${captureId}`;
      }

      await persistCapture({
        id: captureId,
        type: "receipt",
        image_url: imageUrl,
        processed: false,
      });
    } catch (error) {
      console.error("Receipt persistence skipped:", error);
      imageUrl = imageUrl || `local-preview://${captureId}`;
    }

    return Response.json({
      image_url: imageUrl,
      capture_id: captureId,
    });
  } catch (error) {
    console.error("Receipt route failed:", error);

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
