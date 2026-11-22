import { apiRequest } from '../shared/lib/api-client.js';

/**
 * Payment gateway boundary. The browser sends product ids and quantities only.
 * Razorpay/Stripe secret keys stay in server environment variables.
 *
 * @param {{
 *   items: import('../shared/types/domain.js').CartItem[],
 *   deliveryAddress?: import('../shared/types/domain.js').DeliveryAddress,
 *   idempotencyKey?: string
 * }} input
 */
export function createPaymentOrder(input) {
  const items = (input.items || []).map((item) => ({
    productId: item.productId,
    quantity: item.quantity
  }));

  return apiRequest('/api/checkout/create-order', {
    method: 'POST',
    body: {
      items,
      deliveryAddress: input.deliveryAddress,
      idempotencyKey: input.idempotencyKey || (crypto.randomUUID ? crypto.randomUUID() : `idemp_${Date.now()}`)
    }
  });
}
