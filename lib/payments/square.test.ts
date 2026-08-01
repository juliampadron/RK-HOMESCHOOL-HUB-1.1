import crypto from 'crypto';
import { describe, expect, it } from 'vitest';
import { verifySquareWebhookSignature } from './square';

const SIGNATURE_KEY = 'test-signature-key';
const WEBHOOK_URL = 'https://example.com/api/webhooks/square';
const RAW_BODY = JSON.stringify({ type: 'payment.completed', data: {} });

function makeSignature(key: string, url: string, body: string): string {
  return crypto
    .createHmac('sha256', key)
    .update(url + body)
    .digest('base64');
}

describe('verifySquareWebhookSignature', () => {
  it('accepts a valid Square webhook signature', () => {
    const signature = makeSignature(SIGNATURE_KEY, WEBHOOK_URL, RAW_BODY);
    expect(
      verifySquareWebhookSignature({
        signatureKey: SIGNATURE_KEY,
        webhookUrl: WEBHOOK_URL,
        rawBody: RAW_BODY,
        signature,
      })
    ).toBe(true);
  });

  it('rejects an invalid Square webhook signature', () => {
    expect(
      verifySquareWebhookSignature({
        signatureKey: SIGNATURE_KEY,
        webhookUrl: WEBHOOK_URL,
        rawBody: RAW_BODY,
        signature: 'invalid-signature-value',
      })
    ).toBe(false);
  });
});
