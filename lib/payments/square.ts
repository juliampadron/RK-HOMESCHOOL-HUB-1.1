import crypto from 'crypto';

/**
 * Verifies a Square webhook signature.
 *
 * Square signs webhook payloads using HMAC-SHA256. The signature is sent in
 * the `x-square-hmacsha256-signature` header and is computed as:
 *   HMAC-SHA256(signatureKey, webhookUrl + rawBody)
 *
 * @see https://developer.squareup.com/docs/webhooks/step3validate
 */
export function verifySquareWebhookSignature({
  signatureKey,
  webhookUrl,
  rawBody,
  signature,
}: {
  signatureKey: string;
  webhookUrl: string;
  rawBody: string;
  signature: string;
}): boolean {
  const hmac = crypto.createHmac('sha256', signatureKey);
  hmac.update(webhookUrl + rawBody);
  const expected = hmac.digest('base64');
  // Use timingSafeEqual to prevent timing attacks.
  const expectedBuf = Buffer.from(expected, 'utf8');
  const signatureBuf = Buffer.from(signature, 'utf8');
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
