const root = document.getElementById('app');
const { mountDeliveryTracker } = await import('./delivery-tracker.js');
mountDeliveryTracker(root);
