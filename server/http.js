/** JSON responses for Vercel Node functions. No-store so order payloads are never cached. */
export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  sendJson(res, 405, { error: 'Method not allowed' });
}

/** Prefer an already-parsed body. Otherwise read the request stream once. */
export function readJson(req) {
  if (typeof req.body === 'string') {
    try {
      return Promise.resolve(req.body ? JSON.parse(req.body) : {});
    } catch {
      const error = new Error('Invalid JSON');
      error.status = 400;
      return Promise.reject(error);
    }
  }
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return Promise.resolve(req.body);
  }
  return readRawBody(req).then((raw) => {
    if (!raw.length) return {};
    try {
      return JSON.parse(raw.toString('utf8'));
    } catch {
      const error = new Error('Invalid JSON');
      error.status = 400;
      throw error;
    }
  });
}

export function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
