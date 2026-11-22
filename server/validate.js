const PRODUCT_ID = /^[a-z0-9-]{1,64}$/;
const PINCODE = /^[1-9][0-9]{5}$/;
const FORBIDDEN_MONEY_FIELDS = ['price', 'unitPrice', 'amount', 'total', 'amountPaise', 'fare', 'fareInr'];

function moneyFieldErrors(source, label) {
  if (!source || typeof source !== 'object') return [];
  return FORBIDDEN_MONEY_FIELDS
    .filter((field) => Object.prototype.hasOwnProperty.call(source, field))
    .map((field) => `${label}.${field} is not accepted; money is calculated on the server`);
}

/**
 * @param {unknown} body
 * @returns {string[]}
 */
export function validateCreateOrder(body) {
  const errors = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return ['Body must be a JSON object'];
  }
  errors.push(...moneyFieldErrors(body, 'body'));

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 40) {
    errors.push('items must be a list of 1 to 40 products');
    return errors;
  }

  body.items.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`items[${index}] must be an object`);
      return;
    }
    errors.push(...moneyFieldErrors(item, `items[${index}]`));
    if (typeof item.productId !== 'string' || !PRODUCT_ID.test(item.productId)) {
      errors.push(`items[${index}].productId is invalid`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      errors.push(`items[${index}].quantity must be an integer from 1 to 20`);
    }
  });

  if (body.idempotencyKey != null && (typeof body.idempotencyKey !== 'string' || body.idempotencyKey.length > 80)) {
    errors.push('idempotencyKey must be a string of at most 80 characters');
  }

  if (body.deliveryAddress != null) {
    errors.push(...validateAddress(body.deliveryAddress, 'deliveryAddress'));
  }

  return errors;
}

/**
 * @param {unknown} address
 * @param {string} label
 */
export function validateAddress(address, label) {
  const errors = [];
  if (!address || typeof address !== 'object') {
    return [`${label} must be an object`];
  }
  for (const field of ['name', 'line1', 'city']) {
    if (address[field] != null && (typeof address[field] !== 'string' || address[field].length > 160)) {
      errors.push(`${label}.${field} must be a string of at most 160 characters`);
    }
  }
  if (address.line1 != null && typeof address.line1 === 'string' && address.line1.trim().length < 3) {
    errors.push(`${label}.line1 is too short`);
  }
  if (address.pincode != null && (typeof address.pincode !== 'string' || !PINCODE.test(address.pincode))) {
    errors.push(`${label}.pincode must be a 6-digit Indian pincode`);
  }
  if (address.phone != null && (typeof address.phone !== 'string' || address.phone.length > 16)) {
    errors.push(`${label}.phone is invalid`);
  }
  return errors;
}

/**
 * @param {unknown} body
 * @returns {string[]}
 */
export function validatePorterQuote(body) {
  if (!body || typeof body !== 'object') return ['Body must be a JSON object'];
  const errors = [
    ...moneyFieldErrors(body, 'body'),
    ...validateAddress(body.pickup, 'pickup'),
    ...validateAddress(body.drop, 'drop')
  ];
  if (!body.pickup || typeof body.pickup.line1 !== 'string') errors.push('pickup.line1 is required');
  if (!body.drop || typeof body.drop.line1 !== 'string') errors.push('drop.line1 is required');
  if (!body.drop || typeof body.drop.pincode !== 'string') errors.push('drop.pincode is required');
  return errors;
}

/**
 * @param {unknown} body
 * @returns {string[]}
 */
export function validatePorterOrder(body) {
  if (!body || typeof body !== 'object') return ['Body must be a JSON object'];
  const errors = moneyFieldErrors(body, 'body');
  if (typeof body.quoteId !== 'string' || body.quoteId.length < 4 || body.quoteId.length > 80) {
    errors.push('quoteId is required');
  }
  if (typeof body.orderId !== 'string' || body.orderId.length < 4 || body.orderId.length > 80) {
    errors.push('orderId is required');
  }
  return errors;
}
