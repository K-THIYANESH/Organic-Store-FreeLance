// GoOrganic Core Application Logic

let currentUser = JSON.parse(localStorage.getItem('goorganic-user') || 'null');
let cart = JSON.parse(localStorage.getItem('goorganic-cart') || '{}');
let wishlist = JSON.parse(localStorage.getItem('goorganic-wishlist') || '[]');
let authMode = 'signin', heroIndex = 0, heroTimer;

function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const money = n => '₹' + Number(n).toLocaleString('en-IN');

function toast(msg) {
  let t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2300);
}

function saveCart() {
  localStorage.setItem('goorganic-cart', JSON.stringify(cart));
  renderCartCount();
}

function saveWishlist() {
  localStorage.setItem('goorganic-wishlist', JSON.stringify(wishlist));
  renderWishlistCount();
}

function countCart() {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

function countWishlist() {
  return wishlist.length;
}

function renderWishlistCount() {
  let c = countWishlist();
  let cnt = $('#wishlistCount');
  if (cnt) cnt.textContent = c;
  let dcnt = $('#drawerWishlistCount');
  if (dcnt) dcnt.textContent = '(' + c + ')';
}

function renderCartCount() {
  let c = countCart();
  let cnt = $('#cartCount');
  if (cnt) cnt.textContent = c;
  let dcnt = $('#drawerCount');
  if (dcnt) dcnt.textContent = '(' + c + ')';
}

function toggleWishlist(id) {
  if (!currentUser) {
    location.hash = '#login';
    toast('Please log in to access your wishlist');
    return;
  }
  let idx = wishlist.indexOf(id);
  if (idx > -1) {
    wishlist.splice(idx, 1);
    toast('Removed from wishlist');
  } else {
    wishlist.push(id);
    toast('Saved to wishlist ♡');
  }
  saveWishlist();
  renderProducts();
  renderWishlist();
}

function enterShopApp(extraHash) {
  const hash = extraHash || '#home';
  window.location.href = 'home.html' + hash;
}

function categoryMarkup(c) {
  const shopHref = currentUser ? 'home.html#shop' : '#login';
  return `<article class="category-card" data-intro-category="${c[0]}">
    <div class="category-card-thumb">
      <div class="thumb-circle-decor"></div>
      <img src="${c[2]}" alt="${c[0]}" loading="lazy">
    </div>
    <div class="category-card-body">
      <h3>${c[0]}</h3>
      <a href="${shopHref}" class="category-cta-link shop-now-btn" data-category="${c[0]}" onclick="event.stopPropagation()">Shop Now <span>↗</span></a>
    </div>
  </article>`;
}

function productMarkup(p, isShop = false) {
  if (!currentUser) {
    // Guest view: previews product with Login to Shop button; no wishlist or cart
    return `<article class="product-card">
      <div class="product-image">
        <img src="${p.img}" alt="${p.name}" loading="lazy">
        <span class="product-tag">${p.tag}</span>
      </div>
      <div class="product-info">
        <small>${p.category.toUpperCase()} · ${p.unit.toUpperCase()}</small>
        <h3>${p.name}</h3>
        <div class="product-buy">
          <b>${money(p.price)}</b>
          <a class="add-btn login-btn-card" href="#login">LOGIN ↗</a>
        </div>
      </div>
    </article>`;
  }

  // Registered user view: allows full Add to Cart, Wishlist & Detailed View
  let inWish = wishlist.includes(p.id);
  return `<article class="product-card">
    <div class="product-image" onclick="showProductDetails('${p.id}')" style="cursor:pointer" title="Click for detailed description">
      <img src="${p.img}" alt="${p.name}" loading="lazy">
      <span class="product-tag">${p.tag}</span>
      <button class="wishlist-toggle-icon ${inWish ? 'active' : ''}" onclick="event.stopPropagation(); toggleWishlist('${p.id}')" title="${inWish ? 'Remove from wishlist' : 'Add to wishlist'}">
        ${inWish ? '♥' : '♡'}
      </button>
    </div>
    <div class="product-info">
      <small>${p.category.toUpperCase()} · ${p.unit.toUpperCase()}</small>
      <h3 onclick="showProductDetails('${p.id}')" style="cursor:pointer">${p.name}</h3>
      <div class="product-buy">
        <b>${money(p.price)}</b>
        <div class="shop-card-btns">
          <button class="detail-btn" onclick="showProductDetails('${p.id}')" title="Details">ℹ</button>
          <button class="add-btn" data-add="${p.id}">+ ADD</button>
        </div>
      </div>
    </div>
  </article>`;
}

function showProductDetails(id) {
  if (!currentUser) {
    location.hash = '#login';
    toast('Please sign in to view full product details');
    return;
  }
  let p = products.find(x => x.id === id);
  if (!p) return;
  let inWish = wishlist.includes(p.id);
  $('#productModalBody').innerHTML = `
    <div class="product-detail-layout">
      <img src="${p.img}" alt="${p.name}" class="product-detail-img">
      <div class="product-detail-copy">
        <span class="product-tag">${p.tag}</span>
        <small class="detail-cat">${p.category.toUpperCase()} · ${p.unit.toUpperCase()}</small>
        <h2>${p.name}</h2>
        <b class="detail-price">${money(p.price)}</b>
        <p class="detail-description">${p.desc}</p>
        <div class="detail-highlights">
          <div>✓ Grown without chemical pesticides</div>
          <div>✓ Direct farmer sourcing</div>
          <div>✓ Anna Nagar store fresh stock</div>
        </div>
        <div class="detail-actions-row">
          <button class="primary-btn detail-add" data-add="${p.id}">Add to cart · ${money(p.price)} ↗</button>
          <button class="wishlist-action-btn ${inWish ? 'active' : ''}" onclick="toggleWishlist('${p.id}'); showProductDetails('${p.id}')">
            ${inWish ? '♥ Saved in Wishlist' : '♡ Save to Wishlist'}
          </button>
        </div>
      </div>
    </div>
  `;
  showModal('#productModal');
}

function renderProducts() {
  $('#productTrack').innerHTML = products.slice(0, 6).map(p => productMarkup(p, false)).join('');
  if (currentUser) {
    $('#shopGrid').innerHTML = products.map(p => productMarkup(p, true)).join('');
    $('#categoryFilter').innerHTML = '<option value="all">All collections</option>' + categories.map(c => `<option>${c[0]}</option>`).join('');
  }
}

function renderCategories() {
  $('#categoryTrack').innerHTML = categories.map(categoryMarkup).join('');
}

function renderWishlist() {
  let items = wishlist.map(id => products.find(p => p.id === id)).filter(Boolean);
  let el = $('#wishlistItems');
  if (!el) return;
  el.innerHTML = items.length ? items.map(p => `
    <div class="cart-row wishlist-row">
      <img src="${p.img}" alt="${p.name}" onclick="showProductDetails('${p.id}')" style="cursor:pointer">
      <div style="flex:1">
        <h4 onclick="showProductDetails('${p.id}')" style="cursor:pointer">${p.name}</h4>
        <small>${money(p.price)} · ${p.unit}</small>
        <div style="margin-top:6px; display:flex; gap:8px;">
          <button class="mini-add-btn" data-add="${p.id}">+ Move to cart</button>
          <button class="mini-remove-btn" onclick="toggleWishlist('${p.id}')">Remove</button>
        </div>
      </div>
      <strong>${money(p.price)}</strong>
    </div>`).join('') : '<p class="cart-empty">Your wishlist is empty. Browse products and tap ♡ to save favourites.</p>';
  renderWishlistCount();
}

function renderCart() {
  let items = Object.entries(cart).filter(([id, q]) => q > 0).map(([id, q]) => ({ p: products.find(p => p.id === id), q })).filter(x => x.p);
  $('#cartItems').innerHTML = items.length ? items.map(({ p, q }) => `
    <div class="cart-row">
      <img src="${p.img}" alt="">
      <div>
        <h4>${p.name}</h4>
        <small>${money(p.price)} · ${p.unit}</small>
        <div class="qty">
          <button data-qty="${p.id}" data-delta="-1">−</button>
          <span>${q}</span>
          <button data-qty="${p.id}" data-delta="1">+</button>
        </div>
      </div>
      <strong>${money(p.price * q)}</strong>
    </div>`).join('') : '<p class="cart-empty">Your cart is empty. Add wholesome organic staples to get started.</p>';

  let total = items.reduce((s, x) => s + x.p.price * x.q, 0);
  $('#cartSubtotal').textContent = money(total);
  $('#checkoutTotal').textContent = money(total);
  renderCartCount();
}

function openWishlist() {
  if (!currentUser) {
    location.hash = '#login';
    toast('Please sign in to view your wishlist');
    return;
  }
  closeCart();
  $('#wishlistDrawer').classList.add('open');
  $('#scrim').classList.add('show');
  $('#wishlistDrawer').setAttribute('aria-hidden', 'false');
  renderWishlist();
}

function closeWishlist() {
  let wd = $('#wishlistDrawer');
  if (wd) {
    wd.classList.remove('open');
    wd.setAttribute('aria-hidden', 'true');
  }
  if (!$('#cartDrawer')?.classList.contains('open')) {
    $('#scrim').classList.remove('show');
  }
}

function openCart() {
  if (!currentUser) {
    location.hash = '#login';
    toast('Please sign in to view your cart');
    return;
  }
  closeWishlist();
  $('#cartDrawer').classList.add('open');
  $('#scrim').classList.add('show');
  $('#cartDrawer').setAttribute('aria-hidden', 'false');
  renderCart();
}

function closeCart() {
  $('#cartDrawer').classList.remove('open');
  $('#cartDrawer').setAttribute('aria-hidden', 'true');
  if (!$('#wishlistDrawer')?.classList.contains('open')) {
    $('#scrim').classList.remove('show');
  }
}

function addProduct(id) {
  if (!currentUser) {
    location.hash = '#login';
    toast('Please sign in to add products to your cart');
    return;
  }
  cart[id] = (cart[id] || 0) + 1;
  saveCart();
  renderCart();
  toast('Added to your cart');
}

function setHero(i) {
  const slides = $$('.hero-slide-pane');
  const n = slides.length || 3;
  heroIndex = ((i % n) + n) % n;
  // Update Background Slides
  $$('.hero-bg-slide').forEach((e, idx) => e.classList.toggle('active', idx === heroIndex));
  // Update Text Panes
  $$('.hero-slide-pane').forEach((e, idx) => e.classList.toggle('active', idx === heroIndex));
  // Update Slide Counter
  let counter = $('#heroSlideCounter');
  if (counter) {
    const cur = String(heroIndex + 1).padStart(2, '0');
    const tot = String(n).padStart(2, '0');
    counter.textContent = `${cur} / ${tot}`;
  }
}

function startHero() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => setHero(heroIndex + 1), 3000);
}

