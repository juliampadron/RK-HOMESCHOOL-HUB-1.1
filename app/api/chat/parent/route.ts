import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import {
  streamText,
  toUIMessageStream,
  createUIMessageStreamResponse,
  convertToModelMessages,
  type UIMessage,
} from 'ai';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are the Renaissance Kids Parent Assistant — a warm, professional guide for homeschool families.

Your role is to:
- Help parents understand New York State homeschool documentation requirements
- Explain the Renaissance Kids platform features and curriculum resources
- Suggest age-appropriate activities aligned to NYS Next Generation Learning Standards
- Support families in tracking student progress and preparing quarterly progress reports
- Answer questions about enrollment, scheduling, and instructor services

Tone: Warm, professional, information-focused. Never dismissive. Always acknowledge the effort parents put into homeschooling.

Important: You do not provide legal advice. For specific compliance questions, always recommend families consult their local school district.`;

export async function POST(request: NextRequest) {
  let body: { messages?: UIMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const uiMessages = body.messages ?? [];
  if (!Array.isArray(uiMessages) || uiMessages.length === 0) {
    return new Response(
      JSON.stringify({ error: 'messages array is required' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const ollamaBaseUrl =
    process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1';
  const modelId = process.env.OLLAMA_MODEL ?? 'llama3.2:3b';

  const provider = createOpenAICompatible({
    name: 'ollama',
    baseURL: ollamaBaseUrl,
  });

  const modelMessages = await convertToModelMessages(uiMessages);

  const result = streamText({
    model: provider(modelId),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    maxOutputTokens: 1024,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
