import { SquareClient, SquareEnvironment } from 'square';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { checkoutRequestSchema } from '@/lib/validations/schemas';
import { requireAuth } from '@/lib/auth/helpers';

export const runtime = 'nodejs';

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN ?? '',
  environment:
    process.env.SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
});

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { resource_id, quantity, idempotency_key } = parsed.data;

  try {
    const response = await squareClient.checkout.paymentLinks.create({
      idempotencyKey: idempotency_key ?? randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID ?? '',
        lineItems: [
          {
            quantity: String(quantity),
            catalogObjectId: resource_id,
          },
        ],
      },
      checkoutOptions: {
        redirectUrl: `${
          process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
        }/resources`,
      },
    });

    return NextResponse.json(
      { url: response.paymentLink?.url },
      { status: 201 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Square checkout failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
