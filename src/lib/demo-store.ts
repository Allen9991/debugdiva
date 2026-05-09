import type { LineItem } from "@/lib/types";

export type DemoJobStatus =
  | "new"
  | "quoted"
  | "approved"
  | "in_progress"
  | "completed"
  | "invoiced"
  | "paid";

export type DemoMaterial = {
  name: string;
  cost: number;
};

export type DemoJob = {
  id: string;
  client_id?: string;
  client_name: string;
  client_email?: string;
  location: string;
  description: string;
  status: DemoJobStatus;
  labour_hours: number;
  materials: DemoMaterial[];
  created_at: string;
  updated_at: string;
};

export type DemoInvoice = {
  id: string;
  job_id: string;
  client_name: string;
  client_email?: string;
  location: string;
  description: string;
  line_items: LineItem[];
  labour_total: number;
  materials_total: number;
  gst: number;
  total: number;
  status: "draft" | "sent" | "paid";
  due_date: string;
  sent_at: string | null;
  created_at: string;
};

export type DemoQuote = {
  id: string;
  job_id: string;
  client_name: string;
  client_email?: string;
  location: string;
  description: string;
  line_items: LineItem[];
  total: number;
  status: "draft" | "sent" | "accepted" | "declined";
  expires_at: string;
  sent_at: string | null;
  created_at: string;
};

export type DemoDraftEmail = {
  id: string;
  client_name: string;
  client_email?: string;
  subject: string;
  body: string;
  created_at: string;
  updated_at: string;
};

export type DemoNotification = {
  id: string;
  title: string;
  body: string;
  href?: string;
  unread: boolean;
  created_at: string;
};

type DemoState = {
  jobs: DemoJob[];
  invoices: DemoInvoice[];
  quotes: DemoQuote[];
  draftEmails: DemoDraftEmail[];
  notifications: DemoNotification[];
  settings: {
    labour_rate: number;
    gst_enabled: boolean;
  };
};

const LABOUR_RATE = 90;

function isoDaysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function dateDaysFromNow(days: number) {
  return isoDaysFromNow(days).slice(0, 10);
}

function moneyRound(value: number) {
  return Math.round(value * 100) / 100;
}

function buildLineItems(job: DemoJob): LineItem[] {
  const labourTotal = moneyRound(job.labour_hours * LABOUR_RATE);
  return [
    ...(job.labour_hours > 0
      ? [
          {
            id: crypto.randomUUID(),
            description: "Labour",
            quantity: job.labour_hours,
            unit_price: LABOUR_RATE,
            total: labourTotal,
            type: "labour" as const,
          },
        ]
      : []),
    ...job.materials.map((material) => ({
      id: crypto.randomUUID(),
      description: material.name,
      quantity: 1,
      unit_price: material.cost,
      total: material.cost,
      type: "material" as const,
    })),
  ];
}

function invoiceFromJob(job: DemoJob, overrides: Partial<DemoInvoice> = {}): DemoInvoice {
  const lineItems = buildLineItems(job);
  const labourTotal = moneyRound(job.labour_hours * LABOUR_RATE);
  const materialsTotal = moneyRound(
    job.materials.reduce((sum, item) => sum + item.cost, 0),
  );
  const subtotal = moneyRound(labourTotal + materialsTotal);
  const gst = moneyRound(subtotal * 0.15);

  return {
    id: overrides.id ?? crypto.randomUUID(),
    job_id: job.id,
    client_name: job.client_name,
    client_email: job.client_email,
    location: job.location,
    description: job.description,
    line_items: overrides.line_items ?? lineItems,
    labour_total: overrides.labour_total ?? labourTotal,
    materials_total: overrides.materials_total ?? materialsTotal,
    gst: overrides.gst ?? gst,
    total: overrides.total ?? moneyRound(subtotal + gst),
    status: overrides.status ?? "draft",
    due_date: overrides.due_date ?? dateDaysFromNow(14),
    sent_at: overrides.sent_at ?? null,
    created_at: overrides.created_at ?? new Date().toISOString(),
  };
}

