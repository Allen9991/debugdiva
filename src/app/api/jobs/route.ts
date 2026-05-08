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

export async function GET() {
  const jobs = demoJobs.map((job) => {
    const client = demoClients.find((item) => item.id === job.client_id);

    return {
      ...job,
      client,
      client_name: client?.name ?? "Unknown client",
    };
  });

  return NextResponse.json({ jobs });
}