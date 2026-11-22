/**
 * Scaffold for product, inventory, and dispatch tools.
 * Loaded only after AdminRouteGuard allows the session.
 * @param {HTMLElement} root
 * @param {import('../shared/types/domain.js').User} user
 */
export function mountAdminDashboard(root, user) {
  root.innerHTML = `
    <header>
      <a class="brand" href="/"><span class="brand-mark">g<span>o</span></span><span class="brand-name">goorganic<small>ADMIN</small></span></a>
      <a href="/home#home">Storefront</a>
    </header>
    <h1>Admin</h1>
    <section class="extension-card">
      <p id="adminGreeting"></p>
      <ul>
        <li>Products — catalogue CRUD hooks in here. Do not edit storefront markup for inventory.</li>
        <li>Inventory — stock changes belong on the server catalog used by checkout.</li>
        <li>Dispatch — read Order records, then call the Porter create-order endpoint.</li>
      </ul>
      <p class="extension-note">No catalogue mutations are wired yet. Orders stay in the shopper's browser until the API is connected.</p>
    </section>
  `;
  const greeting = root.querySelector('#adminGreeting');
  greeting.textContent = `Signed in as ${user.name || user.email}.`;
}
