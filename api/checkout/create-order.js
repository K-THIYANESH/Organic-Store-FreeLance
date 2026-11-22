import { sendJson, methodNotAllowed, readJson } from '../../server/http.js';
import { priceOrder } from '../../server/catalog.js';
import { validateCreateOrder } from '../../server/validate.js';

/**
 * POST /api/checkout/create-order
 *
 * The client may send product ids, quantities, and a delivery address.
 * This handler loads unit prices from the server catalog and returns the total.
 * Wire Razorpay/Stripe order creation below using server env secrets only.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const body = await readJson(req);
    const errors = validateCreateOrder(body);
    if (errors.length) return sendJson(res, 400, { error: 'Invalid order', details: errors });

    const priced = priceOrder(body.items);
    if (!priced.ok) return sendJson(res, 422, { error: priced.error, unknownIds: priced.unknownIds });

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return sendJson(res, 503, {
        error: 'Payment gateway is not configured',
        order: {
          currency: priced.currency,
          subtotal: priced.subtotal,
          deliveryFee: priced.deliveryFee,
          total: priced.total,
          amountPaise: priced.amountPaise,
          lineItems: priced.lineItems
        }
      });
    }

    // Gateway call uses priced.amountPaise — never body.amount.
    // const gatewayOrder = await createRazorpayOrder({
    //   amount: priced.amountPaise,
    //   currency: 'INR',
    //   receipt: body.idempotencyKey
    // }, { keyId, keySecret });

    return sendJson(res, 501, {
      error: 'Gateway order creation is not connected yet',
      order: {
        currency: priced.currency,
        subtotal: priced.subtotal,
        deliveryFee: priced.deliveryFee,
        total: priced.total,
        amountPaise: priced.amountPaise,
        lineItems: priced.lineItems
      }
    });
  } catch (error) {
    return sendJson(res, error.status || 500, { error: error.message || 'Could not create order' });
  }
}
