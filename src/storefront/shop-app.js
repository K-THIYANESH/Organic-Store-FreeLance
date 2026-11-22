/**
 * shop-app.js
 * GoOrganic — Post-login shopping SPA (vanilla JS)
 * Depends on: shop-data.js (GOORGANIC_CATEGORIES, GOORGANIC_PRODUCTS, DEMO_ORDERS, ShopApp)
 *
 * Binds to existing home.html markup (camelCase IDs). Does NOT replace
 * #appHeader or #floatingNav innerHTML.
 */
'use strict';

/* ============================================================
   0. GUARDS & SHORTCUTS
   ============================================================ */

if (typeof ShopApp === 'undefined') {
  console.error('[GoOrganic] shop-data.js must load before shop-app.js');
}

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

const FREE_DELIVERY_MIN = 500;
const DELIVERY_FEE = 50;
const VIEWS = ['home', 'shop', 'wishlist', 'cart', 'history', 'help', 'track', 'profile'];
const STORAGE = {
  orders: 'goorganic-orders',
  shopView: 'goo-shop-view',
  browsed: 'goo-browsed',
  addresses: 'goo-addresses',
  notif: 'goo-notif-prefs'
};

/** Local UI flags (ShopApp remains source of truth for cart/wishlist/filters/user). */
const UI = {
  shopViewMode: sessionStorage.getItem(STORAGE.shopView) || 'grid',
  profileSection: 'personal',
  filtersBuilt: false,
  helpBuilt: false,
  hero: { index: 0, timer: null, paused: false, touchX: null },
  eventsBound: false
};

/* ============================================================
   1. HELPERS
   ============================================================ */

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function money(n) {
  return typeof ShopApp !== 'undefined' && ShopApp.money
    ? ShopApp.money(n)
    : '₹' + Number(n).toLocaleString('en-IN');
}

function deliveryCharge(subtotal) {
  return subtotal >= FREE_DELIVERY_MIN ? 0 : DELIVERY_FEE;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getInitials(name) {
  const parts = String(name || 'G').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'G';
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function findProduct(id) {
  return ShopApp._findProduct(id) || GOORGANIC_PRODUCTS.find(p => p.id === id);
}

function productPriceBounds() {
  const prices = GOORGANIC_PRODUCTS.map(p => p.price);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

function hasDiscount(p) {
  return !!(p.originalPrice && p.originalPrice > p.price);
}

function discountPct(p) {
  if (!hasDiscount(p)) return 0;
  return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
}

function resolveCategoryId(value) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  const byId = GOORGANIC_CATEGORIES.find(c => c.id === v || c.id === value);
  if (byId) return byId.id;
  const byName = GOORGANIC_CATEGORIES.find(c => c.name.toLowerCase() === v);
  return byName ? byName.id : null;
}

function trackBrowse(productId) {
  let list = [];
  try { list = JSON.parse(sessionStorage.getItem(STORAGE.browsed) || '[]'); } catch (e) { list = []; }
  list = [productId, ...list.filter(id => id !== productId)].slice(0, 12);
  sessionStorage.setItem(STORAGE.browsed, JSON.stringify(list));
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignore */ }
}

function genOrderId() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return 'GO-' + y + m + day + '-' + String(d.getTime()).slice(-5);
}

function getCustomerOrders() {
  const local = readJSON(STORAGE.orders, []);
  const demo = typeof DEMO_ORDERS !== 'undefined' ? DEMO_ORDERS : [];
  const map = new Map();
  demo.forEach(o => map.set(o.id, o));
  local.forEach(o => map.set(o.id, o));
  return Array.from(map.values()).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

function saveUserOrder(order) {
  const local = readJSON(STORAGE.orders, []);
  local.unshift(order);
  writeJSON(STORAGE.orders, local);
}

function statusClass(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('deliver')) return 'delivered';
  if (s.includes('out for') || s.includes('ship')) return 'shipped';
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('pending')) return 'processing';
  return 'processing';
}

function openOverlay(el) {
  if (!el) return;
  el.hidden = false;
  el.removeAttribute('hidden');
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeOverlay(el) {
  if (!el) return;
  el.hidden = true;
  el.setAttribute('hidden', '');
  el.classList.remove('open');
  if (![
    'productModalOverlay',
    'checkoutModalOverlay',
    'orderConfirmOverlay',
    'filterDrawerOverlay'
  ].some(id => {
    const node = document.getElementById(id);
    return node && !node.hidden;
  })) {
    document.body.style.overflow = '';
  }
}

/* ============================================================
   2. TOAST
   Prefer #appToast (home.html). Fall back to ShopApp.toast / ToastSystem.
   CSS bridge note: .app-toast.show.toast-success|error|info
   ============================================================ */

function showToast(msg, type) {
  type = type || 'success';
  const el = document.getElementById('appToast');
  if (el) {
    el.className = 'app-toast show toast-' + type;
    el.textContent = msg;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => {
      el.classList.remove('show');
    }, 3000);
    return;
  }
  if (typeof ShopApp !== 'undefined' && ShopApp.toast) {
    ShopApp.toast(msg, type);
  }
}

/* ============================================================
   3. AUTH GUARD
   ============================================================ */

function authGuard() {
  const raw = localStorage.getItem('goorganic-user');
  if (!raw) {
    window.location.href = 'index.html#login';
    return false;
  }
  try {
    JSON.parse(raw);
  } catch (e) {
    window.location.href = 'index.html#login';
    return false;
  }
  return true;
}

function setAvatarInitials() {
  const user = ShopApp.currentUser || {};
  const initials = getInitials(user.name || user.fullName || 'G');
  const small = document.getElementById('avatarInitials');
  const large = document.getElementById('profileAvatarLarge');
  if (small) small.textContent = initials;
  if (large) large.textContent = initials;
  const nameEl = document.getElementById('profileDisplayName');
  const fullName = user.name || user.fullName || 'Member';
  if (nameEl) {
    nameEl.textContent = fullName;
    nameEl.setAttribute('title', fullName);
  }
}

/* ============================================================
   4. NAVIGATION & HASH ROUTING
   ============================================================ */

function parseHash() {
  const raw = (location.hash || '#home').replace(/^#/, '');
  const [pathPart, queryPart] = raw.split('?');
  const view = (pathPart || 'home').toLowerCase();
  const params = {};
  if (queryPart) {
    queryPart.split('&').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
  }
  // Also support #shop?cat=oils already handled; support leftover search params after hash
  return { view: VIEWS.includes(view) ? view : 'home', params };
}

function navigate(viewName, opts) {
  opts = opts || {};
  const view = VIEWS.includes(viewName) ? viewName : 'home';

  $$('.view').forEach(el => el.classList.remove('active'));
  const target = document.getElementById('view-' + view);
  if (target) target.classList.add('active');

  $$('.fnav-item[data-view]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-view') === view);
  });

  ShopApp.activeView = view;

  if (!opts.skipHash) {
    let hash = '#' + view;
    if (opts.cat) hash += '?cat=' + encodeURIComponent(opts.cat);
    if (location.hash !== hash) {
      history.replaceState(null, '', hash);
    } else if (opts.forceHash) {
      location.hash = hash;
    }
  }

  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  closeCatDropdown();

  switch (view) {
    case 'home': renderHome(); break;
    case 'shop': renderShop(); break;
    case 'wishlist': renderWishlist(); break;
    case 'cart': renderCart(); break;
    case 'history': renderHistory(); break;
    case 'help': renderHelp(); break;
    case 'track': renderTrack(); break;
    case 'profile': renderProfile(); break;
  }
}

function applyNavDataset(el) {
  if (!el) return;
  const view = el.getAttribute('data-nav') || el.getAttribute('data-view');
  if (!view || !VIEWS.includes(view)) return;

  const filter = el.getAttribute('data-filter');
  const category = el.getAttribute('data-category');

  // Reset shop filters when navigating with intent
  if (view === 'shop') {
    resetShopFiltersSoft();
    if (filter === 'discounted') ShopApp.filters.discounted = true;
    if (filter === 'new') ShopApp.filters.isNew = true;
    if (filter === 'traditional') ShopApp.filters.traditional = true;
    if (category) {
      const id = resolveCategoryId(category);
      if (id) ShopApp.filters.categories = [id];
    }
  }

  navigate(view, category ? { cat: resolveCategoryId(category) || category } : {});
}

function resetShopFiltersSoft() {
  const bounds = productPriceBounds();
  ShopApp.filters.categories = [];
  ShopApp.filters.priceMin = bounds.min;
  ShopApp.filters.priceMax = bounds.max;
  ShopApp.filters.search = '';
  ShopApp.filters.inStock = false;
  ShopApp.filters.discounted = false;
  ShopApp.filters.isNew = false;
  ShopApp.filters.traditional = false;
  ShopApp.filters.sort = 'default';
  syncFilterControlsFromState();
}

function routeFromHash() {
  const { view, params } = parseHash();
  if (view === 'shop') {
    if (params.cat) {
      const id = resolveCategoryId(params.cat);
      if (id) {
        ShopApp.filters.categories = [id];
      }
    }
    if (params.q) ShopApp.filters.search = params.q;
    if (params.filter === 'discounted') ShopApp.filters.discounted = true;
    if (params.filter === 'new') ShopApp.filters.isNew = true;
    if (params.filter === 'traditional') ShopApp.filters.traditional = true;
  }
  navigate(view, { skipHash: true });
}

/* Override ShopApp.navigate so any residual calls go through our SPA router */
ShopApp.navigate = function (viewName) {
  navigate(viewName);
};

/* ============================================================
   5. PRODUCT CARDS
   ============================================================ */

function productTagsHTML(p) {
  const tags = [];
  if (p.tag) tags.push('<span class="pcard-tag">' + esc(p.tag) + '</span>');
  if (p.isNew) tags.push('<span class="pcard-tag pcard-tag--new">NEW</span>');
  if (!p.inStock) tags.push('<span class="pcard-tag pcard-tag--oos">OUT OF STOCK</span>');
  return tags.length
    ? '<div class="product-card-app__tags">' + tags.join('') + '</div>'
    : '';
}

function priceRowHTML(p, priceClass, mrpClass, discClass) {
  const disc = hasDiscount(p);
  return (
    '<div class="product-card-app__price-row">' +
      '<span class="' + priceClass + '">' + money(p.price) + '</span>' +
      (disc ? '<span class="' + mrpClass + '">' + money(p.originalPrice) + '</span>' : '') +
      (disc ? '<span class="' + discClass + '">' + discountPct(p) + '% off</span>' : '') +
    '</div>'
  );
}

function productCardHTML(p) {
  const wished = ShopApp.isInWishlist(p.id);
  const oos = p.inStock === false;
  return (
    '<article class="product-card-app' + (oos ? ' is-oos' : '') + '" data-product-id="' + esc(p.id) + '">' +
      '<div class="product-card-app__img-wrap" data-open-product="' + esc(p.id) + '">' +
        '<img class="product-card-app__img" src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">' +
        productTagsHTML(p) +
        '<button type="button" class="product-card-app__wishlist' + (wished ? ' active' : '') + '" data-wish-id="' + esc(p.id) + '" aria-label="Toggle wishlist" aria-pressed="' + wished + '">♥</button>' +
      '</div>' +
      '<div class="product-card-app__body">' +
        '<h3 class="product-card-app__name" data-open-product="' + esc(p.id) + '">' + esc(p.name) + '</h3>' +
        '<p class="product-card-app__unit">' + esc(p.unit) + ' · ' + esc(p.categoryName) + '</p>' +
        priceRowHTML(p, 'product-card-app__price', 'product-card-app__mrp', 'product-card-app__discount') +
        (oos
          ? '<button type="button" class="product-card-app__add-btn" disabled>Out of Stock</button>'
          : '<button type="button" class="product-card-app__add-btn" data-add-id="' + esc(p.id) + '">Add to Cart</button>') +
      '</div>' +
    '</article>'
  );
}

