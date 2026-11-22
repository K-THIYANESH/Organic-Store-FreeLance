import { sendJson, methodNotAllowed, readJson } from '../../server/http.js';
import { validatePorterOrder } from '../../server/validate.js';

/**
 * POST /api/porter/create-order
 * Dispatch only after payment is confirmed. The Porter key stays on the server.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const body = await readJson(req);
    const errors = validatePorterOrder(body);
    if (errors.length) return sendJson(res, 400, { error: 'Invalid delivery order', details: errors });

    const apiKey = process.env.PORTER_API_KEY;
    const baseUrl = (process.env.PORTER_API_BASE_URL || '').replace(/\/$/, '');
    if (!apiKey || !baseUrl) {
      return sendJson(res, 503, { error: 'Porter is not configured' });
    }

    const response = await fetch(`${baseUrl}/v1/orders/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        quote_id: body.quoteId,
        request_id: body.orderId
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return sendJson(res, 502, { error: 'Porter dispatch failed' });
    }

    return sendJson(res, 200, {
      orderId: body.orderId,
      quoteId: body.quoteId,
      trackingId: payload.tracking_id || payload.order_id || null,
      status: 'assigned'
    });
  } catch (error) {
    return sendJson(res, error.status || 500, { error: error.message || 'Could not create delivery' });
  }
}
