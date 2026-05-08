export type Priority = "high" | "medium" | "low";

export type PendingActionType =
  | "send_invoice"
  | "follow_up_quote"
  | "attach_receipt"
  | "missing_info";

export type PendingAction = {
  type: PendingActionType;
  label: string;
  job_id?: string;
  priority: Priority;
};

export type JobStatus =
  | "new"
  | "quoted"
  | "approved"
  | "in_progress"
  | "completed"
  | "invoiced"
  | "paid";

export type Material = {
  name: string;
  cost: number;
};

export type User = {
  id: string;
  email: string;
  business_name: string;
  business_type: string;
  gst_registered: boolean;
  gst_number?: string | null;
  created_at: string;
};

export type Client = {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  created_at: string;
};

export type Job = {
  id: string;
  user_id: string;
  client_id: string | null;
  location: string | null;
  description: string;
  status: JobStatus;
  labour_hours: number | null;
  materials: Material[];
  created_at: string;
  updated_at: string;
};

export type JobWithClient = Job & {
  client: Client | null;
  client_name: string;
};

export type Capture = {
  id: string;
  user_id: string;
  type: CaptureType;
  raw_text?: string | null;
  image_url?: string | null;
  audio_url?: string | null;
  processed: boolean;
  job_id?: string | null;
  created_at: string;
};

export type InvoiceStatus = "draft" | "sent" | "paid";

export type LineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
};

export type Invoice = {
  id: string;
  job_id: string;
  line_items: LineItem[];
  labour_total: number;
  materials_total: number;
  gst: number;
  total: number;
  status: InvoiceStatus;
  due_date: string | null;
  sent_at?: string | null;
  created_at: string;
};

export type QuoteStatus = "draft" | "sent" | "accepted" | "declined";

export type Quote = {
  id: string;
  job_id: string;
  line_items: LineItem[];
  total: number;
  status: QuoteStatus;
  expires_at: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  job_id: string;
  type: string;
  subject?: string | null;
  body: string;
  status: "draft" | "sent";
  sent_at?: string | null;
  created_at: string;
};

export type CaptureType = "voice" | "receipt";

export type VoiceCaptureResult = {
  text: string;
  confidence: number;
  duration_ms: number;
  capture_id: string;
};

export type ReceiptCaptureResult = {
  image_url: string;
  capture_id: string;
};

export type CaptureHandoffStatus = "idle" | "sending" | "accepted" | "error";

export type RecentCapture =
  | {
      type: "voice";
      captureId: string;
      transcript: string;
      confidence: number;
      durationMs: number;
    }
  | {
      type: "receipt";
      captureId: string;
      imageUrl: string;
    };
