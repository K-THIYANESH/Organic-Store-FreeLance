/** Format a rupee amount for display. Pricing authority stays on the server. */
export function formatINR(amount) {
  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;
  return '₹' + safe.toLocaleString('en-IN');
}

/** Format an ISO date or Date for the Indian storefront. */
export function formatDateIN(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}