function productListItemHTML(p) {
  const wished = ShopApp.isInWishlist(p.id);
  const oos = p.inStock === false;
  const disc = hasDiscount(p);
  return (
    '<article class="product-list-item' + (oos ? ' is-oos' : '') + '" data-product-id="' + esc(p.id) + '">' +
      '<img class="product-list-item__img" src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" data-open-product="' + esc(p.id) + '">' +
      '<div class="product-list-item__info">' +
        '<h3 class="product-list-item__name" data-open-product="' + esc(p.id) + '">' + esc(p.name) + '</h3>' +
        '<p class="product-list-item__desc">' + esc((p.desc || '').slice(0, 120)) + ((p.desc || '').length > 120 ? '…' : '') + '</p>' +
        '<div class="product-list-item__tags">' + esc(p.categoryName) + ' · ' + esc(p.unit) +
          (p.tag ? ' · ' + esc(p.tag) : '') +
          (oos ? ' · Out of stock' : '') +
        '</div>' +
      '</div>' +
      '<div class="product-list-item__price-col">' +
        '<span class="product-list-item__price">' + money(p.price) + '</span>' +
        (disc ? '<span class="product-list-item__mrp">' + money(p.originalPrice) + '</span>' : '') +
        (disc ? '<span class="product-list-item__discount">' + discountPct(p) + '% off</span>' : '') +
      '</div>' +
      '<div class="product-list-item__actions">' +
        '<button type="button" class="product-list-item__wish-btn' + (wished ? ' active' : '') + '" data-wish-id="' + esc(p.id) + '" aria-label="Toggle wishlist">♥</button>' +
        (oos
          ? '<button type="button" class="btn-primary" disabled>Out of Stock</button>'
          : '<button type="button" class="btn-primary" data-add-id="' + esc(p.id) + '">Add to Cart</button>') +
      '</div>' +
    '</article>'
  );
}

/* ============================================================
   6. HEADER SEARCH
   ============================================================ */

function bindHeaderSearch() {
  const input = document.getElementById('appSearchInput');
  const clearBtn = document.getElementById('searchClear');
  const box = document.getElementById('searchSuggestions');
  if (!input || !box) return;

  function hideSuggestions() {
    box.hidden = true;
    box.setAttribute('hidden', '');
    box.classList.remove('open');
    box.innerHTML = '';
  }

  function showSuggestions(items) {
    if (!items.length) {
      hideSuggestions();
      return;
    }
    box.innerHTML =
      '<div class="search-suggestions__section-label">Products</div>' +
      items.map(p => (
        '<button type="button" class="search-suggestion-item" data-suggest-id="' + esc(p.id) + '">' +
          '<img class="search-suggestion-item__thumb" src="' + esc(p.img) + '" alt="">' +
          '<span class="search-suggestion-item__name">' + esc(p.name) + '</span>' +
          '<span class="search-suggestion-item__price">' + money(p.price) + '</span>' +
        '</button>'
      )).join('');
    box.hidden = false;
    box.removeAttribute('hidden');
    box.classList.add('open');
  }

  function matchesFor(q) {
    const query = q.trim().toLowerCase();
    if (!query) return [];
    return GOORGANIC_PRODUCTS.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.categoryName.toLowerCase().includes(query) ||
      (p.tag || '').toLowerCase().includes(query)
    ).slice(0, 6);
  }

  input.addEventListener('input', () => {
    const q = input.value;
    if (clearBtn) clearBtn.hidden = !q.trim();
    showSuggestions(matchesFor(q));
  });

  input.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = input.value.trim();
    const matches = matchesFor(q);
    hideSuggestions();
    if (!q) return;

    const exact = GOORGANIC_PRODUCTS.find(p => p.name.toLowerCase() === q.toLowerCase());
    if (exact) {
      input.value = '';
      if (clearBtn) clearBtn.hidden = true;
      openProductModal(exact.id);
      return;
    }
    if (matches.length === 1) {
      input.value = '';
      if (clearBtn) clearBtn.hidden = true;
      openProductModal(matches[0].id);
      return;
    }
    ShopApp.filters.search = q;
    input.value = '';
    if (clearBtn) clearBtn.hidden = true;
    navigate('shop');
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.hidden = true;
      hideSuggestions();
      input.focus();
    });
  }

  box.addEventListener('click', e => {
    const btn = e.target.closest('[data-suggest-id]');
    if (!btn) return;
    hideSuggestions();
    input.value = '';
    if (clearBtn) clearBtn.hidden = true;
    openProductModal(btn.getAttribute('data-suggest-id'));
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#appSearchWrap') && !e.target.closest('#appSearchInput')) {
      hideSuggestions();
    }
  });
}

/* ============================================================
   7. CATEGORIES DROPDOWN (floating nav)
   ============================================================ */

function populateCatDropdown() {
  const grid = document.getElementById('catDropdownGrid');
  if (!grid) return;
  grid.classList.add('cat-dropdown__grid');
  grid.innerHTML = GOORGANIC_CATEGORIES.map(c => (
    '<button type="button" class="cat-card" data-cat-id="' + esc(c.id) + '">' +
      '<img class="cat-card__img" src="' + esc(c.img) + '" alt="">' +
      '<span class="cat-card__name">' + esc(c.name) + '</span>' +
    '</button>'
  )).join('');
}

