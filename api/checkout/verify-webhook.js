import crypto from 'node:crypto';
import { sendJson, methodNotAllowed, readRawBody } from '../../server/http.js';

/**
 * POST /api/checkout/verify-webhook
 * Razorpay signs the raw request body with RAZORPAY_WEBHOOK_SECRET (HMAC-SHA256).
 * Compare the header in constant time, then fulfill the order. Ignore browser success callbacks.
 */
export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return sendJson(res, 503, { error: 'Webhook secret is not configured' });

  const signature = req.headers['x-razorpay-signature'];
  if (!signature || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) {
    return sendJson(res, 400, { error: 'Missing signature' });
  }

  const raw = await readRawBody(req);
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(signature, 'hex');
  const valid = expectedBuffer.length === receivedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!valid) return sendJson(res, 401, { error: 'Invalid signature' });

  let event;
  try {
    event = JSON.parse(raw.toString('utf8'));
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON' });
  }

  // event.event === 'payment.captured' → mark Order paid and queue Porter dispatch.
  return sendJson(res, 200, { received: true, event: event && event.event ? event.event : null });
}
