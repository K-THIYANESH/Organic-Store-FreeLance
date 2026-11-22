const root = document.getElementById('app');
const { mountCheckoutPage } = await import('./checkout-page.js');
mountCheckoutPage(root);
