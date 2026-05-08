import { NextResponse } from "next/server";

const demoUserId = "11111111-1111-1111-1111-111111111111";

const demoClients = [
  {
    id: "22222222-2222-2222-2222-222222222222",
    user_id: demoUserId,
    name: "Sarah Thompson",
    email: "sarah.thompson@example.com",
    phone: "021 555 0142",
    address: "25 Queen Street, Christchurch",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "22222222-2222-2222-2222-222222222223",
    user_id: demoUserId,
    name: "James Wilson",
    email: "james.wilson@example.com",
    phone: "027 555 0188",
    address: "14 Bealey Avenue, Christchurch",
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "22222222-2222-2222-2222-222222222224",
    user_id: demoUserId,
    name: "Emma Patel",
    email: "emma.patel@example.com",
    phone: "022 555 0199",
    address: "8 Riccarton Road, Christchurch",
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const demoJobs = [
  {
    id: "33333333-3333-3333-3333-333333333333",
    user_id: demoUserId,
    client_id: "22222222-2222-2222-2222-222222222222",
    location: "25 Queen Street, Christchurch",
    description:
      "Leak repair under kitchen sink. Used sealant, pipe fitting, and replacement valve. Job tested and complete.",
    status: "completed",
    labour_hours: 2,
    materials: [
      { name: "Sealant", cost: 15 },
      { name: "Pipe fitting", cost: 25 },
      { name: "Replacement valve", cost: 35 },
    ],
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "33333333-3333-3333-3333-333333333334",
    user_id: demoUserId,
    client_id: "22222222-2222-2222-2222-222222222223",
    location: "14 Bealey Avenue, Christchurch",
    description: "Bathroom tap replacement. Quote sent, waiting for approval.",
    status: "quoted",
    labour_hours: 1.5,
    materials: [
      { name: "Mixer tap", cost: 95 },
      { name: "Flexible hose pair", cost: 28 },
    ],
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "33333333-3333-3333-3333-333333333335",
    user_id: demoUserId,
    client_id: "22222222-2222-2222-2222-222222222224",
    location: "8 Riccarton Road, Christchurch",
    description: "Hot water cylinder inspection completed. Invoice already sent.",
    status: "invoiced",
    labour_hours: 1,
    materials: [{ name: "Inspection consumables", cost: 20 }],
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const demoCaptures = [
  {
    id: "44444444-4444-4444-4444-444444444444",
    user_id: demoUserId,
    type: "voice",
    raw_text:
      "Finished leak repair for Sarah at 25 Queen Street. Two hours labour. Used sealant, pipe fitting, replacement valve. Materials around $75. Job tested and complete.",
    processed: true,
    job_id: "33333333-3333-3333-3333-333333333333",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "44444444-4444-4444-4444-444444444445",
    user_id: demoUserId,
    type: "receipt",
    raw_text: "Bunnings receipt. Plumbing materials. Total $75.00 including GST.",
    processed: true,
    job_id: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const demoInvoices = [
  {
    id: "55555555-5555-5555-5555-555555555555",
    job_id: "33333333-3333-3333-3333-333333333333",
    line_items: [
      {
        description: "Labour - leak repair",
        quantity: 2,
        unit_price: 90,
        total: 180,
      },
      {
        description: "Materials - sealant, pipe fitting, replacement valve",
        quantity: 1,
        unit_price: 75,
        total: 75,
      },
    ],
    labour_total: 180,
    materials_total: 75,
    gst: 38.25,
    total: 293.25,
    status: "draft",
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    sent_at: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "55555555-5555-5555-5555-555555555556",
    job_id: "33333333-3333-3333-3333-333333333335",
    line_items: [
      {
        description: "Hot water cylinder inspection",
        quantity: 1,
        unit_price: 90,
        total: 90,
      },
      {
        description: "Inspection consumables",
        quantity: 1,
        unit_price: 20,
        total: 20,
      },
    ],
    labour_total: 90,
    materials_total: 20,
    gst: 16.5,
    total: 126.5,
    status: "sent",
    due_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    sent_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const demoQuotes = [
  {
    id: "66666666-6666-6666-6666-666666666666",
    job_id: "33333333-3333-3333-3333-333333333334",
    line_items: [
      {
        description: "Labour - bathroom tap replacement",
        quantity: 1.5,
        unit_price: 90,
        total: 135,
      },
      {
        description: "Mixer tap and hose pair",
        quantity: 1,
        unit_price: 123,
        total: 123,
      },
    ],
    total: 296.7,
    status: "sent",
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const demoMessages = [
  {
    id: "77777777-7777-7777-7777-777777777777",
    job_id: "33333333-3333-3333-3333-333333333333",
    type: "job_complete",
    subject: "Leak repair completed",
    body: "Hi Sarah, the leak repair at 25 Queen Street has been completed and tested. I have drafted the invoice and will send it through shortly. Thanks again.",
    status: "draft",
    sent_at: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "77777777-7777-7777-7777-777777777778",
    job_id: "33333333-3333-3333-3333-333333333334",
    type: "quote_follow_up",
    subject: "Following up your bathroom tap quote",
    body: "Hi James, just checking whether you had a chance to review the quote for the bathroom tap replacement. Happy to answer any questions.",
    status: "draft",
    sent_at: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "77777777-7777-7777-7777-777777777779",
    job_id: "33333333-3333-3333-3333-333333333335",
    type: "payment_follow_up",
    subject: "Friendly payment reminder",
    body: "Hi Emma, just a friendly reminder that the invoice for the hot water cylinder inspection is now overdue. Please let me know if you have any questions.",
    status: "draft",
    sent_at: null,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const job = demoJobs.find((item) => item.id === id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const client = demoClients.find((item) => item.id === job.client_id) ?? null;
  const invoice = demoInvoices.find((item) => item.job_id === job.id) ?? null;
  const quote = demoQuotes.find((item) => item.job_id === job.id) ?? null;
  const captures = demoCaptures.filter((item) => item.job_id === job.id);
  const messages = demoMessages.filter((item) => item.job_id === job.id);

  return NextResponse.json({
    job,
    client,
    invoice,
    quote,
    captures,
    messages,
  });
}