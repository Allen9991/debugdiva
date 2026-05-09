import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  console.log("[POST /api/brain/extract] called");
  let body: { capture_id?: string; type?: string };
  try {
    body = await request.json();
  } catch {
    const errResp = { error: "Invalid JSON body" };
    console.log("[POST /api/brain/extract] returning:", errResp);
    return NextResponse.json(errResp, { status: 400 });
  }

  const captureId = body.capture_id;
  console.log(
    "[POST /api/brain/extract] called with: capture_id=",
    captureId,
    "type=",
    body.type,
  );
  if (!captureId || typeof captureId !== "string") {
    const errResp = { error: "capture_id is required" };
    console.log("[POST /api/brain/extract] returning:", errResp);
    return NextResponse.json(errResp, { status: 400 });
  }

  const captureType = body.type === "receipt" ? "receipt" : "voice";

  const extracted =
    captureType === "voice"
      ? {
          client_name: "Sarah Thompson",
          job_location: "25 Queen Street, Christchurch",
          labour_hours: 2,
          materials: [
            { name: "Sealant", cost: 15, quantity: 1 },
            { name: "Pipe fitting", cost: 25, quantity: 1 },
            { name: "Replacement valve", cost: 35, quantity: 1 },
          ],
          job_description:
            "Leak repair under kitchen sink. Used sealant, pipe fitting, replacement valve. Job tested and complete.",
          total_estimate: 255,
          missing_fields: [],
          clarifying_question: null,
          confidence: 0.92,
        }
      : {
          store_name: "Bunnings Warehouse Riccarton",
          date: new Date().toISOString().slice(0, 10),
          items: [
            { name: "PVC pipe 1m", quantity: 1, cost: 18.5 },
            { name: "Compression fitting", quantity: 4, cost: 9.5 },
          ],
          total: 56.5,
          gst: 7.37,
          payment_method: "EFTPOS",
          missing_fields: [],
          confidence: 0.88,
        };

  const response = {
    status: "accepted",
    message:
      captureType === "voice"
        ? "Voice capture extracted and ready for review."
        : "Receipt capture extracted and ready for expense review.",
    extracted,
    capture_id: captureId,
    processed_at: new Date().toISOString(),
  };
  console.log("[POST /api/brain/extract] returning extraction for", captureType);
  return NextResponse.json(response);
}