function quoteFromJob(job: DemoJob, overrides: Partial<DemoQuote> = {}): DemoQuote {
  const lineItems = buildLineItems(job);
  const labourTotal = moneyRound(job.labour_hours * LABOUR_RATE);
  const materialsTotal = moneyRound(
    job.materials.reduce((sum, item) => sum + item.cost, 0),
  );
  const total = moneyRound((labourTotal + materialsTotal) * 1.15);

  return {
    id: overrides.id ?? crypto.randomUUID(),
    job_id: job.id,
    client_name: job.client_name,
    client_email: job.client_email,
    location: job.location,
    description: job.description,
    line_items: overrides.line_items ?? lineItems,
    total: overrides.total ?? total,
    status: overrides.status ?? "draft",
    expires_at: overrides.expires_at ?? dateDaysFromNow(30),
    sent_at: overrides.sent_at ?? null,
    created_at: overrides.created_at ?? new Date().toISOString(),
  };
}

function createInitialState(): DemoState {
  const jobs: DemoJob[] = [
    {
      id: "33333333-3333-3333-3333-333333333333",
      client_id: "22222222-2222-2222-2222-222222222222",
      client_name: "Sarah Thompson",
      client_email: "sarah@example.com",
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
      created_at: isoDaysFromNow(-1),
      updated_at: isoDaysFromNow(-1),
    },
    {
      id: "33333333-3333-3333-3333-333333333334",
      client_id: "22222222-2222-2222-2222-222222222223",
      client_name: "James Wilson",
      client_email: "james@example.com",
      location: "14 Bealey Avenue, Christchurch",
      description: "Bathroom tap replacement. Quote sent, waiting for approval.",
      status: "quoted",
      labour_hours: 1.5,
      materials: [
        { name: "Mixer tap", cost: 95 },
        { name: "Flexible hose pair", cost: 28 },
      ],
      created_at: isoDaysFromNow(-6),
      updated_at: isoDaysFromNow(-5),
    },
    {
      id: "33333333-3333-3333-3333-333333333335",
      client_id: "22222222-2222-2222-2222-222222222224",
      client_name: "Emma Patel",
      client_email: "emma@example.com",
      location: "8 Riccarton Road, Christchurch",
      description: "Hot water cylinder inspection completed. Invoice already sent.",
      status: "invoiced",
      labour_hours: 1,
      materials: [{ name: "Inspection consumables", cost: 20 }],
      created_at: isoDaysFromNow(-12),
      updated_at: isoDaysFromNow(-11),
    },
  ];

  const invoices = [
    invoiceFromJob(jobs[0], {
      id: "55555555-5555-5555-5555-555555555555",
      status: "draft",
      due_date: dateDaysFromNow(7),
      created_at: isoDaysFromNow(-1),
    }),
    invoiceFromJob(jobs[2], {
      id: "55555555-5555-5555-5555-555555555556",
      status: "sent",
      due_date: dateDaysFromNow(-4),
      sent_at: isoDaysFromNow(-11),
      created_at: isoDaysFromNow(-12),
    }),
  ];

  const quotes = [
    quoteFromJob(jobs[1], {
      id: "66666666-6666-6666-6666-666666666666",
      status: "sent",
      expires_at: dateDaysFromNow(7),
      sent_at: isoDaysFromNow(-5),
      created_at: isoDaysFromNow(-5),
    }),
  ];

  return {
    jobs,
    invoices,
    quotes,
    draftEmails: [],
    notifications: [
      {
        id: "notif-draft-sarah",
        title: "Draft invoice ready",
        body: "Sarah Thompson has an invoice ready to review.",
        href: "/invoices/55555555-5555-5555-5555-555555555555",
        unread: true,
        created_at: isoDaysFromNow(-1),
      },
      {
        id: "notif-receipt",
        title: "Receipt needs linking",
        body: "Bunnings receipt is waiting for a job.",
        href: "/capture",
        unread: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
    ],
    settings: {
      labour_rate: LABOUR_RATE,
      gst_enabled: true,
    },
  };
}

const globalStore = globalThis as typeof globalThis & {
  __debugDivaDemoState?: DemoState;
};

const state = (globalStore.__debugDivaDemoState ??= createInitialState());

function draftEmailState() {
  state.draftEmails ??= [];
  return state.draftEmails;
}

export const demoStore = {
  jobs: {
    all() {
      return state.jobs;
    },
    get(id: string) {
      return state.jobs.find((job) => job.id === id) ?? null;
    },
    create(input: {
      client_name: string;
      client_email?: string;
      location: string;
      description: string;
      status: DemoJobStatus;
      labour_hours: number;
      materials: DemoMaterial[];
    }) {
      const now = new Date().toISOString();
      const job: DemoJob = {
        id: crypto.randomUUID(),
        client_id: crypto.randomUUID(),
        client_name: input.client_name,
        client_email: input.client_email,
        location: input.location,
        description: input.description,
        status: input.status,
        labour_hours: input.labour_hours,
        materials: input.materials,
        created_at: now,
        updated_at: now,
      };
      state.jobs.unshift(job);
      return job;
    },
    update(id: string, patch: Record<string, unknown>) {
      const job = state.jobs.find((item) => item.id === id);
      if (!job) return null;
      Object.assign(job, patch, { updated_at: new Date().toISOString() });
      return job;
    },
    delete(id: string) {
      const index = state.jobs.findIndex((item) => item.id === id);
      if (index === -1) return false;
      state.jobs.splice(index, 1);
      state.invoices = state.invoices.filter((invoice) => invoice.job_id !== id);
      state.quotes = state.quotes.filter((quote) => quote.job_id !== id);
      return true;
    },
  },
  invoices: {
    all() {
      return state.invoices;
    },
    get(id: string) {
      return state.invoices.find((invoice) => invoice.id === id) ?? null;
    },
    forJob(jobId: string) {
      return state.invoices.find((invoice) => invoice.job_id === jobId) ?? null;
    },
    create(input: { job_id: string }) {
      const job = demoStore.jobs.get(input.job_id);
      if (!job) return null;
      const existing = demoStore.invoices.forJob(job.id);
      if (existing) return existing;
      const invoice = invoiceFromJob(job);
      state.invoices.unshift(invoice);
      demoStore.jobs.update(job.id, { status: "invoiced" });
      return invoice;
    },
    update(id: string, patch: Partial<DemoInvoice>) {
      const invoice = state.invoices.find((item) => item.id === id);
      if (!invoice) return null;
      Object.assign(invoice, patch);
      return invoice;
    },
    delete(id: string) {
      const index = state.invoices.findIndex((item) => item.id === id);
      if (index === -1) return false;
      state.invoices.splice(index, 1);
      return true;
    },
  },
  quotes: {
    all() {
      return state.quotes;
    },
    get(id: string) {
      return state.quotes.find((quote) => quote.id === id) ?? null;
    },
    create(input: { job_id: string }) {
      const job = demoStore.jobs.get(input.job_id);
      if (!job) return null;
      const quote = quoteFromJob(job);
      state.quotes.unshift(quote);
      demoStore.jobs.update(job.id, { status: "quoted" });
      return quote;
    },
    update(id: string, patch: Partial<DemoQuote>) {
      const quote = state.quotes.find((item) => item.id === id);
      if (!quote) return null;
      Object.assign(quote, patch);
      return quote;
    },
    delete(id: string) {
      const index = state.quotes.findIndex((item) => item.id === id);
      if (index === -1) return false;
      state.quotes.splice(index, 1);
      return true;
    },
  },
  draftEmails: {
    all() {
      return draftEmailState();
    },
    get(id: string) {
      return draftEmailState().find((email) => email.id === id) ?? null;
    },
    create(input: {
      client_name: string;
      client_email?: string;
      subject: string;
      body: string;
    }) {
      const now = new Date().toISOString();
      const email: DemoDraftEmail = {
        id: crypto.randomUUID(),
        client_name: input.client_name,
        client_email: input.client_email,
        subject: input.subject,
        body: input.body,
        created_at: now,
        updated_at: now,
      };
      draftEmailState().unshift(email);
      return email;
    },
    update(id: string, patch: Partial<DemoDraftEmail>) {
      const email = draftEmailState().find((item) => item.id === id);
      if (!email) return null;
      Object.assign(email, patch, { updated_at: new Date().toISOString() });
      return email;
    },
    delete(id: string) {
      const emails = draftEmailState();
      const index = emails.findIndex((item) => item.id === id);
      if (index === -1) return false;
      emails.splice(index, 1);
      return true;
    },
  },
  notifications: {
    all() {
      return state.notifications;
    },
    push(input: Omit<DemoNotification, "id" | "unread" | "created_at">) {
      const notification: DemoNotification = {
        id: crypto.randomUUID(),
        unread: true,
        created_at: new Date().toISOString(),
        ...input,
      };
      state.notifications.unshift(notification);
      return notification;
    },
  },
  settings: {
    get() {
      return state.settings;
    },
  },
};
