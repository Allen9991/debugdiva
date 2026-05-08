const DEMO_JOB_ID = "33333333-3333-3333-3333-333333333333";

type MessageType = "payment_reminder" | "quote_followup" | "job_complete";

function buildFallbackMessage(
  type: MessageType,
  clientName: string,
  jobDescription: string,
  location: string
): { subject: string; body: string } {
  switch (type) {
    case "job_complete":
      return {
        subject: `Job complete — ${location}`,
        body: `Hi ${clientName},\n\nJust wanted to let you know the work at ${location} is all done and tested — looking good.\n\nI'll get the invoice across to you shortly.\n\nThanks for the work, really appreciated.\n\nCheers`,
      };
    case "payment_reminder":
      return {
        subject: `Quick reminder — invoice due`,
        body: `Hi ${clientName},\n\nHope you're well. Just a friendly reminder that the invoice for the work at ${location} is due.\n\nLet me know if you have any questions or need anything else from me.\n\nCheers`,
      };
    case "quote_followup":
      return {
        subject: `Following up on your quote`,
        body: `Hi ${clientName},\n\nJust checking in on the quote I sent through for ${jobDescription}. Happy to talk it through if you have any questions.\n\nLet me know what you'd like to do.\n\nCheers`,
      };
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { type, job_id = DEMO_JOB_ID, user_tone_sample } = body as {
    type: MessageType;
    job_id?: string;
    user_tone_sample?: string;
  };

  // Fetch job + client from Jayden's jobs API
  const origin = new URL(request.url).origin;
  const jobRes = await fetch(`${origin}/api/jobs/${job_id}`);

  if (!jobRes.ok) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  const { job, client } = await jobRes.json();
  const clientName = client?.name ?? "there";
  const location = job.location ?? "your property";

  // Try Claude if API key is available
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (apiKey) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const claude = new Anthropic({ apiKey });

      const typeLabel = {
        job_complete: "job complete notification",
        payment_reminder: "payment reminder",
        quote_followup: "quote follow-up",
      }[type];

      const prompt = `You are drafting a short, friendly ${typeLabel} message from a NZ tradie to their client.

Client name: ${clientName}
Job: ${job.description}
Location: ${location}

${user_tone_sample ? `Match this writing style closely: "${user_tone_sample}"` : "Use a warm, casual NZ tradie tone — friendly but professional. Short sentences. Sign off with just 'Cheers'."}

Return a JSON object with "subject" and "body" fields only. No extra text.`;

      const response = await claude.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const parsed = JSON.parse(text);

      return Response.json({ subject: parsed.subject, body: parsed.body });
    } catch {
      // Fall through to template fallback
    }
  }

  // No API key or Claude failed — use template
  const message = buildFallbackMessage(type, clientName, job.description, location);
  return Response.json(message);
}
