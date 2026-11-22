import { requestPorterQuote } from './porter-service.js';
import { sanitizeLine } from '../shared/lib/sanitize.js';
import { formatINR } from '../shared/lib/format.js';

/**
 * Placeholder live-status surface. No partner coordinates are invented.
 * @param {HTMLElement} root
 */
export function mountDeliveryTracker(root) {
  root.innerHTML = `
    <header>
      <a class="brand" href="/"><span class="brand-mark">g<span>o</span></span><span class="brand-name">goorganic<small>DELIVERY</small></span></a>
      <a href="/home#track">Order tracking</a>
    </header>
    <h1>Porter delivery</h1>
    <section class="extension-card">
      <p>Quote and dispatch run on the server. This page only collects the drop address and shows the fare the API returns.</p>
      <form id="porterQuoteForm">
        <label>Drop address<br><input name="line1" required maxlength="160" placeholder="Anna Nagar, Chennai"></label><br><br>
        <label>Pincode<br><input name="pincode" required pattern="[0-9]{6}" inputmode="numeric"></label>
        <div class="extension-actions">
          <button class="primary-btn" type="submit">Get quote</button>
        </div>
      </form>
      <p class="extension-note" id="porterStatus">Status: awaiting quote.</p>
    </section>
  `;

  const status = root.querySelector('#porterStatus');
  root.querySelector('#porterQuoteForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    status.textContent = 'Requesting a server-side Porter quote…';
    try {
      const quote = await requestPorterQuote({
        pickup: { line1: 'GoOrganic, Anna Nagar West Extn', pincode: '600101', city: 'Chennai' },
        drop: {
          line1: sanitizeLine(data.get('line1'), 160),
          pincode: String(data.get('pincode') || '').replace(/\D/g, '').slice(0, 6),
          city: 'Chennai'
        }
      });
      const fare = quote.fareInr != null ? formatINR(quote.fareInr) : 'pending';
      status.textContent = `Quote ${quote.quoteId || 'pending'} · fare ${fare} · ${quote.status || 'quoted'}`;
    } catch (error) {
      status.textContent = error.message || 'Porter is not configured.';
    }
  });
}