function updateNavHighlight(targetId) {
  $$('.nav-link').forEach(a => {
    let href = a.getAttribute('href');
    a.classList.toggle('active', href === targetId);
  });
}

function route() {
  let hash = location.hash || '#home';

  // Vercel rewrites /login and /signup onto this page without a hash.
  const prettyPath = (location.pathname || '/').replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
  if (!location.hash && (prettyPath === '/login' || prettyPath === '/signup')) {
    location.hash = prettyPath === '/signup' ? '#signup' : '#login';
    return;
  }

  // Smooth scroll within home page sections
  if (hash === '#about' || hash === '#categories' || hash === '#journal' || hash === '#contact' || hash === '#featured' || hash === '#home') {
    $('#homeView').hidden = false;
    $('#authView').hidden = true;
    $('#shopView').hidden = true;
    document.body.classList.remove('auth-mode');
    updateNavHighlight(hash);
    closeCart();
    closeWishlist();
    startHero();

    if (hash !== '#home') {
      let el = $(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return;
  }

  let auth = hash === '#login' || hash === '#signup';
  let shop = hash === '#shop';

  // Logged-in shopping lives on home.html — never keep the intro-page shop shell
  if (shop) {
    if (!currentUser) {
      location.hash = '#login';
      toast('Please log in to access the organic shop');
      return;
    }
    enterShopApp('#home');
    return;
  }

  $('#homeView').hidden = auth;
  $('#authView').hidden = !auth;
  $('#shopView').hidden = true;
  document.body.classList.toggle('auth-mode', auth);

  if (auth) {
    clearInterval(heroTimer);
    setAuthMode(hash === '#signup' ? 'signup' : 'signin');
  } else {
    startHero();
  }

  updateNavHighlight(hash);
  closeCart();
  closeWishlist();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderShop() {
  let term = ($('#productSearch')?.value || '').toLowerCase();
  let cat = $('#categoryFilter')?.value || 'all';
  let list = products.filter(p => (cat === 'all' || p.category === cat) && (`${p.name} ${p.category}`).toLowerCase().includes(term));
  $('#shopGrid').innerHTML = list.length ? list.map(p => productMarkup(p, true)).join('') : '<p class="no-products">No organic products match your search.</p>';
}

function setAuthMode(mode) {
  authMode = mode;
  let signup = mode === 'signup';
  $('#signInTab').classList.toggle('selected', !signup);
  $('#signUpTab').classList.toggle('selected', signup);
  $('#authTitle').innerHTML = signup ? 'Grow With <em>Us.</em>' : 'Back to <em>Roots.</em>';
  $('#authSub').textContent = signup ? 'Create an account to make thoughtful shopping easier.' : 'Sign in to continue your journey with GoOrganic.';
  $('#nameLabel').hidden = !signup;
  $('#phoneLabel').hidden = !signup;
  $('#authName').required = signup;
  $('#authPhone').required = signup;
  $('#authSubmit').innerHTML = signup ? 'Create account <span>↗</span>' : 'Sign in <span>↗</span>';
  $('#authMessage').textContent = '';
}

function showModal(id) { $(id).classList.add('show'); }
function hideModal(id) { $(id).classList.remove('show'); }

// Init
renderCategories();
renderProducts();
renderCartCount();
renderWishlistCount();
startHero();

// Hero Navigation & Controls
let heroPrevBtn = $('#heroPrev');
if (heroPrevBtn) heroPrevBtn.onclick = () => { setHero(heroIndex - 1); startHero(); };
let heroNextBtn = $('#heroNext');
if (heroNextBtn) heroNextBtn.onclick = () => { setHero(heroIndex + 1); startHero(); };

// Pause hero on hover
let heroSec = $('#hero');
if (heroSec) {
  heroSec.addEventListener('mouseenter', () => clearInterval(heroTimer));
  heroSec.addEventListener('mouseleave', () => startHero());
}

// Featured Carousel
$('#productPrev').onclick = () => $('#productTrack').scrollBy({ left: -500, behavior: 'smooth' });
$('#productNext').onclick = () => $('#productTrack').scrollBy({ left: 500, behavior: 'smooth' });

// Categories Carousel Arrow Navigation
$('#catPrev').onclick = () => $('#categoryTrack').scrollBy({ left: -220, behavior: 'smooth' });
$('#catNext').onclick = () => $('#categoryTrack').scrollBy({ left: 220, behavior: 'smooth' });

// Back to Top Button
let backToTopBtn = $('.back-to-top');
if (backToTopBtn) {
  backToTopBtn.onclick = (e) => {
    e.preventDefault();
    if (location.hash && location.hash !== '#home') {
      location.hash = '#home';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
}

// Mobile Menu
$('#mobileMenu').onclick = () => $('#mainNav').classList.toggle('open');
$$('#mainNav a').forEach(a => a.onclick = (e) => {
  $('#mainNav').classList.remove('open');
  let href = a.getAttribute('href');
  if (href.startsWith('#')) {
    e.preventDefault();
    location.hash = href;
    route();
  }
});

// Cart Drawer events
let cartOpenBtn = $('#cartOpen');
if (cartOpenBtn) cartOpenBtn.onclick = openCart;
$('#cartClose').onclick = closeCart;

// Wishlist Drawer events
let wishlistOpenBtn = $('#wishlistOpen');
if (wishlistOpenBtn) wishlistOpenBtn.onclick = openWishlist;
let wishlistCloseBtn = $('#wishlistClose');
if (wishlistCloseBtn) wishlistCloseBtn.onclick = closeWishlist;

$('#scrim').onclick = () => { closeCart(); closeWishlist(); hideModal('#productModal'); };
let prodClose = $('#productModalClose');
if (prodClose) prodClose.onclick = () => hideModal('#productModal');

// Global event delegation
document.addEventListener('click', e => {
  let add = e.target.closest('[data-add]');
  if (add) {
    addProduct(add.dataset.add);
    hideModal('#productModal');
  }

  let qty = e.target.closest('[data-qty]');
  if (qty) {
    let id = qty.dataset.qty;
    cart[id] = Math.max(0, (cart[id] || 0) + Number(qty.dataset.delta));
    if (!cart[id]) delete cart[id];
    saveCart();
    renderCart();
  }

  let enterShop = e.target.closest('[data-enter-shop]');
  if (enterShop) {
    e.preventDefault();
    if (currentUser) enterShopApp('#home');
    else {
      location.hash = '#login';
      toast('Please log in to enter the organic store');
    }
    return;
  }

  let introCat = e.target.closest('[data-intro-category]');
  if (introCat) {
    e.preventDefault();
    if (currentUser) {
      enterShopApp('#shop');
    } else {
      location.hash = '#login';
      toast('Please log in to browse ' + introCat.dataset.introCategory);
    }
    return;
  }

  let cat = e.target.closest('[data-category]');
  if (cat) {
    e.preventDefault();
    if (currentUser) {
      enterShopApp('#shop');
    } else {
      location.hash = '#login';
      toast('Please log in to browse ' + cat.dataset.category);
    }
  }
});

// Checkout workflow
$('#checkoutBtn').onclick = () => {
  if (!countCart()) { toast('Your cart is empty'); return; }
  closeCart();
  if (currentUser && currentUser.name) $('#checkoutName').value = currentUser.name;
  if (currentUser && currentUser.phone) $('#checkoutPhone').value = currentUser.phone;
  if (currentUser && currentUser.email) $('#checkoutEmail').value = currentUser.email;
  showModal('#checkoutModal');
};

$('#checkoutClose').onclick = () => hideModal('#checkoutModal');
$('#orderClose').onclick = () => hideModal('#orderModal');
$('#continueShopping').onclick = () => {
  hideModal('#orderModal');
  if (currentUser) enterShopApp('#shop');
  else location.hash = '#login';
};

$('#checkoutForm').onsubmit = e => {
  e.preventDefault();
  if (!countCart()) return;
  let order = 'GO-' + Date.now().toString().slice(-8);
  $('#orderId').textContent = 'ORDER REFERENCE · ' + order;
  let payload = {
    orderId: order,
    customer: $('#checkoutName').value,
    phone: $('#checkoutPhone').value,
    email: $('#checkoutEmail').value,
    address: $('#checkoutAddress').value,
    items: cart,
    total: Object.entries(cart).reduce((s, [id, q]) => s + products.find(p => p.id === id).price * q, 0),
    paymentMode: 'RAZORPAY_TEST',
    delivery: { provider: 'PORTER_PENDING', status: 'AWAITING_ASSIGNMENT' }
  };
  console.log('Demo order payload — connect backend here:', payload);
  cart = {};
  saveCart();
  renderCart();
  hideModal('#checkoutModal');
  showModal('#orderModal');
  e.target.reset();
};

// Auth form handling
$('#signInTab').onclick = () => setAuthMode('signin');
$('#signUpTab').onclick = () => setAuthMode('signup');

$('#authForm').onsubmit = e => {
  e.preventDefault();
  let email = $('#authEmail').value.trim();
  let name = $('#authName')?.value.trim() || email.split('@')[0];
  let phone = $('#authPhone')?.value.trim() || '+91 98765 43210';

  if (authMode === 'signup' && !phone) {
    toast('Mobile number is mandatory');
    return;
  }

  // Set logged in user state
  currentUser = { name, email, phone };
  localStorage.setItem('goorganic-user', JSON.stringify(currentUser));

  // Update header login button to user name / Logout
  updateUserHeader();

  toast(authMode === 'signup' ? 'Welcome to GoOrganic!' : 'Signed in successfully!');
  renderCategories();
  renderProducts();

  // Navigate into the post-login shopping experience
  setTimeout(() => enterShopApp('#home'), 350);
};

$('#googleBtn').onclick = () => {
  currentUser = { name: 'Google Member', email: 'user@gmail.com', phone: '+91 98765 43210' };
  localStorage.setItem('goorganic-user', JSON.stringify(currentUser));
  updateUserHeader();
  toast('Signed in via Google! Entering organic store…');
  renderCategories();
  renderProducts();
  setTimeout(() => enterShopApp('#home'), 350);
};

// Logout handler
function logoutUser() {
  currentUser = null;
  localStorage.removeItem('goorganic-user');
  closeWishlist();
  closeCart();
  updateUserHeader();
  renderCategories();
  renderProducts();
  toast('Signed out successfully');
  location.hash = '#home';
}

function updateUserHeader() {
  let loginBtn = $('#loginNavBtn');
  if (loginBtn) {
    if (currentUser) {
      const safeName = esc(currentUser.name.split(' ')[0]);
      loginBtn.innerHTML = `👤 ${safeName} <span>↗</span>`;
      loginBtn.setAttribute('href', 'home.html#home');
      loginBtn.title = 'Open shopping home';
      loginBtn.onclick = e => {
        e.preventDefault();
        enterShopApp('#home');
      };
    } else {
      loginBtn.innerHTML = `Login <span>↗</span>`;
      loginBtn.setAttribute('href', '#login');
      loginBtn.title = 'Login';
      loginBtn.onclick = null;
    }
  }

  const featuredCta = $('#featuredShopCta');
  if (featuredCta) {
    if (currentUser) {
      featuredCta.setAttribute('href', 'home.html#shop');
      featuredCta.innerHTML = 'Enter the store <span>↗</span>';
      featuredCta.onclick = e => {
        e.preventDefault();
        enterShopApp('#shop');
      };
    } else {
      featuredCta.setAttribute('href', '#login');
      featuredCta.innerHTML = 'Login to view all products <span>↗</span>';
      featuredCta.onclick = null;
    }
  }
}

let logoutBtn = $('#logoutBtn');
if (logoutBtn) logoutBtn.onclick = logoutUser;

// Search & filter
let prodSearch = $('#productSearch');
if (prodSearch) prodSearch.oninput = renderShop;
let catFilter = $('#categoryFilter');
if (catFilter) catFilter.onchange = renderShop;

// Newsletter
$('#newsletterForm').onsubmit = e => {
  e.preventDefault();
  toast('Thank you for subscribing! Seasonal harvest news will arrive in your inbox.');
  e.target.reset();
};

// Testimonial Carousel logic
(function initTestimonials() {
  const slides = document.querySelectorAll('.testimonial-slide');
  const prevBtn = document.getElementById('testimonialPrev');
  const nextBtn = document.getElementById('testimonialNext');
  const carousel = document.getElementById('testimonialCarousel');

  if (!slides.length) return;

  let currentIdx = 0;
  let autoTimer = null;

  function showSlide(index) {
    slides.forEach((s, idx) => {
      s.classList.toggle('active', idx === index);
    });
    currentIdx = index;
  }

  function nextSlide() {
    let nextIdx = (currentIdx + 1) % slides.length;
    showSlide(nextIdx);
  }

  function prevSlide() {
    let prevIdx = (currentIdx - 1 + slides.length) % slides.length;
    showSlide(prevIdx);
  }

  if (prevBtn) prevBtn.addEventListener('click', () => {
    prevSlide();
    resetAuto();
  });

  if (nextBtn) nextBtn.addEventListener('click', () => {
    nextSlide();
    resetAuto();
  });

  // Touch and drag swipe support
  let startX = 0;
  let isDragging = false;

  if (carousel) {
    carousel.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      startX = e.clientX;
      isDragging = true;
    });

    carousel.addEventListener('mouseup', e => {
      if (!isDragging) return;
      let diff = e.clientX - startX;
      if (diff < -40) {
        nextSlide();
        resetAuto();
      } else if (diff > 40) {
        prevSlide();
        resetAuto();
      }
      isDragging = false;
    });

    carousel.addEventListener('mouseleave', () => {
      isDragging = false;
    });

    carousel.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', e => {
      let diff = e.changedTouches[0].clientX - startX;
      if (diff < -40) {
        nextSlide();
        resetAuto();
      } else if (diff > 40) {
        prevSlide();
        resetAuto();
      }
    }, { passive: true });
  }

  function startAuto() {
    autoTimer = setInterval(nextSlide, 7000);
  }

  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  startAuto();
})();

updateUserHeader();
window.addEventListener('hashchange', route);
route();

// Admin Campaign Banner slot
window.GOORGANIC_CONFIG = window.GOORGANIC_CONFIG || { campaign: null };
if (window.GOORGANIC_CONFIG.campaign?.active) {
  let c = window.GOORGANIC_CONFIG.campaign;
  $('#campaignSection').hidden = false;
  $('#campaignTitle').textContent = c.title || 'A season of good things.';
  $('#campaignText').textContent = c.description || '';
  if (c.image) $('.campaign-image').style.backgroundImage = `url("${c.image}")`;
}
