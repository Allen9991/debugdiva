import type { Capture, Client, Invoice, Job, JobWithClient, Message, Quote, User } from "@/lib/types";

export const demoUserId = "11111111-1111-1111-1111-111111111111";

const daysAgo = (days: number) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const hoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

const daysFromNowDate = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const demoUser: User = {
  id: demoUserId,
  email: "mike@ghostplumbing.co.nz",
  business_name: "Ghost Plumbing",
  business_type: "plumber",
  gst_registered: true,
  gst_number: "123-456-789",
  created_at: daysAgo(30),
};

export const demoClients: Client[] = [
  {
    id: "22222222-2222-2222-2222-222222222222",
    user_id: demoUserId,
    name: "Sarah Thompson",
    email: "sarah.thompson@example.com",
    phone: "021 555 0142",
    address: "25 Queen Street, Christchurch",
    created_at: daysAgo(7),
  },
  {
    id: "22222222-2222-2222-2222-222222222223",
    user_id: demoUserId,
    name: "James Wilson",
    email: "james.wilson@example.com",
    phone: "027 555 0188",
    address: "14 Bealey Avenue, Christchurch",
    created_at: daysAgo(12),
  },
  {
    id: "22222222-2222-2222-2222-222222222224",
    user_id: demoUserId,
    name: "Emma Patel",
    email: "emma.patel@example.com",
    phone: "022 555 0199",
    address: "8 Riccarton Road, Christchurch",
    created_at: daysAgo(20),
  },
];

export const demoJobs: Job[] = [
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
    created_at: daysAgo(1),
    updated_at: daysAgo(1),
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
    created_at: daysAgo(6),
    updated_at: daysAgo(6),
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
    created_at: daysAgo(12),
    updated_at: daysAgo(12),
  },
  {
    id: "33333333-3333-3333-3333-333333333336",
    user_id: demoUserId,
    client_id: null,
    location: null,
    description: "Unlinked receipt capture from Bunnings. Needs attaching to the right job.",
    status: "new",
    labour_hours: null,
    materials: [],
    created_at: hoursAgo(2),
    updated_at: hoursAgo(2),
  },
];

export const demoCaptures: Capture[] = [
  {
    id: "44444444-4444-4444-4444-444444444444",
    user_id: demoUserId,
    type: "voice",
    raw_text:
      "Finished leak repair for Sarah at 25 Queen Street. Two hours labour. Used sealant, pipe fitting, replacement valve. Materials around $75. Job tested and complete.",
    image_url: null,
    audio_url: "/demo/audio/sarah-queen-street-note.mp3",
    processed: true,
    job_id: "33333333-3333-3333-3333-333333333333",
    created_at: daysAgo(1),
  },
  {
    id: "44444444-4444-4444-4444-444444444445",
    user_id: demoUserId,
    type: "receipt",
    raw_text: "Bunnings receipt. Plumbing materials. Total $75.00 including GST.",
    image_url: "/demo/receipts/bunnings-75.jpg",
    audio_url: null,
    processed: true,
    job_id: null,
    created_at: hoursAgo(2),
  },
];

export const demoInvoices: Invoice[] = [
  {
    id: "55555555-5555-5555-5555-555555555555",
    job_id: "33333333-3333-3333-3333-333333333333",
    line_items: [
      { description: "Labour - leak repair", quantity: 2, unit_price: 90, total: 180 },
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
    due_date: daysFromNowDate(7),
    sent_at: null,
    created_at: daysAgo(1),
  },
  {
    id: "55555555-5555-5555-5555-555555555556",
    job_id: "33333333-3333-3333-3333-333333333335",
    line_items: [
      { description: "Hot water cylinder inspection", quantity: 1, unit_price: 90, total: 90 },
      { description: "Inspection consumables", quantity: 1, unit_price: 20, total: 20 },
    ],
    labour_total: 90,
    materials_total: 20,
    gst: 16.5,
    total: 126.5,
    status: "sent",
    due_date: daysFromNowDate(-4),
    sent_at: daysAgo(11),
    created_at: daysAgo(12),
  },
];

export const demoQuotes: Quote[] = [
  {
    id: "66666666-6666-6666-6666-666666666666",
    job_id: "33333333-3333-3333-3333-333333333334",
    line_items: [
      { description: "Labour - bathroom tap replacement", quantity: 1.5, unit_price: 90, total: 135 },
      { description: "Mixer tap and hose pair", quantity: 1, unit_price: 123, total: 123 },
    ],
    total: 296.7,
    status: "sent",
    expires_at: daysFromNowDate(7),
    created_at: daysAgo(5),
  },
];

export const demoMessages: Message[] = [
  {
    id: "77777777-7777-7777-7777-777777777777",
    job_id: "33333333-3333-3333-3333-333333333333",
    type: "job_complete",
    subject: "Leak repair completed",
    body: "Hi Sarah, the leak repair at 25 Queen Street has been completed and tested. I have drafted the invoice and will send it through shortly. Thanks again.",
    status: "draft",
    sent_at: null,
    created_at: daysAgo(1),
  },
  {
    id: "77777777-7777-7777-7777-777777777778",
    job_id: "33333333-3333-3333-3333-333333333334",
    type: "quote_follow_up",
    subject: "Following up your bathroom tap quote",
    body: "Hi James, just checking whether you had a chance to review the quote for the bathroom tap replacement. Happy to answer any questions.",
    status: "draft",
    sent_at: null,
    created_at: daysAgo(2),
  },
  {
    id: "77777777-7777-7777-7777-777777777779",
    job_id: "33333333-3333-3333-3333-333333333335",
    type: "payment_follow_up",
    subject: "Friendly payment reminder",
    body: "Hi Emma, just a friendly reminder that the invoice for the hot water cylinder inspection is now overdue. Please let me know if you have any questions.",
    status: "draft",
    sent_at: null,
    created_at: daysAgo(1),
  },
];

export function getJobsWithClients(): JobWithClient[] {
  return demoJobs.map((job) => {
    const client = demoClients.find((item) => item.id === job.client_id) ?? null;

    return {
      ...job,
      client,
      client_name: client?.name ?? "Unknown client",
    };
  });
}
