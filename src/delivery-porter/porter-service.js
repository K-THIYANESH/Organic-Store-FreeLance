import { apiRequest } from '../shared/lib/api-client.js';

/**
 * Porter boundary. The API key is read only inside /api/porter/*.
 * @param {{ pickup: object, drop: object }} input
 */
export function requestPorterQuote(input) {
  return apiRequest('/api/porter/get-quote', {
    method: 'POST',
    body: {
      pickup: input.pickup,
      drop: input.drop
    }
  });
}

/**
 * @param {{ quoteId: string, orderId: string }} input
 */
export function createPorterDelivery(input) {
  return apiRequest('/api/porter/create-order', {
    method: 'POST',
    body: {
      quoteId: input.quoteId,
      orderId: input.orderId
    }
  });
}
