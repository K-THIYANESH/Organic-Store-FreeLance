import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { priceOrder } from '../server/catalog.js';
import { validateCreateOrder } from '../server/validate.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const jsFiles = walk(root).filter((file) => file.endsWith('.js'));
let failed = false;

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    console.error(result.stderr || result.stdout);
    console.error(`Syntax error: ${path.relative(root, file)}`);
  }
}

const clientRoots = ['src', 'index.html', 'home.html', 'checkout.html', 'admin.html', 'delivery.html'];
const secretPatterns = [
  { name: 'secret assignment', re: /(?:RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|PORTER_API_KEY|DATABASE_URL|JWT_ACCESS_SECRET)\s*[:=]\s*['"][^'"]+['"]/ },
  { name: 'live secret key', re: /(?:sk_live_|rk_live_)[A-Za-z0-9]+/ },
  { name: 'razorpay key literal', re: /rzp_(?:live|test)_[A-Za-z0-9]{8,}/ },
  { name: 'public env secret', re: /(?:VITE_|NEXT_PUBLIC_).*(?:SECRET|PASSWORD|WEBHOOK|PORTER_API|DATABASE_URL|JWT_)/ }
];

for (const relative of clientRoots) {
  const target = path.join(root, relative);
  if (!fs.existsSync(target)) continue;
  const files = fs.statSync(target).isDirectory()
    ? walk(target).filter((file) => /\.(js|html|css)$/.test(file))
    : [target];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (file.includes(`${path.sep}src${path.sep}`) && /process\.env/.test(text)) {
      failed = true;
      console.error(`Client file reads process.env: ${path.relative(root, file)}`);
    }
    for (const pattern of secretPatterns) {
      if (pattern.re.test(text)) {
        failed = true;
        console.error(`${pattern.name} in ${path.relative(root, file)}`);
      }
    }
  }
}

const rejected = validateCreateOrder({
  items: [{ productId: 'wildflower-honey-500g', quantity: 1, price: 1 }]
});
if (!rejected.some((message) => message.includes('price'))) {
  failed = true;
  console.error('Checkout validation accepted a client price.');
}

const accepted = validateCreateOrder({
  items: [{ productId: 'wildflower-honey-500g', quantity: 1 }]
});
const priced = priceOrder([{ productId: 'wildflower-honey-500g', quantity: 1 }]);
if (accepted.length || !priced.ok || priced.total !== 435 || priced.amountPaise !== 43500) {
  failed = true;
  console.error('Server pricing did not apply the catalogue price and delivery fee.', accepted, priced);
}

if (failed) process.exit(1);
console.log(`Checked ${jsFiles.length} JavaScript files. No client secrets. Server pricing holds.`);
