import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 3000;

const rewrites = new Map([
  ['/', '/index.html'],
  ['/login', '/index.html'],
  ['/signup', '/index.html'],
  ['/home', '/home.html'],
  ['/checkout', '/checkout.html'],
  ['/admin', '/admin.html'],
  ['/delivery', '/delivery.html']
]);

const apiRoutes = new Map([
  ['/api/checkout/create-order', '../api/checkout/create-order.js'],
  ['/api/checkout/verify-webhook', '../api/checkout/verify-webhook.js'],
  ['/api/porter/get-quote', '../api/porter/get-quote.js'],
  ['/api/porter/create-order', '../api/porter/create-order.js']
]);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function applyHeaders(res, filePath) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
  if (filePath && filePath.includes(`${path.sep}assets${path.sep}`)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}

function safeFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const relative = (rewrites.get(decoded) || decoded).replace(/^\/+/, '');
  const filePath = path.resolve(root, relative);
  const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (filePath !== root && !filePath.startsWith(rootPrefix)) return null;
  if (path.basename(filePath).startsWith('.env')) return null;
  return filePath;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://127.0.0.1:${port}`);
  applyHeaders(res, url.pathname.includes('/assets/') ? path.join(root, 'assets', 'x') : '');

  if (apiRoutes.has(url.pathname)) {
    const mod = await import(apiRoutes.get(url.pathname));
    return mod.default(req, res);
  }

  const filePath = safeFile(url.pathname);
  if (!filePath) {
    res.statusCode = 400;
    res.end('Bad path');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    res.setHeader('Content-Type', types[path.extname(filePath)] || 'application/octet-stream');
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`GoOrganic dev server http://127.0.0.1:${port}`);
});