function openCatDropdown() {
  const drop = document.getElementById('catDropdown');
  const btn = document.getElementById('navCategoriesBtn');
  if (!drop) return;
  drop.hidden = false;
  drop.removeAttribute('hidden');
  drop.classList.add('open');
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

function closeCatDropdown() {
  const drop = document.getElementById('catDropdown');
  const btn = document.getElementById('navCategoriesBtn');
  if (!drop) return;
  drop.hidden = true;
  drop.setAttribute('hidden', '');
  drop.classList.remove('open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}

function toggleCatDropdown() {
  const drop = document.getElementById('catDropdown');
  if (!drop) return;
  if (drop.classList.contains('open') && !drop.hidden) closeCatDropdown();
  else openCatDropdown();
}

function selectCategory(catId) {
  closeCatDropdown();
  ShopApp.filters.categories = [catId];
  ShopApp.filters.search = '';
  syncFilterControlsFromState();
  navigate('shop', { cat: catId });
}

/* ============================================================
   8. HOME — HERO, CATEGORIES, FEATURED, BESTSELLERS
   ============================================================ */

function goHeroSlide(index) {
  const slides = $$('#heroSlidesWrapper .hero-slide-pane');
  const bgs = $$('#heroBgLayers .hero-bg-slide');
  const dots = $$('#heroDots .hero-dot');
  const counter = document.getElementById('heroSlideCounter');
  if (!slides.length) return;
  const n = slides.length;
  UI.hero.index = ((index % n) + n) % n;

  slides.forEach((s, i) => s.classList.toggle('active', i === UI.hero.index));
  bgs.forEach((s, i) => s.classList.toggle('active', i === UI.hero.index));
  dots.forEach((d, i) => d.classList.toggle('active', i === UI.hero.index));
  if (counter) {
    const cur = String(UI.hero.index + 1).padStart(2, '0');
    const total = String(n).padStart(2, '0');
    counter.textContent = cur + ' / ' + total;
  }
}

function stopHeroAuto() {
  if (UI.hero.timer) {
    clearInterval(UI.hero.timer);
    UI.hero.timer = null;
  }
}

function startHeroAuto() {
  stopHeroAuto();
  UI.hero.timer = setInterval(() => goHeroSlide(UI.hero.index + 1), 3000);
}

function bindHeroCarousel() {
  const hero = document.getElementById('homeHero');
  if (!hero || hero.dataset.bound === '1') return;
  hero.dataset.bound = '1';

  const prev = document.getElementById('heroPrevBtn');
  const next = document.getElementById('heroNextBtn');
  const dots = document.getElementById('heroDots');

  function interact(deltaOrIndex, absolute) {
    UI.hero.paused = true;
    stopHeroAuto();
    if (absolute) goHeroSlide(deltaOrIndex);
    else goHeroSlide(UI.hero.index + deltaOrIndex);
    setTimeout(() => {
      UI.hero.paused = false;
      startHeroAuto();
    }, 4000);
  }

  if (prev) prev.addEventListener('click', () => interact(-1, false));
  if (next) next.addEventListener('click', () => interact(1, false));
  if (dots) {
    dots.addEventListener('click', e => {
      const dot = e.target.closest('.hero-dot');
      if (!dot) return;
      const idx = Number(dot.getAttribute('data-index'));
      if (!Number.isNaN(idx)) interact(idx, true);
    });
  }

  // Swipe
  hero.addEventListener('touchstart', e => {
    UI.hero.touchX = e.changedTouches[0].screenX;
  }, { passive: true });
  hero.addEventListener('touchend', e => {
    if (UI.hero.touchX == null) return;
    const dx = e.changedTouches[0].screenX - UI.hero.touchX;
    UI.hero.touchX = null;
    if (Math.abs(dx) < 40) return;
    interact(dx < 0 ? 1 : -1, false);
  }, { passive: true });

  goHeroSlide(0);
  startHeroAuto();

  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
    if (prefersReducedMotion()) stopHeroAuto();
    else startHeroAuto();
  });
}

function scrollTrack(el, dir) {
  if (!el) return;
  const amount = Math.max(220, Math.floor(el.clientWidth * 0.7));
  el.scrollBy({ left: dir * amount, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

function renderHomeCategories() {
  const track = document.getElementById('homeCategoryTrack');
  if (!track) return;
  track.innerHTML = GOORGANIC_CATEGORIES.map(c => (
    '<button type="button" class="home-cat-card" data-cat-id="' + esc(c.id) + '" title="' + esc(c.desc) + '">' +
      '<span class="home-cat-card__img-wrap">' +
        '<img src="' + esc(c.img) + '" alt="' + esc(c.name) + '" loading="lazy">' +
      '</span>' +
      '<span class="home-cat-card__name">' + esc(c.name) + '</span>' +
      '<span class="home-cat-card__desc">' + esc(c.desc) + '</span>' +
    '</button>'
  )).join('');
}

function renderHomeFeatured() {
  const grid = document.getElementById('homeFeaturedGrid');
  if (!grid) return;
  const featured = GOORGANIC_PRODUCTS.filter(p => p.isFeatured);
  grid.innerHTML = featured.map(productCardHTML).join('') ||
    '<p class="empty-note">No featured products right now.</p>';
}

function renderHomeBestsellers() {
  const track = document.getElementById('bestsellerTrack');
  if (!track) return;
  track.classList.add('bestsellers-track');
  const list = GOORGANIC_PRODUCTS.filter(p => p.isBestseller);
  track.innerHTML = list.map(productCardHTML).join('') ||
    '<p class="empty-note">Curated bestsellers coming soon.</p>';
}

function renderHome() {
  renderHomeCategories();
  renderHomeFeatured();
  renderHomeBestsellers();
  bindHeroCarousel();
  ShopApp._updateWishlistUI();
}

/* ============================================================
   9. SHOP — FILTERS, SORT, GRID/LIST
   ============================================================ */

function syncFilterControlsFromState() {
  const f = ShopApp.filters;
  const bounds = productPriceBounds();

  $$('#filterCategoryList input[type="checkbox"][data-cat-id]').forEach(cb => {
    cb.checked = f.categories.includes(cb.getAttribute('data-cat-id'));
  });
  $$('#filterDrawerBody input[type="checkbox"][data-cat-id]').forEach(cb => {
    cb.checked = f.categories.includes(cb.getAttribute('data-cat-id'));
  });

  const minS = document.getElementById('priceMinSlider');
  const maxS = document.getElementById('priceMaxSlider');
  if (minS) {
    minS.min = bounds.min;
    minS.max = bounds.max;
    minS.value = f.priceMin;
  }
  if (maxS) {
    maxS.min = bounds.min;
    maxS.max = bounds.max;
    maxS.value = f.priceMax;
  }
  const minD = document.getElementById('priceMinDisplay');
  const maxD = document.getElementById('priceMaxDisplay');
  if (minD) minD.textContent = money(f.priceMin);
  if (maxD) maxD.textContent = money(f.priceMax);

  const map = {
    filterInStock: 'inStock',
    filterDiscounted: 'discounted',
    filterNew: 'isNew',
    filterTraditional: 'traditional'
  };
  Object.keys(map).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = !!f[map[id]];
  });

  const shopSearch = document.getElementById('shopSearchInput');
  if (shopSearch && shopSearch.value !== f.search) shopSearch.value = f.search || '';

  const sort = document.getElementById('sortSelect');
  if (sort) sort.value = f.sort || 'default';

  syncDrawerFilterMirrors();
}

function buildCategoryFilters() {
  const list = document.getElementById('filterCategoryList');
  if (!list) return;
  list.innerHTML = GOORGANIC_CATEGORIES.map(c => {
    const count = GOORGANIC_PRODUCTS.filter(p => p.categoryId === c.id).length;
    return (
      '<label class="filter-checkbox">' +
        '<input type="checkbox" data-cat-id="' + esc(c.id) + '"> ' +
        esc(c.name) +
        '<span class="filter-checkbox__count">' + count + '</span>' +
      '</label>'
    );
  }).join('');
}

function initPriceSliders() {
  const bounds = productPriceBounds();
  // Snap to tens for slider UX
  const min = Math.floor(bounds.min / 10) * 10;
  const max = Math.ceil(bounds.max / 10) * 10;
  ShopApp.filters.priceMin = min;
  ShopApp.filters.priceMax = max;

  const minS = document.getElementById('priceMinSlider');
  const maxS = document.getElementById('priceMaxSlider');
  [minS, maxS].forEach(sl => {
    if (!sl) return;
    sl.min = min;
    sl.max = max;
    sl.step = 10;
  });
  if (minS) minS.value = min;
  if (maxS) maxS.value = max;
  const minD = document.getElementById('priceMinDisplay');
  const maxD = document.getElementById('priceMaxDisplay');
  if (minD) minD.textContent = money(min);
  if (maxD) maxD.textContent = money(max);
}

function readFiltersFromDOM() {
  // Multi-select: collect ALL checked category checkboxes
  const cats = $$('#filterCategoryList input[data-cat-id]:checked').map(cb => cb.getAttribute('data-cat-id'));
  ShopApp.filters.categories = cats;

  // Keep URL in sync without forcing a single-category hash
  if (ShopApp.activeView === 'shop') {
    const nextHash = cats.length === 1 ? '#shop?cat=' + encodeURIComponent(cats[0]) : '#shop';
    if (location.hash !== nextHash) {
      history.replaceState(null, '', nextHash);
    }
  }

  const minS = document.getElementById('priceMinSlider');
  const maxS = document.getElementById('priceMaxSlider');
  let pMin = minS ? Number(minS.value) : ShopApp.filters.priceMin;
  let pMax = maxS ? Number(maxS.value) : ShopApp.filters.priceMax;
  if (pMin > pMax) {
    const t = pMin; pMin = pMax; pMax = t;
    if (minS) minS.value = pMin;
    if (maxS) maxS.value = pMax;
  }
  ShopApp.filters.priceMin = pMin;
  ShopApp.filters.priceMax = pMax;

  const minD = document.getElementById('priceMinDisplay');
  const maxD = document.getElementById('priceMaxDisplay');
  if (minD) minD.textContent = money(pMin);
  if (maxD) maxD.textContent = money(pMax);

  ShopApp.filters.inStock = !!(document.getElementById('filterInStock') || {}).checked;
  ShopApp.filters.discounted = !!(document.getElementById('filterDiscounted') || {}).checked;
  ShopApp.filters.isNew = !!(document.getElementById('filterNew') || {}).checked;
  ShopApp.filters.traditional = !!(document.getElementById('filterTraditional') || {}).checked;

  const shopSearch = document.getElementById('shopSearchInput');
  if (shopSearch) ShopApp.filters.search = shopSearch.value.trim();

  const sort = document.getElementById('sortSelect');
  if (sort) ShopApp.filters.sort = sort.value || 'default';
}

function renderActiveFilterChips() {
  const wrap = document.getElementById('activeFilters');
  if (!wrap) return;
  const chips = [];
  const f = ShopApp.filters;
  const bounds = productPriceBounds();
  const minBound = Math.floor(bounds.min / 10) * 10;
  const maxBound = Math.ceil(bounds.max / 10) * 10;

  f.categories.forEach(id => {
    const cat = GOORGANIC_CATEGORIES.find(c => c.id === id);
    chips.push({ key: 'cat:' + id, label: cat ? cat.name : id });
  });
  if (f.priceMin > minBound || f.priceMax < maxBound) {
    chips.push({ key: 'price', label: money(f.priceMin) + ' – ' + money(f.priceMax) });
  }
  if (f.search) chips.push({ key: 'search', label: '“' + f.search + '”' });
  if (f.inStock) chips.push({ key: 'inStock', label: 'In stock' });
  if (f.discounted) chips.push({ key: 'discounted', label: 'On offer' });
  if (f.isNew) chips.push({ key: 'isNew', label: 'New' });
  if (f.traditional) chips.push({ key: 'traditional', label: 'Traditional' });

  if (!chips.length) {
    wrap.hidden = true;
    wrap.innerHTML = '';
    return;
  }
  wrap.hidden = false;
  wrap.removeAttribute('hidden');
  wrap.innerHTML = chips.map(c => (
    '<button type="button" class="active-filter-chip" data-chip="' + esc(c.key) + '">' +
      esc(c.label) +
      '<span class="active-filter-chip__remove" aria-hidden="true">×</span>' +
    '</button>'
  )).join('');
}

function clearChip(key) {
  const f = ShopApp.filters;
  const bounds = productPriceBounds();
  const minBound = Math.floor(bounds.min / 10) * 10;
  const maxBound = Math.ceil(bounds.max / 10) * 10;

  if (key.startsWith('cat:')) {
    const id = key.slice(4);
    f.categories = f.categories.filter(c => c !== id);
  } else if (key === 'price') {
    f.priceMin = minBound;
    f.priceMax = maxBound;
  } else if (key === 'search') {
    f.search = '';
  } else if (key === 'inStock') f.inStock = false;
  else if (key === 'discounted') f.discounted = false;
  else if (key === 'isNew') f.isNew = false;
  else if (key === 'traditional') f.traditional = false;

  syncFilterControlsFromState();
  renderShopProducts();
}

function clearAllFilters() {
  resetShopFiltersSoft();
  renderShopProducts();
}

function setShopViewMode(mode) {
  UI.shopViewMode = mode === 'list' ? 'list' : 'grid';
  sessionStorage.setItem(STORAGE.shopView, UI.shopViewMode);
  const gridBtn = document.getElementById('viewGrid');
  const listBtn = document.getElementById('viewList');
  if (gridBtn) gridBtn.classList.toggle('active', UI.shopViewMode === 'grid');
  if (listBtn) listBtn.classList.toggle('active', UI.shopViewMode === 'list');
  const container = document.getElementById('productsContainer');
  if (container) {
    container.classList.toggle('is-list', UI.shopViewMode === 'list');
    container.classList.toggle('is-grid', UI.shopViewMode === 'grid');
  }
}

function renderShopProducts() {
  const container = document.getElementById('productsContainer');
  const countEl = document.getElementById('resultCount');
  if (!container) return;

  const results = ShopApp.getFilteredProducts();
  const total = GOORGANIC_PRODUCTS.length;

  if (countEl) {
    countEl.textContent = 'Showing ' + results.length + ' of ' + total + ' products';
  }

  renderActiveFilterChips();
  setShopViewMode(UI.shopViewMode);

  if (!results.length) {
    container.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-icon">🌿</div>' +
        '<p>No products match your filters.</p>' +
        '<button type="button" class="btn-primary" id="emptyClearFilters">Clear filters</button>' +
      '</div>';
    const btn = document.getElementById('emptyClearFilters');
    if (btn) btn.addEventListener('click', clearAllFilters);
    return;
  }

  container.innerHTML = UI.shopViewMode === 'list'
    ? results.map(productListItemHTML).join('')
    : '<div class="products-grid">' + results.map(productCardHTML).join('') + '</div>';

  ShopApp._updateWishlistUI();
}

function syncDrawerFilterMirrors() {
  const body = document.getElementById('filterDrawerBody');
  const sidebar = document.getElementById('shopSidebar');
  if (!body || !sidebar) return;

  // Clone filter blocks into drawer (keep structure in sync)
  const cloneSource = sidebar.querySelector('.filter-category-list')
    ? sidebar
    : null;
  if (!cloneSource) return;

  // Rebuild a compact mirror of filters
  body.innerHTML =
    '<div class="drawer-filters-mirror">' +
      '<div class="filter-group">' +
        '<h4>Categories</h4>' +
        '<div class="filter-category-list" id="drawerCategoryList">' +
          GOORGANIC_CATEGORIES.map(c => (
            '<label class="filter-checkbox">' +
              '<input type="checkbox" data-cat-id="' + esc(c.id) + '"' +
                (ShopApp.filters.categories.includes(c.id) ? ' checked' : '') + '> ' +
              esc(c.name) +
            '</label>'
          )).join('') +
        '</div>' +
      '</div>' +
      '<div class="filter-group">' +
        '<h4>Availability &amp; tags</h4>' +
        '<label class="filter-checkbox"><input type="checkbox" data-drawer-flag="inStock"' + (ShopApp.filters.inStock ? ' checked' : '') + '> In Stock Only</label>' +
        '<label class="filter-checkbox"><input type="checkbox" data-drawer-flag="discounted"' + (ShopApp.filters.discounted ? ' checked' : '') + '> On Offer</label>' +
        '<label class="filter-checkbox"><input type="checkbox" data-drawer-flag="isNew"' + (ShopApp.filters.isNew ? ' checked' : '') + '> New Arrivals</label>' +
        '<label class="filter-checkbox"><input type="checkbox" data-drawer-flag="traditional"' + (ShopApp.filters.traditional ? ' checked' : '') + '> Traditional Picks</label>' +
      '</div>' +
      '<button type="button" class="btn-primary full-width" id="drawerApplyFilters">Apply Filters</button>' +
      '<button type="button" class="btn-outline full-width" id="drawerClearFilters">Clear All</button>' +
    '</div>';
}

function openFilterDrawer() {
  syncDrawerFilterMirrors();
  const drawer = document.getElementById('filterDrawer');
  const overlay = document.getElementById('filterDrawerOverlay');
  if (drawer) {
    drawer.classList.add('open', 'sidebar-drawer');
    drawer.setAttribute('aria-hidden', 'false');
  }
  if (overlay) {
    overlay.hidden = false;
    overlay.removeAttribute('hidden');
    overlay.classList.add('open', 'sidebar-drawer-overlay');
    overlay.style.display = 'block';
  }
  document.body.style.overflow = 'hidden';
}

function closeFilterDrawer() {
  const drawer = document.getElementById('filterDrawer');
  const overlay = document.getElementById('filterDrawerOverlay');
  if (drawer) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  }
  if (overlay) {
    overlay.hidden = true;
    overlay.setAttribute('hidden', '');
    overlay.classList.remove('open');
    overlay.style.display = '';
  }
  document.body.style.overflow = '';
}

function ensureShopFiltersBuilt() {
  if (UI.filtersBuilt) {
    syncFilterControlsFromState();
    return;
  }
  buildCategoryFilters();
  initPriceSliders();
  UI.filtersBuilt = true;
  syncFilterControlsFromState();
}

function renderShop() {
  ensureShopFiltersBuilt();
  syncFilterControlsFromState();
  renderShopProducts();
}

/* ============================================================
   10. PRODUCT MODAL
   ============================================================ */

function openProductModal(productId) {
  const p = findProduct(productId);
  if (!p) return;
  trackBrowse(p.id);

  const body = document.getElementById('productModalBody');
  const overlay = document.getElementById('productModalOverlay');
  if (!body || !overlay) return;

  const wished = ShopApp.isInWishlist(p.id);
  const related = GOORGANIC_PRODUCTS
    .filter(x => x.categoryId === p.categoryId && x.id !== p.id);
  const oos = p.inStock === false;
  const disc = hasDiscount(p);

  body.innerHTML =
    '<div class="modal-inner">' +
      '<div class="modal-gallery">' +
        '<div class="modal-gallery__image-wrap">' +
          '<img class="modal-gallery__main" src="' + esc(p.img) + '" alt="' + esc(p.name) + '">' +
        '</div>' +
        '<div class="modal-note-section">' +
          '<div class="modal-note-header">' +
            '<span class="modal-note-title">📝 Note / Instructions</span>' +
          '</div>' +
          '<textarea class="modal-note-input" id="modalProductNote" placeholder="Add custom notes or special requests for this item (e.g., ripeness, packaging preference)..." rows="3"></textarea>' +
        '</div>' +
      '</div>' +
      '<div class="modal-info">' +
        '<div class="modal-info__tags">' +
          (p.tag ? '<span class="pcard-tag">' + esc(p.tag) + '</span>' : '') +
          (p.isNew ? '<span class="pcard-tag pcard-tag--new">NEW</span>' : '') +
          (p.isTraditional ? '<span class="pcard-tag">TRADITIONAL</span>' : '') +
        '</div>' +
        '<p class="eyebrow">' + esc(p.categoryName) + '</p>' +
        '<h2 class="modal-info__name">' + esc(p.name) + '</h2>' +
        '<p class="modal-info__unit">' + esc(p.unit) + ' · ' + (oos ? 'Out of stock' : 'In stock') + '</p>' +
        '<div class="modal-info__price-row">' +
          '<span class="modal-info__price">' + money(p.price) + '</span>' +
          (disc ? '<span class="modal-info__mrp">' + money(p.originalPrice) + '</span>' : '') +
          (disc ? '<span class="modal-info__discount">' + discountPct(p) + '% off</span>' : '') +
        '</div>' +
        '<p class="modal-info__desc">' + esc(p.desc || '') + '</p>' +
        '<div class="modal-qty-row">' +
          '<div class="qty-selector" data-modal-qty>' +
            '<button type="button" class="qty-btn" data-qty-delta="-1" aria-label="Decrease">−</button>' +
            '<span class="qty-value" id="modalQtyValue">1</span>' +
            '<button type="button" class="qty-btn" data-qty-delta="1" aria-label="Increase">+</button>' +
          '</div>' +
          (oos
            ? '<button type="button" class="btn-primary" disabled>Out of Stock</button>'
            : '<button type="button" class="btn-primary" id="modalAddBtn" data-pid="' + esc(p.id) + '">Add to Cart</button>') +
          '<button type="button" class="btn-outline" id="modalWishBtn" data-wish-id="' + esc(p.id) + '">' +
            (wished ? '♥ Wishlisted' : '♡ Wishlist') +
          '</button>' +
        '</div>' +
        (related.length
          ? '<div class="modal-related">' +
              '<div class="modal-related-header">' +
                '<h3>Similar Products</h3>' +
                '<div class="modal-related-nav">' +
                  '<button type="button" class="modal-nav-arrow" id="modalRelatedPrev" aria-label="Previous similar product" title="Previous product">‹</button>' +
                  '<span class="modal-nav-count" id="modalRelatedCount">1 / ' + related.length + '</span>' +
                  '<button type="button" class="modal-nav-arrow" id="modalRelatedNext" aria-label="Next similar product" title="Next product">›</button>' +
                '</div>' +
              '</div>' +
              '<div class="modal-related-carousel" id="modalRelatedCarousel">' +
                '<div class="modal-related-track" id="modalRelatedTrack">' +
                  related.map(productCardHTML).join('') +
                '</div>' +
              '</div>' +
            '</div>'
          : '') +
      '</div>' +
    '</div>';

  openOverlay(overlay);

  // Restore saved note for this product if any exists in sessionStorage
  const noteInput = document.getElementById('modalProductNote');
  if (noteInput) {
    const savedNotes = JSON.parse(sessionStorage.getItem('product_notes') || '{}');
    if (savedNotes[p.id]) {
      noteInput.value = savedNotes[p.id];
    }
    noteInput.addEventListener('input', () => {
      const notes = JSON.parse(sessionStorage.getItem('product_notes') || '{}');
      notes[p.id] = noteInput.value;
      sessionStorage.setItem('product_notes', JSON.stringify(notes));
    });
  }

  // Similar products arrow navigation
  if (related.length) {
    let relatedIndex = 0;
    const track = document.getElementById('modalRelatedTrack');
    const countLabel = document.getElementById('modalRelatedCount');
    const prevBtn = document.getElementById('modalRelatedPrev');
    const nextBtn = document.getElementById('modalRelatedNext');

    const updateCarousel = () => {
      if (track) {
        const card = track.querySelector('.product-card-app');
        if (card) {
          const cardWidth = card.offsetWidth + 14; // card width + gap
          track.style.transform = `translateX(-${relatedIndex * cardWidth}px)`;
        }
      }
      if (countLabel) {
        countLabel.textContent = `${relatedIndex + 1} / ${related.length}`;
      }
      if (prevBtn) prevBtn.disabled = relatedIndex === 0;
      if (nextBtn) nextBtn.disabled = relatedIndex >= related.length - 1;
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (relatedIndex > 0) {
          relatedIndex--;
          updateCarousel();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (relatedIndex < related.length - 1) {
          relatedIndex++;
          updateCarousel();
        }
      });
    }

    updateCarousel();
  }

  let qty = 1;
  const qtyEl = document.getElementById('modalQtyValue');
  body.querySelectorAll('[data-qty-delta]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = Number(btn.getAttribute('data-qty-delta'));
      qty = Math.max(1, qty + d);
      if (qtyEl) qtyEl.textContent = String(qty);
    });
  });

  const addBtn = document.getElementById('modalAddBtn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      ShopApp.addToCart(p.id, qty); // ShopApp.toast handles feedback
    });
  }

  const wishBtn = document.getElementById('modalWishBtn');
  if (wishBtn) {
    wishBtn.addEventListener('click', () => {
      const now = ShopApp.toggleWishlist(p.id);
      wishBtn.textContent = now ? '♥ Wishlisted' : '♡ Wishlist';
      ShopApp._updateWishlistUI();
      if (ShopApp.activeView === 'wishlist') renderWishlist();
    });
  }
}

