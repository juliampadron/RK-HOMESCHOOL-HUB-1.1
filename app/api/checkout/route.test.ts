import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createPaymentLink, requireAuth } = vi.hoisted(() => ({
  createPaymentLink: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('square', () => ({
  SquareEnvironment: {
    Production: 'production',
    Sandbox: 'sandbox',
  },
  SquareClient: class SquareClient {
    checkout = {
      paymentLinks: {
        create: createPaymentLink,
      },
    };
  },
}));

vi.mock('@/lib/auth/helpers', () => ({
  requireAuth,
}));

import { POST } from './route';

const resourceId = '12121212-1212-4121-8121-121212121212';
const idempotencyKey = 'checkout-response-shape-test';
const checkoutUrl = 'https://square.link/u/rk-checkout-test';

function makeRequest() {
  return new NextRequest('http://localhost:3000/api/checkout', {
    method: 'POST',
    body: JSON.stringify({
      resource_id: resourceId,
      quantity: 2,
      idempotency_key: idempotencyKey,
    }),
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuth.mockResolvedValue({
      user: { id: '34343434-3434-4343-8343-343434343434' },
    });
  });

  it('returns the Square v42 paymentLink URL without a legacy result wrapper', async () => {
    createPaymentLink.mockResolvedValue({
      paymentLink: { url: checkoutUrl },
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ url: checkoutUrl });
    expect(createPaymentLink).toHaveBeenCalledWith({
      idempotencyKey,
      order: {
        locationId: '',
        lineItems: [
          {
            quantity: '2',
            catalogObjectId: resourceId,
          },
        ],
      },
      checkoutOptions: {
        redirectUrl: 'http://localhost:3000/resources',
      },
    });
  });

  it('does not return a URL when Square omits paymentLink from its response', async () => {
    createPaymentLink.mockResolvedValue({});

    const response = await POST(makeRequest());

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ url: undefined });
  });
});
