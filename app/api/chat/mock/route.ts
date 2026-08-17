import { randomUUID } from 'crypto';
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
} from 'ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHUNKS = ['Renaissance', ' Kids', ' is ready.'] as const;

/**
 * Test-only deterministic stream endpoint.
 *
 * It deliberately uses the same AI SDK v7 UIMessage stream protocol as the
 * production routes. The endpoint is unavailable unless the explicit smoke
 * test environment flag is present, so it cannot become a production assistant.
 */
export async function POST() {
  if (process.env.CHAT_SMOKE_TEST !== '1') {
    return new Response('Not found', { status: 404 });
  }

  const messageId = `mock-${randomUUID()}`;
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: 'text-start', id: messageId });

      for (const delta of CHUNKS) {
        writer.write({ type: 'text-delta', id: messageId, delta });
        await new Promise<void>((resolve) => setTimeout(resolve, 200));
      }

      writer.write({ type: 'text-end', id: messageId });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

