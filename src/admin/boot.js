const root = document.getElementById('app');
const { guardAdminRoute } = await import('./admin-route-guard.js');
const decision = guardAdminRoute();

if (!decision.allowed) {
  const card = document.createElement('section');
  card.className = 'extension-card';
  const title = document.createElement('h1');
  title.textContent = 'Admin';
  const message = document.createElement('p');
  message.textContent = decision.reason;
  const link = document.createElement('a');
  link.href = '/login';
  link.textContent = 'Go to login';
  card.append(title, message, link);
  root.replaceChildren(card);
} else {
  const { mountAdminDashboard } = await import('./admin-dashboard.js');
  mountAdminDashboard(root, decision.user);
}
