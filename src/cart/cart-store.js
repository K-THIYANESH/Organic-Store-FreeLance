/**
 * Shared cart persistence. Intro (`src/intro/app.js`) and the storefront
 * (`ShopApp` in `src/storefront/shop-data.js`) already read and write this
 * same localStorage key. Extension modules should use this store so they
 * see the shopper's cart without copying price fields.
 */

const CART_KEY = 'goorganic-cart';

/** @returns {Record<string, number>} */
export function readCartMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    /** @type {Record<string, number>} */
    const cart = {};
    for (const [productId, qty] of Object.entries(parsed)) {
      const quantity = Math.floor(Number(qty));
      if (productId && Number.isFinite(quantity) && quantity > 0) cart[productId] = quantity;
    }
    return cart;
  } catch {
    return {};
  }
}

/** @returns {import('../shared/types/domain.js').CartItem[]} */
export function readCartItems() {
  return Object.entries(readCartMap()).map(([productId, quantity]) => ({ productId, quantity }));
}

/** @param {Record<string, number>} cart */
export function writeCartMap(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function clearCart() {
  writeCartMap({});
}

export function cartCount() {
  return Object.values(readCartMap()).reduce((sum, qty) => sum + qty, 0);
}
