import { readCartItems, cartCount } from '../cart/cart-store.js';
import { createPaymentOrder } from './payment-service.js';
import { formatINR } from '../shared/lib/format.js';
import { sanitizeLine, sanitizePhone } from '../shared/lib/sanitize.js';

/**
 * Placeholder checkout surface for the payments teammate.
 * The live storefront still checks out from the cart modal on home.html.
 * @param {HTMLElement} root
 */
export function mountCheckoutPage(root) {
  const items = readCartItems();
  root.innerHTML = `
    <header>
      <a class="brand" href="/"><span class="brand-mark">g<span>o</span></span><span class="brand-name">goorganic<small>CHECKOUT</small></span></a>
      <a href="/home#cart">Back to cart</a>
    </header>
    <h1>Checkout</h1>
    <section class="extension-card">
      <p>${items.length ? `${cartCount()} item(s) ready. Prices are calculated on the server when you place the order.` : 'Your cart is empty. Add products from the storefront, then return here.'}</p>
      <ul id="checkoutLines"></ul>
      <form id="checkoutPlaceholder">
        <label>Name<br><input name="name" required maxlength="80" autocomplete="name"></label><br><br>
        <label>Phone<br><input name="phone" required inputmode="tel" autocomplete="tel"></label><br><br>
        <label>Address<br><input name="line1" required maxlength="160" autocomplete="street-address"></label><br><br>
        <label>City<br><input name="city" required maxlength="60" value="Chennai"></label><br><br>
        <label>Pincode<br><input name="pincode" required pattern="[0-9]{6}" inputmode="numeric"></label>
        <div class="extension-actions">
          <button class="primary-btn" type="submit">Request server total</button>
        </div>
      </form>
      <p class="extension-note" id="checkoutResult"></p>
    </section>
  `;

  const list = root.querySelector('#checkoutLines');
  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = `${item.productId} × ${item.quantity}`;
    list.appendChild(li);
  }

  const form = root.querySelector('#checkoutPlaceholder');
  const result = root.querySelector('#checkoutResult');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!items.length) {
      result.textContent = 'Add something to the cart before checkout.';
      return;
    }
    const data = new FormData(form);
    result.textContent = 'Asking the server to price this order…';
    try {
      const response = await createPaymentOrder({
        items,
        deliveryAddress: {
          name: sanitizeLine(data.get('name'), 80),
          phone: sanitizePhone(data.get('phone')),
          line1: sanitizeLine(data.get('line1'), 160),
          city: sanitizeLine(data.get('city'), 60),
          pincode: String(data.get('pincode') || '').replace(/\D/g, '').slice(0, 6)
        }
      });
      const total = response.order && response.order.total;
      result.textContent = total != null
        ? `Server total ${formatINR(total)}. Gateway capture is not enabled yet.`
        : 'The server accepted the request shape. Finish Razorpay order creation in api/checkout/create-order.js.';
    } catch (error) {
      const priced = error.details && error.details.order;
      if (priced && priced.total != null) {
        result.textContent = `Server priced this cart at ${formatINR(priced.total)} (${priced.amountPaise} paise). ${error.message}`;
        return;
      }
      result.textContent = error.message || 'Checkout is not available.';
    }
  });
}
