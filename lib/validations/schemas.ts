import { z } from 'zod';

// ─── Chat ─────────────────────────────────────────────────────────────────────

// ai 7.x UIMessage part types (text, tool-call, etc.)
const uiPartSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.string() }).passthrough(),
]);

// Accept both ai 7.x UIMessage format (parts[]) and legacy { role, content } format.
export const chatMessageSchema = z.union([
  // ai 7.x UIMessage
  z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    parts: z.array(uiPartSchema).optional(),
    content: z.string().max(4096).optional(),
  }),
  // Legacy plain message
  z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(4096),
  }),
]);

export const chatRequestSchema = z.object({
  id: z.string().optional(),
  messages: z.array(chatMessageSchema).min(1).max(50),
  trigger: z.string().optional(),
  messageId: z.string().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// ─── Reports ─────────────────────────────────────────────────────────────────

export const quarterlyReportQuerySchema = z.object({
  student_id: z.string().uuid('student_id must be a valid UUID'),
  year: z.coerce
    .number()
    .int()
    .min(2000)
    .max(2100),
  quarter: z.coerce
    .number()
    .int()
    .min(1)
    .max(4),
  format: z.enum(['json', 'pdf']).default('json'),
});

export type QuarterlyReportQuery = z.infer<typeof quarterlyReportQuerySchema>;

// ─── Checkout ────────────────────────────────────────────────────────────────

export const checkoutRequestSchema = z.object({
  resource_id: z.string().uuid('resource_id must be a valid UUID'),
  quantity: z.number().int().min(1).max(10).default(1),
  idempotency_key: z.string().min(1).max(64).optional(),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

// ─── Messages ────────────────────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  sender_id: z.string().uuid('sender_id must be a valid UUID'),
  recipient_id: z.string().uuid('recipient_id must be a valid UUID'),
  subject: z.string().max(255).optional(),
  body: z.string().min(1).max(10000),
});

export type SendMessage = z.infer<typeof sendMessageSchema>;
