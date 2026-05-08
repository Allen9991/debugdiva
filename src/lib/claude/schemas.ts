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

export const structuredOutputSchemas = {
  voiceExtraction: ExtractVoiceResponseSchema,
  receiptExtraction: null,
};
