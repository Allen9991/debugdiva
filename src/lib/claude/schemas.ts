import { z } from "zod";

export const MaterialSchema = z.object({
  name: z.string(),
  cost: z.number().nullable(),
  quantity: z.number().nullable(),
});

export const ExtractVoiceResponseSchema = z.object({
  client_name: z.string().nullable(),
  job_location: z.string().nullable(),
  labour_hours: z.number().nullable(),
  materials: z.array(MaterialSchema),
  job_description: z.string().nullable(),
  total_estimate: z.number().nullable(),
  missing_fields: z.array(z.string()),
  clarifying_question: z.string().nullable(),
  confidence: z.number().min(0).max(1),
});

export type ExtractVoiceResponse = z.infer<typeof ExtractVoiceResponseSchema>;
export type Material = z.infer<typeof MaterialSchema>;

// --- Chat ---

export const ChatJobSchema = z.object({
  id: z.string(),
  client_name: z.string().nullish(),
  location: z.string().nullish(),
  description: z.string(),
  status: z.string(),
  labour_hours: z.number().nullish(),
  materials: z
    .array(
      z.object({
        name: z.string(),
        cost: z.number().nullish(),
        quantity: z.number().nullish(),
      }),
    )
    .optional(),
});

export const ChatInvoiceSchema = z.object({
  id: z.string(),
  job_id: z.string(),
  client_name: z.string().nullish(),
  total: z.number(),
  status: z.string(),
  due_date: z.string().nullish(),
});

export const ChatRequestSchema = z.object({
  message: z.string().min(1, "message is required"),
  conversation_id: z.string().min(1, "conversation_id is required"),
  context: z.object({
    recent_jobs: z.array(ChatJobSchema),
    pending_invoices: z.array(ChatInvoiceSchema),
  }),
});

export const SuggestedActionSchema = z.object({
  label: z.string(),
  action: z.string(),
});

export const ChatResponseSchema = z.object({
  response: z.string(),
  suggested_actions: z.array(SuggestedActionSchema),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type SuggestedAction = z.infer<typeof SuggestedActionSchema>;

export const structuredOutputSchemas = {
  voiceExtraction: ExtractVoiceResponseSchema,
  receiptExtraction: null,
  chat: ChatResponseSchema,
};