function closeProductModal() {
  closeOverlay(document.getElementById('productModalOverlay'));
}

/* ============================================================
   11. WISHLIST
   ============================================================ */

function renderWishlist() {
  const grid = document.getElementById('wishlistGrid');
  const empty = document.getElementById('wishlistEmpty');
  const bar = document.getElementById('wishlistActionsBar');
  const count = document.getElementById('wishlistItemCount');
  if (!grid) return;

  const items = ShopApp.wishlist.map(findProduct).filter(Boolean);

  if (!items.length) {
    grid.innerHTML = '';
    if (empty) { empty.hidden = false; empty.removeAttribute('hidden'); }
    if (bar) { bar.hidden = true; bar.setAttribute('hidden', ''); }
    return;
  }

  if (empty) { empty.hidden = true; empty.setAttribute('hidden', ''); }
  if (bar) { bar.hidden = false; bar.removeAttribute('hidden'); }
  if (count) count.textContent = items.length + (items.length === 1 ? ' item saved' : ' items saved');
  grid.innerHTML = items.map(productCardHTML).join('');
  ShopApp._updateWishlistUI();
}

/* ============================================================
   12. CART & CHECKOUT
   ============================================================ */

function renderCart() {
  const list = document.getElementById('cartItemsList');
  const empty = document.getElementById('cartEmpty');
  const summary = document.getElementById('cartSummaryCol');
  const layout = document.getElementById('cartLayout');
  if (!list) return;

  const entries = Object.entries(ShopApp.cart)
    .map(([id, qty]) => ({ product: findProduct(id), qty }))
    .filter(x => x.product);

  if (!entries.length) {
    list.innerHTML = '';
    if (empty) { empty.hidden = false; empty.removeAttribute('hidden'); }
    if (summary) summary.style.display = 'none';
    if (layout) layout.classList.add('is-empty');
    updateCartSummary(0, 0);
    return;
  }

  if (empty) { empty.hidden = true; empty.setAttribute('hidden', ''); }
  if (summary) summary.style.display = '';
  if (layout) layout.classList.remove('is-empty');

  list.innerHTML = entries.map(({ product: p, qty }) => (
    '<div class="cart-item" data-cart-id="' + esc(p.id) + '">' +
      '<img class="cart-item__img" src="' + esc(p.img) + '" alt="' + esc(p.name) + '" data-open-product="' + esc(p.id) + '">' +
      '<div class="cart-item__info">' +
        '<h3 class="cart-item__name" data-open-product="' + esc(p.id) + '">' + esc(p.name) + '</h3>' +
        '<p class="cart-item__unit">' + esc(p.unit) + ' · ' + money(p.price) + ' each</p>' +
        '<div class="cart-item__actions">' +
          '<div class="qty-selector">' +
            '<button type="button" class="qty-btn" data-cart-delta="-1" data-id="' + esc(p.id) + '">−</button>' +
            '<span class="qty-value">' + qty + '</span>' +
            '<button type="button" class="qty-btn" data-cart-delta="1" data-id="' + esc(p.id) + '">+</button>' +
          '</div>' +
          '<button type="button" class="cart-item__remove" data-remove-id="' + esc(p.id) + '">Remove</button>' +
        '</div>' +
      '</div>' +
      '<div class="cart-item__price-col">' +
        '<span class="cart-item__price">' + money(p.price * qty) + '</span>' +
      '</div>' +
    '</div>'
  )).join('');

  const subtotal = ShopApp.getCartTotal();
  const count = ShopApp.getCartCount();
  updateCartSummary(count, subtotal);
}

