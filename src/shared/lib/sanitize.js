/** Escape text before it is inserted with innerHTML. */
export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Keep phone input to a short dialable string. */
export function sanitizePhone(value) {
  return String(value || '').replace(/[^\d+\s-]/g, '').slice(0, 16);
}

/** Single-line text with control characters removed. */
export function sanitizeLine(value, maxLength = 240) {
  return String(value || '').replace(/[\u0000-\u001F]/g, '').trim().slice(0, maxLength);
}
