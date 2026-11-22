/**
 * Domain contracts shared by Storefront, Cart, Checkout, Porter, and Admin.
 * Runtime modules stay in vanilla JS; these typedefs are the handoff.
 */

/**
 * @typedef {Object} User
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {'customer' | 'admin'} [role]
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} [category]
 * @property {number} price
 * @property {string} [unit]
 * @property {string} [img]
 * @property {string} [desc]
 */

/**
 * Cart rows never carry a trusted price. Checkout asks the server to price `productId` + `quantity`.
 * @typedef {Object} CartItem
 * @property {string} productId
 * @property {number} quantity
 * @property {string} [name]
 * @property {string} [unit]
 */

/**
 * @typedef {Object} DeliveryAddress
 * @property {string} name
 * @property {string} phone
 * @property {string} line1
 * @property {string} [line2]
 * @property {string} city
 * @property {string} [state]
 * @property {string} pincode
 */

/**
 * @typedef {Object} PorterDeliveryInfo
 * @property {string} [quoteId]
 * @property {string} [orderId]
 * @property {string} [trackingId]
 * @property {'awaiting_quote' | 'quoted' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'} status
 * @property {number} [fareInr]
 * @property {string} [eta]
 */

/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} createdAt
 * @property {CartItem[]} items
 * @property {number} subtotal
 * @property {number} deliveryFee
 * @property {number} total
 * @property {'INR'} currency
 * @property {number} [amountPaise]
 * @property {DeliveryAddress} [deliveryAddress]
 * @property {PorterDeliveryInfo} [porter]
 * @property {'pending' | 'paid' | 'failed' | 'cod'} paymentStatus
 * @property {string} [customerEmail]
 */

export {};
