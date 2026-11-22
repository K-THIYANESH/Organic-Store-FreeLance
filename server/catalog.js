/**
 * Server price book. Checkout must use this map (or the database that replaces it).
 * Amounts are INR rupees, matching the storefront catalogue. Never read prices from the client.
 */
export const SERVER_PRICES_INR = {
  'wildflower-honey-500g': 385,
  'karupatti-palm-jaggery-500g': 220,
  'traditional-millet-mix-500g': 180,
  'bamboo-rice-500g': 340,
  'heritage-spice-blend-100g': 145,
  'turmeric-powder-100g': 120,
  'cold-pressed-sesame-oil-500ml': 320,
  'coconut-oil-cold-pressed-500ml': 290,
  'peanut-oil-wood-pressed-500ml': 275,
  'native-green-gram-500g': 125,
  'urad-dal-black-500g': 155,
  'herbal-bath-soap-100g': 95,
  'neem-handmade-soap-100g': 85,
  'traditional-rice-papad-200g': 110,
  'sundakkai-vathal-100g': 130,
  'handcrafted-clay-cup': 240,
  'terracotta-water-pot': 580,
  'black-sesame-seeds-250g': 160,
  'rock-salt-1kg': 85,
  'nannari-sherbet-500ml': 195,
  'moringa-leaf-powder-100g': 185,
  'rose-water-mist-100ml': 140,
  'palm-sugar-powder-500g': 165
};

/** Storefront rule, enforced here: free delivery from ₹500, otherwise ₹50. */
export function deliveryFeeInr(subtotal) {
  if (subtotal <= 0) return 0;
  return subtotal >= 500 ? 0 : 50;
}

/**
 * @param {{ productId: string, quantity: number }[]} items
 */
export function priceOrder(items) {
  const unknownIds = [];
  const lineItems = [];
  let subtotal = 0;

  for (const item of items) {
    const unitPrice = SERVER_PRICES_INR[item.productId];
    if (unitPrice == null) {
      unknownIds.push(item.productId);
      continue;
    }
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;
    lineItems.push({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      lineTotal
    });
  }

  if (unknownIds.length) {
    return { ok: false, error: 'Unknown product', unknownIds };
  }

  const deliveryFee = deliveryFeeInr(subtotal);
  const total = subtotal + deliveryFee;
  return {
    ok: true,
    currency: 'INR',
    subtotal,
    deliveryFee,
    total,
    amountPaise: Math.round(total * 100),
    lineItems
  };
}