function updateCartSummary(count, subtotal) {
  const delivery = deliveryCharge(subtotal);
  const total = subtotal + delivery;
  const itemEl = document.getElementById('summaryItemCount');
  const subEl = document.getElementById('summarySubtotal');
  const delEl = document.getElementById('summaryDelivery');
  const totEl = document.getElementById('summaryTotal');
  if (itemEl) itemEl.textContent = String(count);
  if (subEl) subEl.textContent = money(subtotal);
  if (delEl) delEl.textContent = delivery === 0 ? 'Free' : money(delivery);
  if (totEl) totEl.textContent = money(total);
  const checkoutTotal = document.getElementById('checkoutTotal');
  if (checkoutTotal) checkoutTotal.textContent = money(total);
}

function openCheckoutModal() {
  if (!ShopApp.getCartCount()) {
    showToast('Your cart is empty', 'error');
    return;
  }
  const user = ShopApp.currentUser || {};
  const name = document.getElementById('coName');
  const phone = document.getElementById('coPhone');
  const email = document.getElementById('coEmail');
  const address = document.getElementById('coAddress');
  if (name) name.value = user.name || user.fullName || '';
  if (phone) phone.value = user.phone || user.mobile || '';
  if (email) email.value = user.email || '';
  if (address) {
    const addresses = readJSON(STORAGE.addresses, []);
    address.value = user.address || (addresses[0] && addresses[0].line) || '';
  }
  updateCartSummary(ShopApp.getCartCount(), ShopApp.getCartTotal());
  openOverlay(document.getElementById('checkoutModalOverlay'));
}

function closeCheckoutModal() {
  closeOverlay(document.getElementById('checkoutModalOverlay'));
}

