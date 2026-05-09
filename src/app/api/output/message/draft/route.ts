import { demoStore } from "@/lib/demo-store";

const DEMO_JOB_ID = "33333333-3333-3333-3333-333333333333";

type MessageType = "payment_reminder" | "quote_followup" | "job_complete";

function buildFallbackMessage(
  type: MessageType,
  clientName: string,
  jobDescription: string,
  location: string,
): { subject: string; body: string } {
  switch (type) {
    case "job_complete":
      return {
        subject: "Job complete - " + location,
        body:
          "Hi " +
          clientName +
          ",\n\nJust wanted to let you know the work at " +
          location +
          " is all done and tested - looking good.\n\nI'll get the invoice across to you shortly.\n\nThanks for the work, really appreciated.\n\nCheers",
      };
    case "payment_reminder":
      return {
        subject: "Quick reminder - invoice due",
        body:
          "Hi " +
          clientName +
          ",\n\nHope you're well. Just a friendly reminder that the invoice for the work at " +
          location +
          " is due.\n\nLet me know if you have any questions.\n\nCheers",
      };
    case "quote_followup":
      return {
        subject: "Following up on your quote",
        body:
          "Hi " +
          clientName +
          ",\n\nJust checking in on the quote I sent through for " +
          jobDescription +
          ". Happy to talk it through if you have any questions.\n\nCheers",
      };
  }
}

export async function POST(request: Request) {
  console.log("[POST /api/output/message/draft] called");
  const body = await request.json().catch(() => ({}));
  const { type, job_id = DEMO_JOB_ID } = body as {
    type: MessageType;
    job_id?: string;
  };
  console.log("[POST /api/output/message/draft] called with:", { type, job_id });

  const job = demoStore.jobs.get(job_id);
  if (!job) {
    const errResp = { error: "Job not found" };
    console.log("[POST /api/output/message/draft] returning:", errResp);
    return Response.json(errResp, { status: 404 });
  }

  const message = buildFallbackMessage(
    type,
    job.client_name,
    job.description,
    job.location,
  );
  console.log(
    "[POST /api/output/message/draft] returning template draft, type:",
    type,
  );
  return Response.json(message);
}
