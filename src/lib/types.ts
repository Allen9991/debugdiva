export type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  type: "labour" | "material";
};

export type Job = {
  id: string;
  title: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  job_description: string;
  address?: string;
  line_items: LineItem[];
  labour_total: number;
  materials_total: number;
  status: "pending" | "complete" | "invoiced";
  notes?: string;
  created_at: string;
  user_id?: string;
};

export type Invoice = {
  id: string;
  job_id: string;
  invoice_number: string;
  client_name: string;
  client_email?: string;
  job_description: string;
  line_items: LineItem[];
  labour_total: number;
  materials_total: number;
  subtotal: number;
  gst: number;
  total: number;
  gst_enabled: boolean;
  due_date: string;
  status: "draft" | "sent" | "paid";
  sent_at?: string;
  created_at: string;
};

export type Quote = {
  id: string;
  job_id: string;
  quote_number: string;
  client_name: string;
  client_email?: string;
  job_description: string;
  line_items: LineItem[];
  subtotal: number;
  gst: number;
  total: number;
  status: "draft" | "sent" | "accepted" | "declined";
  gst_enabled: boolean;
  expires_at: string;
  sent_at?: string;
  created_at: string;
};

export type Message = {
  id: string;
  job_id: string;
  type: "payment_reminder" | "quote_followup" | "job_complete";
  subject?: string;
  body: string;
  status: "draft" | "sent";
  sent_at?: string;
  created_at: string;
};

