import { sendJson, methodNotAllowed, readJson } from '../../server/http.js';
import { validatePorterQuote } from '../../server/validate.js';

/**
 * POST /api/porter/get-quote
 * PORTER_API_KEY is attached here. The browser never sees it.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const body = await readJson(req);
    const errors = validatePorterQuote(body);
    if (errors.length) return sendJson(res, 400, { error: 'Invalid quote request', details: errors });

    const apiKey = process.env.PORTER_API_KEY;
    const baseUrl = (process.env.PORTER_API_BASE_URL || '').replace(/\/$/, '');
    if (!apiKey || !baseUrl) {
      return sendJson(res, 503, { error: 'Porter is not configured' });
    }

    const response = await fetch(`${baseUrl}/v1/get_quote`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        pickup_details: body.pickup,
        drop_details: body.drop
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return sendJson(res, 502, { error: 'Porter quote failed' });
    }

    return sendJson(res, 200, {
      quoteId: payload.quote_id || payload.quoteId || null,
      fareInr: payload.fare ?? payload.estimated_fare ?? null,
      eta: payload.eta || null,
      status: 'quoted'
    });
  } catch (error) {
    return sendJson(res, error.status || 500, { error: error.message || 'Could not quote delivery' });
  }
}
