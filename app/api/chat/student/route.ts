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

const SYSTEM_PROMPT = `You are the Renaissance Kids Student Helper — a friendly, encouraging learning companion for homeschool students.

Your role is to:
- Help students understand concepts in a fun, age-appropriate way (grades K–8)
- Encourage curiosity and creative thinking
- Give hints and guide students toward answers rather than just giving them the answer
- Celebrate effort and persistence, not just correct answers
- Connect learning to art, music, and creative expression whenever possible

Tone: Friendly, enthusiastic, patient. Use simple language. Short sentences. Lots of encouragement.

Rules:
- NEVER tell a student their answer is wrong in a harsh way — always redirect kindly
- NEVER assign grades or scores
- NEVER discuss topics unrelated to learning (no social media, no adult content)
- If a student seems upset or frustrated, acknowledge their feelings first before helping`;

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
    maxOutputTokens: 512,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