async function placeOrder(formData) {
  const items = Object.entries(ShopApp.cart).map(([productId, qty]) => {
    const p = findProduct(productId);
    return {
      productId,
      qty: Math.max(0, parseInt(qty, 10) || 0),
      price: p ? p.price : 0,
      name: p ? p.name : productId
    };
  }).filter(i => i.qty > 0);

  if (!items.length) {
    showToast('Your cart is empty', 'error');
    return;
  }

  // Sanitize customer contact details to block script injection
  const safeName = esc(formData.name).trim();
  const safeAddress = esc(formData.address).trim();
  const safePhone = String(formData.phone || '').replace(/[^\d+ -]/g, '').slice(0, 15);
  const safeEmail = String(formData.email || '').trim().slice(0, 100);

  // If a live backend API is configured, route order creation securely through server:
  if (window.GOORGANIC_API_URL) {
    try {
      const response = await fetch(`${window.GOORGANIC_API_URL}/api/checkout/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.qty })),
          idempotencyKey: (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'idemp_' + Date.now(),
          deliveryAddress: { line1: safeAddress, phone: safePhone, name: safeName }
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Checkout failed on server');
      }
      const data = await response.json();
      // Server-managed gateway trigger (Razorpay / UPI)
      showToast('Order created securely on server', 'success');
    } catch (err) {
      showToast(err.message || 'Payment processing error', 'error');
      return;
    }
  }

  // Recalculate totals strictly from catalog product prices (avoid client-side price tampering)
  const subtotal = items.reduce((sum, item) => {
    const p = findProduct(item.productId);
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
  const delivery = deliveryCharge(subtotal);

  const order = {
    id: genOrderId(),
    date: new Date().toISOString().slice(0, 10),
    status: 'Processing',
    paymentStatus: formData.payment === 'cod' ? 'COD' : 'Pending Verification',
    paymentMethod: formData.payment === 'cod' ? 'COD' : 'UPI',
    items: items.map(({ productId, qty, price }) => ({ productId, qty, price })),
    total: subtotal + delivery,
    deliveryAddress: safeAddress,
    customer: {
      name: safeName,
      phone: safePhone,
      email: safeEmail
    }
  };

  saveUserOrder(order);
  ShopApp.cart = {};
  ShopApp.saveCart();

  closeCheckoutModal();

  const idDisplay = document.getElementById('orderIdDisplay');
  if (idDisplay) idDisplay.textContent = order.id;
  openOverlay(document.getElementById('orderConfirmOverlay'));
  showToast('Order placed successfully', 'success');
}

function closeOrderConfirm() {
  closeOverlay(document.getElementById('orderConfirmOverlay'));
}

/* ============================================================
   13. ORDER HISTORY
   ============================================================ */

function orderItemsLabel(order) {
  return (order.items || []).map(it => {
    const p = findProduct(it.productId);
    return (p ? p.name : it.productId) + ' ×' + it.qty;
  }).join(', ');
}

function renderOrderCard(order) {
  const thumbs = (order.items || []).slice(0, 4).map(it => {
    const p = findProduct(it.productId);
    return (
      '<div class="order-product-thumb">' +
        (p ? '<img src="' + esc(p.img) + '" alt="">' : '') +
        '<span>' + esc(p ? p.name : it.productId) + ' ×' + it.qty + '</span>' +
      '</div>'
    );
  }).join('');

  return (
    '<article class="order-card" data-order-id="' + esc(order.id) + '">' +
      '<div class="order-card__header">' +
        '<span class="order-card__id">' + esc(order.id) + '</span>' +
        '<span class="order-card__date">' + esc(order.date) + '</span>' +
        '<span class="order-card__status ' + statusClass(order.status) + '">' + esc(order.status) + '</span>' +
        '<span class="order-card__total">' + money(order.total) + '</span>' +
      '</div>' +
      '<div class="order-card__products">' + thumbs + '</div>' +
      '<div class="order-card__details" hidden>' +
        '<p><b>Payment:</b> ' + esc(order.paymentMethod || '—') + ' (' + esc(order.paymentStatus || '—') + ')</p>' +
        '<p><b>Address:</b> ' + esc(order.deliveryAddress || '—') + '</p>' +
        '<p><b>Items:</b> ' + esc(orderItemsLabel(order)) + '</p>' +
      '</div>' +
      '<div class="order-card__actions">' +
        '<button type="button" class="btn-outline" data-order-action="details">View Details</button>' +
        '<button type="button" class="btn-outline" data-order-action="track">Track</button>' +
        '<button type="button" class="btn-primary" data-order-action="again">Buy Again</button>' +
        '<button type="button" class="btn-outline" data-order-action="modify">Modify → Cart</button>' +
      '</div>' +
      '<div class="order-modify-panel" hidden></div>' +
    '</article>'
  );
}

function renderHistory(filterQ) {
  const container = document.getElementById('ordersContainer');
  const empty = document.getElementById('ordersEmpty');
  if (!container) return;

  const q = (filterQ != null
    ? filterQ
    : ((document.getElementById('orderSearchInput') || {}).value || '')
  ).trim().toLowerCase();

  let orders = getCustomerOrders();
  if (q) {
    orders = orders.filter(o => {
      const hay = [
        o.id,
        o.status,
        o.date,
        o.paymentStatus,
        orderItemsLabel(o)
      ].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  if (!orders.length) {
    container.innerHTML = '';
    if (empty) { empty.hidden = false; empty.removeAttribute('hidden'); }
    return;
  }

  if (empty) { empty.hidden = true; empty.setAttribute('hidden', ''); }
  container.innerHTML = orders.map(renderOrderCard).join('');
}

function quietAddToCart(productId, qty) {
  if (!productId || qty < 1) return false;
  const p = findProduct(productId);
  if (!p || p.inStock === false) return false;
  ShopApp.cart[productId] = (ShopApp.cart[productId] || 0) + qty;
  return true;
}

function buyAgainOrder(order) {
  let added = 0;
  let skipped = 0;
  (order.items || []).forEach(it => {
    if (quietAddToCart(it.productId, it.qty || 1)) added++;
    else skipped++;
  });
  if (added) {
    ShopApp.saveCart();
    showToast('Added ' + added + ' item(s) at current prices', 'success');
    navigate('cart');
  } else {
    showToast('No in-stock items to add', 'error');
  }
  if (skipped && added) showToast(skipped + ' item(s) unavailable', 'info');
}

function toggleModifyPanel(card, order) {
  const panel = card.querySelector('.order-modify-panel');
  if (!panel) return;
  const isHidden = panel.hidden || panel.hasAttribute('hidden') || panel.style.display === 'none';
  if (!isHidden) {
    panel.hidden = true;
    panel.setAttribute('hidden', '');
    panel.style.display = 'none';
    return;
  }
  panel.hidden = false;
  panel.removeAttribute('hidden');
  panel.style.display = 'block';
  panel.innerHTML =
    '<p>Select items to add to cart (current catalogue prices &amp; stock):</p>' +
    (order.items || []).map(it => {
      const p = findProduct(it.productId);
      const oos = !p || p.inStock === false;
      return (
        '<label class="filter-checkbox">' +
          '<input type="checkbox" data-mod-id="' + esc(it.productId) + '" data-mod-qty="' + (it.qty || 1) + '"' +
            (oos ? ' disabled' : ' checked') + '> ' +
          esc(p ? p.name : it.productId) +
          (p ? ' — ' + money(p.price) : '') +
          (oos ? ' (unavailable)' : '') +
        '</label>'
      );
    }).join('') +
    '<button type="button" class="btn-primary" data-mod-confirm="' + esc(order.id) + '">Add selected to cart</button>';
}

/* ============================================================
   14. HELP — FAQ + SUPPORT
   ============================================================ */

const FAQ_DATA = [
  {
    id: 'orders',
    icon: '📦',
    label: 'Orders',
    items: [
      { q: 'How do I place an order?', a: 'Browse the Shop, add items to your cart, then proceed to checkout. Confirm your address and place the order. You will receive an order ID instantly.' },
      { q: 'Can I modify an order after placing it?', a: 'Once an order moves past Processing, items cannot be edited. Contact support quickly with your order ID and we will help if fulfilment has not started.' }
    ]
  },
  {
    id: 'delivery',
    icon: '🚚',
    label: 'Delivery',
    items: [
      { q: 'What are the delivery charges?', a: 'Delivery is free for orders above ₹500. Orders below ₹500 have a ₹50 delivery charge.' },
      { q: 'Which areas do you deliver to?', a: 'We primarily deliver across Chennai. For other locations, message us with your PIN code and we will confirm availability.' }
    ]
  },
  {
    id: 'payments',
    icon: '💳',
    label: 'Payments',
    items: [
      { q: 'Which payment methods are accepted?', a: 'Cash on Delivery and UPI / online payment options are available at checkout. Online gateway integration is rolling out in phases.' },
      { q: 'Is my payment secure?', a: 'Yes. Online payments use trusted payment partners. We never ask for OTP or UPI PIN over phone or email.' }
    ]
  },
  {
    id: 'returns',
    icon: '↩️',
    label: 'Returns',
    items: [
      { q: 'What is your return policy?', a: 'If an item arrives damaged or incorrect, contact us within 48 hours with photos and your order ID. Eligible returns are refunded or replaced.' },
      { q: 'Are open food packets returnable?', a: 'Opened consumables generally cannot be returned unless there is a quality issue verified by our team.' }
    ]
  },
  {
    id: 'products',
    icon: '🌿',
    label: 'Products',
    items: [
      { q: 'Are your products organic / traditional?', a: 'We focus on organic and traditionally prepared staples. Product pages describe sourcing and preparation without inventing nutrition claims.' },
      { q: 'How do I find traditional picks?', a: 'Use Shop filters → Traditional Picks, or open the Traditional collection from the home page.' }
    ]
  },
  {
    id: 'account',
    icon: '👤',
    label: 'Account',
    items: [
      { q: 'How do I update my profile?', a: 'Open Profile from the header avatar. You can manage personal details, addresses, and notification preferences there.' },
      { q: 'I forgot my password.', a: 'Use the login recovery flow on the intro page. From Profile → Login & Security you can also request a demo password reset toast while signed in.' }
    ]
  },
  {
    id: 'wishlist',
    icon: '♥',
    label: 'Wishlist & Cart',
    items: [
      { q: 'Is my wishlist saved?', a: 'Yes. Wishlist and cart are stored in your browser (localStorage) while you stay signed in on this device.' },
      { q: 'Can I move wishlist items to cart?', a: 'Open Wishlist and use Add to Cart on individual cards, or Add All to Cart from the actions bar.' }
    ]
  },
  {
    id: 'support',
    icon: '☎',
    label: 'Support',
    items: [
      { q: 'How can I contact GoOrganic?', a: 'Call +91 91760 28198 / 044 615 0609, email goorganic101@gmail.com, or use the support form on this page. Store hours: daily 9:30 AM – 9:00 PM.' },
      { q: 'Where is the store?', a: 'No. GA/580, School Rd, Anna Nagar West Extn, Opp. SBOA School, Chennai 600101.' }
    ]
  }
];

const TROUBLESHOOTING = [
  { q: 'Order status stuck on Processing', a: 'Processing usually updates within a business day. Check Track Order with your ID. If it remains unchanged for longer, contact support with the order ID.' },
  { q: 'Cart total looks wrong', a: 'Subtotal uses current catalogue prices. Delivery is free above ₹500, otherwise ₹50. Refresh the cart view after changing quantities.' },
  { q: 'Cannot find a product', a: 'Clear Shop filters, then search by name or category. Some items may be temporarily out of stock.' }
];

function renderHelp(filterQ) {
  const wrap = document.getElementById('faqSectionWrap');
  if (!wrap) return;

  const q = (filterQ != null
    ? filterQ
    : ((document.getElementById('helpSearchInput') || {}).value || '')
  ).trim().toLowerCase();

  const cats = FAQ_DATA.map(cat => {
    const items = cat.items.filter(it =>
      !q || it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q) || cat.label.toLowerCase().includes(q)
    );
    return { ...cat, items };
  }).filter(cat => cat.items.length);

  const troubleshooting = TROUBLESHOOTING.filter(it =>
    !q || it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q)
  );

  wrap.innerHTML =
    '<div class="faq-categories">' +
      FAQ_DATA.map(cat => (
        '<button type="button" class="faq-cat-card" data-faq-jump="' + esc(cat.id) + '">' +
          '<span class="faq-cat-card__icon">' + cat.icon + '</span>' +
          '<span class="faq-cat-card__label">' + esc(cat.label) + '</span>' +
        '</button>'
      )).join('') +
    '</div>' +
    (cats.length ? cats.map(cat => (
      '<section class="faq-accordion" id="faq-cat-' + esc(cat.id) + '">' +
        '<h3>' + cat.icon + ' ' + esc(cat.label) + '</h3>' +
        cat.items.map((it, i) => (
          '<div class="faq-item" data-faq-item>' +
            '<button type="button" class="faq-item__question">' +
              '<span>' + esc(it.q) + '</span>' +
              '<span class="faq-item__icon">▾</span>' +
            '</button>' +
            '<div class="faq-item__answer"><div class="faq-item__answer-inner">' + esc(it.a) + '</div></div>' +
          '</div>'
        )).join('') +
      '</section>'
    )).join('') : '<p>No FAQ matches your search.</p>') +
    (troubleshooting.length
      ? '<section class="faq-accordion" id="faq-troubleshooting">' +
          '<h3>🛠 Troubleshooting</h3>' +
          troubleshooting.map(it => (
            '<div class="faq-item" data-faq-item>' +
              '<button type="button" class="faq-item__question">' +
                '<span>' + esc(it.q) + '</span>' +
                '<span class="faq-item__icon">▾</span>' +
              '</button>' +
              '<div class="faq-item__answer"><div class="faq-item__answer-inner">' + esc(it.a) + '</div></div>' +
            '</div>'
          )).join('') +
        '</section>'
      : '');

  UI.helpBuilt = true;
}

/* ============================================================
   15. TRACK ORDER
   ============================================================ */

const TRACK_STEPS = [
  { key: 'Pending', title: 'Order Placed', desc: 'We have received your order.' },
  { key: 'Processing', title: 'Processing', desc: 'Your items are being prepared.' },
  { key: 'Out for Delivery', title: 'Out for Delivery', desc: 'Handed to delivery partner.' },
  { key: 'Delivered', title: 'Delivered', desc: 'Order delivered successfully.' }
];

function statusStepIndex(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('cancel')) return -1;
  if (s.includes('deliver')) return 3;
  if (s.includes('out for')) return 2;
  if (s.includes('process') || s.includes('ship')) return 1;
  if (s.includes('pending')) return 0;
  return 1;
}

function renderTrackResult(order) {
  const result = document.getElementById('trackResult');
  const empty = document.getElementById('trackEmpty');
  if (!result) return;

  if (!order) {
    result.hidden = true;
    result.setAttribute('hidden', '');
    result.innerHTML = '';
    if (empty) { empty.hidden = false; empty.removeAttribute('hidden'); }
    return;
  }

  if (empty) { empty.hidden = true; empty.setAttribute('hidden', ''); }
  result.hidden = false;
  result.removeAttribute('hidden');

  const cancelled = String(order.status).toLowerCase().includes('cancel');
  const idx = statusStepIndex(order.status);

  const timeline = cancelled
    ? '<div class="track-timeline">' +
        '<div class="track-step done"><span class="track-step__dot">✓</span>' +
          '<span class="track-step__title">Order Placed</span>' +
          '<span class="track-step__desc">Order was received on ' + esc(order.date) + '.</span></div>' +
        '<div class="track-step current"><span class="track-step__dot">!</span>' +
          '<span class="track-step__title">Cancelled</span>' +
          '<span class="track-step__desc">This order was cancelled. Payment status: ' + esc(order.paymentStatus || '—') + '.</span></div>' +
      '</div>'
    : '<div class="track-timeline">' +
        TRACK_STEPS.map((step, i) => {
          let cls = 'pending';
          if (i < idx) cls = 'done';
          else if (i === idx) cls = 'current';
          return (
            '<div class="track-step ' + cls + '">' +
              '<span class="track-step__dot">' + (cls === 'done' ? '✓' : i + 1) + '</span>' +
              '<span class="track-step__title">' + esc(step.title) + '</span>' +
              '<span class="track-step__desc">' + esc(step.desc) + '</span>' +
            '</div>'
          );
        }).join('') +
      '</div>';

  result.innerHTML =
    '<div class="track-order-info">' +
      '<div>' +
        '<div class="track-order-id">' + esc(order.id) + '</div>' +
        '<p>Status: <b>' + esc(order.status) + '</b> · ' + esc(order.date) + '</p>' +
      '</div>' +
      '<div class="order-card__status ' + statusClass(order.status) + '">' + esc(order.status) + '</div>' +
    '</div>' +
    timeline +
    '<div class="porter-placeholder" style="margin-top:20px">' +
      '<span>🚚</span>' +
      '<div>' +
        '<b>Porter delivery</b>' +
        '<p>Partner assignment and live tracking appear here once a courier is allocated. We do not show placeholder phone numbers.</p>' +
        '<span class="status-pill">' +
          (idx >= 2 && !cancelled ? 'DELIVERY IN PROGRESS' : 'AWAITING DELIVERY ASSIGNMENT') +
        '</span>' +
      '</div>' +
    '</div>';
}

function populateTrackSelect() {
  const select = document.getElementById('trackOrderSelect');
  if (!select) return;
  const orders = getCustomerOrders().slice(0, 12);
  const current = select.value;
  select.innerHTML = '<option value="">— Choose an order —</option>' +
    orders.map(o => (
      '<option value="' + esc(o.id) + '">' + esc(o.id) + ' · ' + esc(o.status) + '</option>'
    )).join('');
  if (current) select.value = current;
}

function trackOrderById(orderId) {
  const id = String(orderId || '').trim();
  if (!id) {
    showToast('Enter an order ID', 'error');
    return;
  }
  const order = getCustomerOrders().find(o => o.id.toLowerCase() === id.toLowerCase());
  if (!order) {
    renderTrackResult(null);
    showToast('Order not found in your history', 'error');
    return;
  }
  const input = document.getElementById('trackOrderInput');
  if (input) input.value = order.id;
  const select = document.getElementById('trackOrderSelect');
  if (select) select.value = order.id;
  renderTrackResult(order);
}

function renderTrack() {
  populateTrackSelect();
  const input = document.getElementById('trackOrderInput');
  if (input && input.value.trim()) {
    trackOrderById(input.value.trim());
  } else {
    renderTrackResult(null);
  }
}

/* ============================================================
   16. PROFILE
   ============================================================ */

function renderProfileSection(section) {
  UI.profileSection = section || UI.profileSection || 'personal';
  $$('.profile-nav-item[data-section]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-section') === UI.profileSection);
  });

  const content = document.getElementById('profileContent');
  if (!content) return;
  const user = ShopApp.currentUser || {};

  if (UI.profileSection === 'personal') {
    content.innerHTML =
      '<h2>Personal Information</h2>' +
      '<form id="profilePersonalForm" class="profile-form">' +
        '<label>Full name <input id="pfName" value="' + esc(user.name || user.fullName || '') + '" required></label>' +
        '<label>Email <input id="pfEmail" type="email" value="' + esc(user.email || '') + '" required></label>' +
        '<label>Phone <input id="pfPhone" value="' + esc(user.phone || user.mobile || '') + '"></label>' +
        '<button type="submit" class="btn-primary">Save changes</button>' +
      '</form>';
    return;
  }

  if (UI.profileSection === 'addresses') {
    const addresses = readJSON(STORAGE.addresses, []);
    content.innerHTML =
      '<h2>Saved Addresses</h2>' +
      '<div id="addressList">' +
        (addresses.length
          ? addresses.map((a, i) => (
              '<div class="security-info-row">' +
                '<div><p class="security-info-row__value"><b>' + esc(a.label || 'Address') + '</b><br>' + esc(a.line) + '</p></div>' +
                '<button type="button" class="btn-outline security-info-row__btn" data-del-address="' + i + '">Remove</button>' +
              '</div>'
            )).join('')
          : '<p>No saved addresses yet.</p>') +
      '</div>' +
      '<form id="addressForm" class="profile-form">' +
        '<label>Label <input id="addrLabel" placeholder="Home / Work" required></label>' +
        '<label>Address <textarea id="addrLine" rows="3" required placeholder="House / street, area, city, PIN"></textarea></label>' +
        '<button type="submit" class="btn-primary">Add address</button>' +
      '</form>';
    return;
  }

  if (UI.profileSection === 'security') {
    content.innerHTML =
      '<h2>Login &amp; Security</h2>' +
      '<div class="security-info-row">' +
        '<div><b>Password</b><p class="security-info-row__value">••••••••</p></div>' +
        '<button type="button" class="btn-outline security-info-row__btn" id="demoPasswordBtn">Change password</button>' +
      '</div>' +
      '<p style="margin-top:12px;color:#788076">Password changes are demo-only in this frontend build.</p>';
    return;
  }

  if (UI.profileSection === 'notifications') {
    const prefs = readJSON(STORAGE.notif, { order: true, offers: true, newsletter: false });
    content.innerHTML =
      '<h2>Notifications</h2>' +
      '<form id="notifForm" class="profile-form">' +
        '<label class="filter-checkbox"><input type="checkbox" id="notifOrder"' + (prefs.order ? ' checked' : '') + '> Order updates</label>' +
        '<label class="filter-checkbox"><input type="checkbox" id="notifOffers"' + (prefs.offers ? ' checked' : '') + '> Offers &amp; seasonal deals</label>' +
        '<label class="filter-checkbox"><input type="checkbox" id="notifNews"' + (prefs.newsletter ? ' checked' : '') + '> Newsletter</label>' +
        '<button type="submit" class="btn-primary">Save preferences</button>' +
      '</form>';
    return;
  }

  if (UI.profileSection === 'privacy') {
    content.innerHTML =
      '<h2>Privacy &amp; Account</h2>' +
      '<p>You can clear local shopping data on this device. This demo does not call a backend delete API.</p>' +
      '<button type="button" class="btn-outline" id="clearLocalDataBtn">Clear cart, wishlist &amp; local orders</button>' +
      '<button type="button" class="btn-primary" id="deleteAccountBtn" style="margin-left:8px;background:#c94444">Delete account (demo)</button>';
    return;
  }

  if (UI.profileSection === 'activity') {
    let browsed = [];
    try { browsed = JSON.parse(sessionStorage.getItem(STORAGE.browsed) || '[]'); } catch (e) { browsed = []; }
    const recentOrders = getCustomerOrders().slice(0, 5);
    const browsedProducts = browsed.map(findProduct).filter(Boolean);

    content.innerHTML =
      '<div class="activity-page-head">' +
        '<h2>My Activity</h2>' +
        '<p class="activity-subtitle">Overview of your shopping journey, orders, and saved favorites</p>' +
      '</div>' +
      '<div class="activity-stat-grid">' +
        '<div class="activity-stat-card">' +
          '<div class="activity-stat-icon-wrap is-wishlist">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' +
          '</div>' +
          '<div class="activity-stat-info">' +
            '<span class="activity-stat-label">Saved in Wishlist</span>' +
            '<strong class="activity-stat-value">' + ShopApp.wishlist.length + '</strong>' +
            '<a href="#wishlist" class="activity-stat-link" data-nav="wishlist">View Wishlist →</a>' +
          '</div>' +
        '</div>' +
        '<div class="activity-stat-card">' +
          '<div class="activity-stat-icon-wrap is-cart">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>' +
          '</div>' +
          '<div class="activity-stat-info">' +
            '<span class="activity-stat-label">Items in Cart</span>' +
            '<strong class="activity-stat-value">' + ShopApp.getCartCount() + '</strong>' +
            '<a href="#cart" class="activity-stat-link" data-nav="cart">Go to Cart →</a>' +
          '</div>' +
        '</div>' +
        '<div class="activity-stat-card">' +
          '<div class="activity-stat-icon-wrap is-orders">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
          '</div>' +
          '<div class="activity-stat-info">' +
            '<span class="activity-stat-label">Total Orders</span>' +
            '<strong class="activity-stat-value">' + getCustomerOrders().length + '</strong>' +
            '<a href="#history" class="activity-stat-link" data-nav="history">Order History →</a>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="activity-section-block">' +
        '<div class="activity-section-head">' +
          '<h3>Recent Orders</h3>' +
          '<a href="#history" class="activity-head-action" data-nav="history">See All Orders</a>' +
        '</div>' +
        (recentOrders.length
          ? '<div class="activity-orders-list">' +
              recentOrders.map(o => (
                '<div class="activity-order-row">' +
                  '<div class="activity-order-id-badge">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>' +
                    '<span>#' + esc(o.id) + '</span>' +
                  '</div>' +
                  '<div class="activity-order-summary">' +
                    '<strong>' + money(o.total) + '</strong>' +
                    '<span class="activity-order-items">' + esc(orderItemsLabel(o)) + '</span>' +
                  '</div>' +
                  '<div class="activity-order-status is-' + esc(o.status || 'placed').toLowerCase() + '">' +
                    esc(o.status || 'Processing') +
                  '</div>' +
                '</div>'
              )).join('') +
            '</div>'
          : '<div class="activity-empty-state"><p>No orders placed yet.</p><a href="#shop" class="btn-outline btn-sm">Explore Shop</a></div>') +
      '</div>' +
      '<div class="activity-section-block">' +
        '<div class="activity-section-head">' +
          '<h3>Recently Browsed Products</h3>' +
        '</div>' +
        (browsedProducts.length
          ? '<div class="activity-browsed-grid">' + browsedProducts.slice(0, 3).map(productCardHTML).join('') + '</div>'
          : '<div class="activity-empty-state"><p>No products viewed in this session.</p></div>') +
      '</div>';
  }
}

function renderProfile() {
  setAvatarInitials();
  renderProfileSection(UI.profileSection);
}

/* ============================================================
   17. GLOBAL EVENT BINDING (once)
   ============================================================ */

function bindGlobalEvents() {
  if (UI.eventsBound) return;
  UI.eventsBound = true;

  // Delegated clicks
  document.addEventListener('click', e => {
    const t = e.target;

    // Never leave the shopping SPA via accidental intro anchors
    const rawLink = t.closest('a[href]');
    if (rawLink) {
      const href = rawLink.getAttribute('href') || '';
      if (
        href === 'index.html' ||
        href.startsWith('index.html#') ||
        href === '#about' ||
        href === '#categories' ||
        href === '#journal' ||
        href === '#contact' ||
        href === '#featured' ||
        href === '#login' ||
        href === '#signup'
      ) {
        e.preventDefault();
        showToast('You are in the store. Use the shopping navigation above.', 'info');
        return;
      }
    }

    // data-nav / collection cards
    const navEl = t.closest('[data-nav]');
    if (navEl && !t.closest('form')) {
      e.preventDefault();
      e.stopPropagation();
      applyNavDataset(navEl);
      return;
    }

    // Floating nav items
    const fnav = t.closest('.fnav-item[data-view]');
    if (fnav && !t.closest('#navCategoriesBtn')) {
      e.preventDefault();
      e.stopPropagation();
      navigate(fnav.getAttribute('data-view'));
      return;
    }

    // Category select (home carousel / nav dropdown only)
    // Do NOT intercept shop sidebar / drawer checkboxes — those support multi-select
    const catBtn = t.closest('[data-cat-id]');
    if (
      catBtn &&
      !t.closest('#filterCategoryList') &&
      !t.closest('#filterDrawerBody') &&
      !t.closest('#drawerCategoryList') &&
      !t.closest('.filter-category-list') &&
      catBtn.tagName !== 'INPUT'
    ) {
      e.preventDefault();
      selectCategory(catBtn.getAttribute('data-cat-id'));
      return;
    }

    // Wishlist toggle
    const wishBtn = t.closest('[data-wish-id]');
    if (wishBtn && !wishBtn.id) {
      e.preventDefault();
      e.stopPropagation();
      const id = wishBtn.getAttribute('data-wish-id');
      ShopApp.toggleWishlist(id);
      ShopApp._updateWishlistUI();
      if (ShopApp.activeView === 'wishlist') renderWishlist();
      wishBtn.classList.toggle('active', ShopApp.isInWishlist(id));
      return;
    }

    // Add to cart
    const addBtn = t.closest('[data-add-id]');
    if (addBtn) {
      e.preventDefault();
      e.stopPropagation();
      ShopApp.addToCart(addBtn.getAttribute('data-add-id'), 1);
      if (ShopApp.activeView === 'cart') renderCart();
      return;
    }

    // Open product
    const openBtn = t.closest('[data-open-product]');
    if (openBtn) {
      e.preventDefault();
      openProductModal(openBtn.getAttribute('data-open-product'));
      return;
    }

    // Active filter chips
    const chip = t.closest('[data-chip]');
    if (chip) {
      clearChip(chip.getAttribute('data-chip'));
      return;
    }

    // Cart qty / remove
    const cartDelta = t.closest('[data-cart-delta]');
    if (cartDelta) {
      const id = cartDelta.getAttribute('data-id');
      const delta = Number(cartDelta.getAttribute('data-cart-delta'));
      const next = (ShopApp.cart[id] || 0) + delta;
      ShopApp.updateQty(id, next);
      renderCart();
      return;
    }
    const removeBtn = t.closest('[data-remove-id]');
    if (removeBtn) {
      ShopApp.removeFromCart(removeBtn.getAttribute('data-remove-id'));
      renderCart();
      return;
    }

    // Order actions
    const orderAction = t.closest('[data-order-action]');
    if (orderAction) {
      const card = orderAction.closest('[data-order-id]');
      const orderId = card && card.getAttribute('data-order-id');
      const order = getCustomerOrders().find(o => o.id === orderId);
      if (!order) return;
      const action = orderAction.getAttribute('data-order-action');
      if (action === 'details') {
        const details = card.querySelector('.order-card__details');
        if (details) {
          const hide = !details.hidden;
          details.hidden = hide;
          if (hide) details.setAttribute('hidden', '');
          else details.removeAttribute('hidden');
        }
      } else if (action === 'track') {
        navigate('track');
        setTimeout(() => trackOrderById(order.id), 0);
      } else if (action === 'again') {
        buyAgainOrder(order);
      } else if (action === 'modify') {
        toggleModifyPanel(card, order);
      }
      return;
    }

    const modConfirm = t.closest('[data-mod-confirm]');
    if (modConfirm) {
      const panel = modConfirm.closest('.order-modify-panel');
      const selected = panel ? $$('[data-mod-id]:checked', panel) : [];
      let n = 0;
      selected.forEach(cb => {
        if (quietAddToCart(cb.getAttribute('data-mod-id'), Number(cb.getAttribute('data-mod-qty') || 1))) n++;
      });
      if (n) {
        ShopApp.saveCart();
        showToast('Added ' + n + ' item(s) to cart', 'success');
        navigate('cart');
      } else {
        showToast('Select available items first', 'info');
      }
      return;
    }

    // FAQ accordion
    const faqQ = t.closest('.faq-item__question');
    if (faqQ) {
      const item = faqQ.closest('.faq-item');
      if (item) item.classList.toggle('open');
      return;
    }

    const faqJump = t.closest('[data-faq-jump]');
    if (faqJump) {
      const target = document.getElementById('faq-cat-' + faqJump.getAttribute('data-faq-jump'));
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
      return;
    }

    // Profile address delete
    const delAddr = t.closest('[data-del-address]');
    if (delAddr) {
      const addresses = readJSON(STORAGE.addresses, []);
      addresses.splice(Number(delAddr.getAttribute('data-del-address')), 1);
      writeJSON(STORAGE.addresses, addresses);
      renderProfileSection('addresses');
      showToast('Address removed', 'info');
      return;
    }

    // Close dropdown when clicking outside
    if (!t.closest('#navCategoriesBtn') && !t.closest('#catDropdown')) {
      closeCatDropdown();
    }
  });

  // Categories button
  const catBtn = document.getElementById('navCategoriesBtn');
  if (catBtn) {
    catBtn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      toggleCatDropdown();
    });
    catBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCatDropdown();
      }
    });
  }

  // Brand link is handled via data-nav="home" in the delegated click handler

  // Home scroll arrows
  const homeCatPrev = document.getElementById('homeCatPrev');
  const homeCatNext = document.getElementById('homeCatNext');
  const homeCatTrack = document.getElementById('homeCategoryTrack');
  if (homeCatPrev) homeCatPrev.addEventListener('click', () => scrollTrack(homeCatTrack, -1));
  if (homeCatNext) homeCatNext.addEventListener('click', () => scrollTrack(homeCatTrack, 1));

  const bsPrev = document.getElementById('bestsellerPrev');
  const bsNext = document.getElementById('bestsellerNext');
  const bsTrack = document.getElementById('bestsellerTrack');
  if (bsPrev) bsPrev.addEventListener('click', () => scrollTrack(bsTrack, -1));
  if (bsNext) bsNext.addEventListener('click', () => scrollTrack(bsTrack, 1));

  // Shop filters
  const filterList = document.getElementById('filterCategoryList');
  if (filterList) {
    filterList.addEventListener('change', () => {
      readFiltersFromDOM();
      renderShopProducts();
    });
  }
  ['priceMinSlider', 'priceMaxSlider'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      readFiltersFromDOM();
      renderShopProducts();
    });
  });
  ['filterInStock', 'filterDiscounted', 'filterNew', 'filterTraditional'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      readFiltersFromDOM();
      renderShopProducts();
    });
  });
  const clearAll = document.getElementById('clearAllFilters');
  if (clearAll) clearAll.addEventListener('click', clearAllFilters);

  const shopSearch = document.getElementById('shopSearchInput');
  if (shopSearch) {
    shopSearch.addEventListener('input', () => {
      ShopApp.filters.search = shopSearch.value.trim();
      renderShopProducts();
    });
  }
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      ShopApp.filters.sort = sortSelect.value;
      renderShopProducts();
    });
  }
  const viewGrid = document.getElementById('viewGrid');
  const viewList = document.getElementById('viewList');
  if (viewGrid) viewGrid.addEventListener('click', () => { setShopViewMode('grid'); renderShopProducts(); });
  if (viewList) viewList.addEventListener('click', () => { setShopViewMode('list'); renderShopProducts(); });

  // Mobile filter drawer
  const filterMobileBtn = document.getElementById('filterMobileBtn');
  if (filterMobileBtn) filterMobileBtn.addEventListener('click', openFilterDrawer);
  const filterDrawerClose = document.getElementById('filterDrawerClose');
  if (filterDrawerClose) filterDrawerClose.addEventListener('click', closeFilterDrawer);
  const filterDrawerOverlay = document.getElementById('filterDrawerOverlay');
  if (filterDrawerOverlay) filterDrawerOverlay.addEventListener('click', closeFilterDrawer);

  const filterDrawerBody = document.getElementById('filterDrawerBody');
  if (filterDrawerBody) {
    filterDrawerBody.addEventListener('click', e => {
      if (e.target.id === 'drawerApplyFilters') {
        const cats = $$('#drawerCategoryList input[data-cat-id]:checked').map(cb => cb.getAttribute('data-cat-id'));
        ShopApp.filters.categories = cats;
        $$('#filterDrawerBody [data-drawer-flag]').forEach(cb => {
          ShopApp.filters[cb.getAttribute('data-drawer-flag')] = cb.checked;
        });
        syncFilterControlsFromState();
        renderShopProducts();
        closeFilterDrawer();
      }
      if (e.target.id === 'drawerClearFilters') {
        clearAllFilters();
        closeFilterDrawer();
      }
    });
  }

  // Modals
  const productClose = document.getElementById('productModalClose');
  if (productClose) productClose.addEventListener('click', closeProductModal);
  const productOverlay = document.getElementById('productModalOverlay');
  if (productOverlay) {
    productOverlay.addEventListener('click', e => {
      if (e.target === productOverlay) closeProductModal();
    });
  }

  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);
  const checkoutClose = document.getElementById('checkoutModalClose');
  if (checkoutClose) checkoutClose.addEventListener('click', closeCheckoutModal);
  const checkoutOverlay = document.getElementById('checkoutModalOverlay');
  if (checkoutOverlay) {
    checkoutOverlay.addEventListener('click', e => {
      if (e.target === checkoutOverlay) closeCheckoutModal();
    });
  }

  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', e => {
      e.preventDefault();
      const paymentEl = checkoutForm.querySelector('input[name="payment"]:checked');
      placeOrder({
        name: (document.getElementById('coName') || {}).value || '',
        phone: (document.getElementById('coPhone') || {}).value || '',
        email: (document.getElementById('coEmail') || {}).value || '',
        address: (document.getElementById('coAddress') || {}).value || '',
        payment: paymentEl ? paymentEl.value : 'cod'
      });
    });
  }

  const orderConfirmClose = document.getElementById('orderConfirmClose');
  if (orderConfirmClose) orderConfirmClose.addEventListener('click', closeOrderConfirm);
  const goHistory = document.getElementById('goToHistoryBtn');
  if (goHistory) goHistory.addEventListener('click', () => { closeOrderConfirm(); navigate('history'); });
  const continueShop = document.getElementById('continueShoppingBtn');
  if (continueShop) continueShop.addEventListener('click', () => { closeOrderConfirm(); navigate('shop'); });

  // Wishlist add all
  const addAll = document.getElementById('addAllToCart');
  if (addAll) {
    addAll.addEventListener('click', () => {
      let n = 0;
      ShopApp.wishlist.forEach(id => {
        if (quietAddToCart(id, 1)) n++;
      });
      if (n) {
        ShopApp.saveCart();
        showToast('Added ' + n + ' wishlist item(s) to cart', 'success');
        navigate('cart');
      } else {
        showToast('No in-stock wishlist items', 'info');
      }
    });
  }

  // History search
  const orderSearch = document.getElementById('orderSearchInput');
  if (orderSearch) {
    orderSearch.addEventListener('input', () => renderHistory(orderSearch.value));
  }

  // Help
  const helpSearch = document.getElementById('helpSearchInput');
  if (helpSearch) {
    helpSearch.addEventListener('input', () => renderHelp(helpSearch.value));
  }
  const supportForm = document.getElementById('supportForm');
  if (supportForm) {
    supportForm.addEventListener('submit', e => {
      e.preventDefault();
      showToast('Message sent — our team will get back to you (demo)', 'success');
      supportForm.reset();
    });
  }
  const draftEmail = document.getElementById('draftEmailBtn');
  if (draftEmail) {
    draftEmail.addEventListener('click', () => {
      const cat = (document.getElementById('issueCategory') || {}).value || '';
      const oid = (document.getElementById('supportOrderId') || {}).value || '';
      const subject = (document.getElementById('supportSubject') || {}).value || 'GoOrganic Support';
      const message = (document.getElementById('supportMessage') || {}).value || '';
      const body =
        'Category: ' + cat + '\n' +
        'Order ID: ' + oid + '\n\n' +
        message;
      window.location.href =
        'mailto:goorganic101@gmail.com?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    });
  }

  // Track
  const trackBtn = document.getElementById('trackSearchBtn');
  if (trackBtn) {
    trackBtn.addEventListener('click', () => {
      trackOrderById((document.getElementById('trackOrderInput') || {}).value);
    });
  }
  const trackInput = document.getElementById('trackOrderInput');
  if (trackInput) {
    trackInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        trackOrderById(trackInput.value);
      }
    });
  }
  const trackSelect = document.getElementById('trackOrderSelect');
  if (trackSelect) {
    trackSelect.addEventListener('change', () => {
      if (trackSelect.value) trackOrderById(trackSelect.value);
    });
  }

  // Profile nav
  $$('.profile-nav-item[data-section]').forEach(btn => {
    btn.addEventListener('click', () => renderProfileSection(btn.getAttribute('data-section')));
  });
  const logoutBtn = document.getElementById('profileLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => ShopApp.logout());
  }

  const profileContent = document.getElementById('profileContent');
  if (profileContent) {
    profileContent.addEventListener('submit', e => {
      const form = e.target;
      if (form.id === 'profilePersonalForm') {
        e.preventDefault();
        const updated = Object.assign({}, ShopApp.currentUser || {}, {
          name: (document.getElementById('pfName') || {}).value || '',
          email: (document.getElementById('pfEmail') || {}).value || '',
          phone: (document.getElementById('pfPhone') || {}).value || ''
        });
        ShopApp.currentUser = updated;
        writeJSON('goorganic-user', updated);
        setAvatarInitials();
        showToast('Profile updated', 'success');
      }
      if (form.id === 'addressForm') {
        e.preventDefault();
        const addresses = readJSON(STORAGE.addresses, []);
        addresses.push({
          label: (document.getElementById('addrLabel') || {}).value || 'Address',
          line: (document.getElementById('addrLine') || {}).value || ''
        });
        writeJSON(STORAGE.addresses, addresses);
        showToast('Address saved', 'success');
        renderProfileSection('addresses');
      }
      if (form.id === 'notifForm') {
        e.preventDefault();
        writeJSON(STORAGE.notif, {
          order: !!(document.getElementById('notifOrder') || {}).checked,
          offers: !!(document.getElementById('notifOffers') || {}).checked,
          newsletter: !!(document.getElementById('notifNews') || {}).checked
        });
        showToast('Notification preferences saved', 'success');
      }
    });

    profileContent.addEventListener('click', e => {
      if (e.target.id === 'demoPasswordBtn') {
        showToast('Password reset link sent (demo)', 'info');
      }
      if (e.target.id === 'clearLocalDataBtn') {
        if (!confirm('Clear cart, wishlist and locally saved orders on this device?')) return;
        ShopApp.cart = {};
        ShopApp.wishlist = [];
        ShopApp.saveCart();
        ShopApp.saveWishlist();
        localStorage.removeItem(STORAGE.orders);
        showToast('Local shopping data cleared', 'info');
        renderProfileSection('activity');
      }
      if (e.target.id === 'deleteAccountBtn') {
        if (!confirm('Delete this demo account and sign out?')) return;
        localStorage.removeItem('goorganic-user');
        localStorage.removeItem('goorganic-cart');
        localStorage.removeItem('goorganic-wishlist');
        localStorage.removeItem(STORAGE.orders);
        showToast('Account deleted (demo)', 'info');
        setTimeout(() => { window.location.href = 'index.html#login'; }, 700);
      }
    });
  }

  // Newsletter
  const newsletter = document.getElementById('newsletterForm');
  if (newsletter) {
    newsletter.addEventListener('submit', e => {
      e.preventDefault();
      const emailInput = newsletter.querySelector('input[type="email"]');
      const val = emailInput ? emailInput.value.trim() : '';
      if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        showToast('Please enter a valid email', 'error');
        return;
      }
      showToast('Subscribed — welcome to the list (demo)', 'success');
      newsletter.reset();
    });
  }

  // Escape closes modals / drawer / dropdown
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    closeProductModal();
    closeCheckoutModal();
    closeOrderConfirm();
    closeFilterDrawer();
    closeCatDropdown();
  });

  window.addEventListener('hashchange', () => routeFromHash());

  bindHeaderSearch();
  populateCatDropdown();
}

/* ============================================================
   18. INIT
   ============================================================ */

function boot() {
  if (!authGuard()) return;

  ShopApp.init();

  // Prefer #appToast for ShopApp.toast as well
  const _origToast = ShopApp.toast.bind(ShopApp);
  ShopApp.toast = function (msg, type) {
    const el = document.getElementById('appToast');
    if (el) {
      showToast(msg, type);
      return;
    }
    _origToast(msg, type);
  };

  setAvatarInitials();
  bindGlobalEvents();

  // Ensure price bounds before first shop render
  const bounds = productPriceBounds();
  ShopApp.filters.priceMin = Math.floor(bounds.min / 10) * 10;
  ShopApp.filters.priceMax = Math.ceil(bounds.max / 10) * 10;

  routeFromHash();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

/* ============================================================
   19. WINDOW EXPORTS (residual inline handlers / debugging)
   ============================================================ */

window.navigate = navigate;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.showToast = showToast;
window.selectCategory = selectCategory;
window.renderShop = renderShop;
window.renderCart = renderCart;
window.renderWishlist = renderWishlist;
window.trackOrderById = trackOrderById;
