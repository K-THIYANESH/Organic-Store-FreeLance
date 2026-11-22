/**
 * shop-data.js
 * GoOrganic — Post-login shopping experience data & app state
 *
 * Sections:
 *   1. GOORGANIC_CATEGORIES  — 13 category definitions
 *   2. GOORGANIC_PRODUCTS    — 22+ product definitions
 *   3. DEMO_ORDERS           — 5 mock order history records
 *   4. ToastSystem           — singleton toast notifications
 *   5. ShopApp               — central app-state namespace
 */

'use strict';

/* ============================================================
   1. CATEGORIES
   ============================================================ */

const GOORGANIC_CATEGORIES = [
  {
    id: 'whole-grains',
    name: 'Whole Grains',
    desc: 'Ancient grains & everyday staples',
    img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=85',
    color: '#8B7355'
  },
  {
    id: 'sugar-sweeteners',
    name: 'Sugar & Sweeteners',
    desc: 'Honey and natural sweetening',
    img: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=700&q=85',
    color: '#C89B4B'
  },
  {
    id: 'spices-masala',
    name: 'Spices & Masala',
    desc: 'Aromatic essentials, full of character',
    img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=700&q=85',
    color: '#C4714A'
  },
  {
    id: 'skincare',
    name: 'Skin Care',
    desc: 'Gentle care inspired by nature',
    img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=85',
    color: '#9B8B76'
  },
  {
    id: 'seeds',
    name: 'Seeds',
    desc: 'Small beginnings, nourishing goodness',
    img: 'https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?auto=format&fit=crop&w=700&q=85',
    color: '#6C8C53'
  },
  {
    id: 'salt',
    name: 'Salt',
    desc: 'Simple essentials for your kitchen',
    img: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442d?auto=format&fit=crop&w=700&q=85',
    color: '#8BAEC0'
  },
  {
    id: 'refreshments',
    name: 'Refreshments',
    desc: 'A refreshing pause in your day',
    img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=700&q=85',
    color: '#6C9E8C'
  },
  {
    id: 'pulses',
    name: 'Pulses',
    desc: 'Protein-rich pantry favourites',
    img: 'https://images.unsplash.com/photo-1515543904379-3d757bbe4e7e?auto=format&fit=crop&w=700&q=85',
    color: '#B5956A'
  },
  {
    id: 'pottery',
    name: 'Pottery',
    desc: 'Handcrafted pieces for mindful living',
    img: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=85',
    color: '#C47B5A'
  },
  {
    id: 'papads',
    name: 'Papads',
    desc: 'Traditional accompaniments',
    img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=85',
    color: '#B8A07A'
  },
  {
    id: 'palm-products',
    name: 'Palm Products',
    desc: 'A taste of traditional goodness',
    img: 'https://images.unsplash.com/photo-1604495772376-9657f0035eb5?auto=format&fit=crop&w=700&q=85',
    color: '#8B9B4B'
  },
  {
    id: 'organic-soaps',
    name: 'Organic Soaps',
    desc: 'Everyday cleansing, thoughtfully made',
    img: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=700&q=85',
    color: '#7B9B8B'
  },
  {
    id: 'oils',
    name: 'Oils',
    desc: 'Traditional oils for kitchen & care',
    img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=85',
    color: '#B8942A'
  }
];

/* ============================================================
   2. PRODUCTS
   ============================================================ */

const GOORGANIC_PRODUCTS = [

  /* ——— Sugar & Sweeteners ——— */
  {
    id: 'wildflower-honey-500g',
    name: 'Wildflower Honey',
    categoryId: 'sugar-sweeteners',
    categoryName: 'Sugar & Sweeteners',
    price: 385,
    originalPrice: null,
    unit: '500 g',
    tag: 'STORE FAVOURITE',
    img: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=700&q=85',
    desc: 'Harvested from wildflower meadows by traditional beekeepers, this raw honey retains all its natural enzymes and antioxidants. Its complex floral sweetness makes it perfect for drizzling over fruit, yoghurt, or warm rotis. Unprocessed, unfiltered, and completely natural.',
    inStock: true,
    isNew: false,
    isFeatured: true,
    isBestseller: true,
    isTraditional: false
  },
  {
    id: 'karupatti-palm-jaggery-500g',
    name: 'Karupatti Palm Jaggery',
    categoryId: 'sugar-sweeteners',
    categoryName: 'Sugar & Sweeteners',
    price: 220,
    originalPrice: null,
    unit: '500 g',
    tag: 'TRADITIONAL',
    img: 'https://images.unsplash.com/photo-1604495772376-9657f0035eb5?auto=format&fit=crop&w=700&q=85',
    desc: 'Karupatti is unrefined palm jaggery hand-made from Palmyra palm sap using age-old methods in Tamil Nadu. Rich in iron, calcium, and minerals, it imparts a deep caramel-molasses flavour to sweets, coffee, and porridge. A wholesome alternative to refined sugar.',
    inStock: true,
    isNew: false,
    isFeatured: false,
    isBestseller: true,
    isTraditional: true
  },

  /* ——— Whole Grains ——— */
  {
    id: 'traditional-millet-mix-500g',
    name: 'Traditional Millet Mix',
    categoryId: 'whole-grains',
    categoryName: 'Whole Grains',
    price: 180,
    originalPrice: null,
    unit: '500 g',
    tag: 'TRADITIONAL',
    img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=700&q=85',
    desc: 'A nourishing blend of finger millet (ragi), pearl millet (bajra), foxtail millet, and little millet, stone-ground together to retain their bran and germ. High in dietary fibre and slow-release energy, this mix makes excellent rotis, porridge, or malt drinks. Grown organically in the Deccan plateau.',
    inStock: true,
    isNew: false,
    isFeatured: false,
    isBestseller: false,
    isTraditional: true
  },
  {
    id: 'bamboo-rice-500g',
    name: 'Bamboo Rice',
    categoryId: 'whole-grains',
    categoryName: 'Whole Grains',
    price: 340,
    originalPrice: 380,
    unit: '500 g',
    tag: 'RARE FIND',
    img: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b915?auto=format&fit=crop&w=700&q=85',
    desc: 'Bamboo rice is the seed of flowering bamboo, harvested once in decades from the forests of Kerala and the Western Ghats. With a mild, grassy sweetness and a dense nutritional profile, it has been treasured by forest-dwelling communities for centuries. Cook as you would regular rice for a truly unique dining experience.',
    inStock: true,
    isNew: false,
    isFeatured: true,
    isBestseller: false,
    isTraditional: true
  },

  /* ——— Spices & Masala ——— */
  {
    id: 'heritage-spice-blend-100g',
    name: 'Heritage Spice Blend',
    categoryId: 'spices-masala',
    categoryName: 'Spices & Masala',
    price: 145,
    originalPrice: null,
    unit: '100 g',
    tag: 'STORE FAVOURITE',
    img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=700&q=85',
    desc: 'A carefully balanced masala blended to a generations-old family recipe — coriander, cumin, dried chilli, pepper, cardamom, and clove, all slow-roasted and ground on a stone. It layers depth and warmth into curries, dals, and marinades without overpowering them. Free of additives, anti-caking agents, and artificial colour.',
    inStock: true,
    isNew: false,
    isFeatured: true,
    isBestseller: false,
    isTraditional: false
  },
  {
    id: 'turmeric-powder-100g',
    name: 'Turmeric Powder',
    categoryId: 'spices-masala',
    categoryName: 'Spices & Masala',
    price: 120,
    originalPrice: null,
    unit: '100 g',
    tag: 'TRADITIONAL',
    img: 'https://images.unsplash.com/photo-1615485500704-8e3b5a3ef738?auto=format&fit=crop&w=700&q=85',
    desc: 'Single-origin Erode turmeric, prized for its high curcumin content and vivid golden colour, dried in shade and ground fresh to order. Used in Indian households for centuries as a spice, antiseptic, and wellness supplement. Stir into warm milk, curries, or rice for vibrant colour and earthy warmth.',
    inStock: true,
    isNew: false,
    isFeatured: false,
    isBestseller: false,
    isTraditional: true
  },

  /* ——— Oils ——— */
  {
    id: 'cold-pressed-sesame-oil-500ml',
    name: 'Cold-Pressed Sesame Oil',
    categoryId: 'oils',
    categoryName: 'Oils',
    price: 320,
    originalPrice: null,
    unit: '500 ml',
    tag: 'STORE FAVOURITE',
    img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=85',
    desc: 'Extracted from toasted sesame seeds using a wooden marachekku (cold press) that keeps temperatures below 40 °C, preserving the oil\'s natural antioxidants and rich nutty aroma. A South Indian kitchen essential for tempering, frying, and seasoning. Also valued in Ayurvedic oil-pulling and massage.',
    inStock: true,
    isNew: false,
    isFeatured: false,
    isBestseller: true,
    isTraditional: true
  },
  {
    id: 'coconut-oil-cold-pressed-500ml',
    name: 'Coconut Oil Cold Pressed',
    categoryId: 'oils',
    categoryName: 'Oils',
    price: 290,
    originalPrice: null,
    unit: '500 ml',
    tag: 'BESTSELLER',
    img: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=700&q=85',
    desc: 'Virgin coconut oil extracted without heat from freshly grated Kerala coconut meat, retaining its natural lauric acid, mild coconut fragrance, and medium-chain fatty acids. Ideal for cooking at medium heat, as a hair mask, skin moisturiser, or dairy-free butter substitute. Naturally solid below 24 °C.',
    inStock: true,
    isNew: false,
    isFeatured: false,
    isBestseller: true,
    isTraditional: false
  },
  {
    id: 'peanut-oil-wood-pressed-500ml',
    name: 'Peanut Oil Wood Pressed',
    categoryId: 'oils',
    categoryName: 'Oils',
    price: 275,
    originalPrice: null,
    unit: '500 ml',
    tag: 'TRADITIONAL',
    img: 'https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&w=700&q=85',
    desc: 'Made from organically grown groundnuts pressed in a traditional bullock-driven wooden ghani, this golden oil has a pleasantly nutty flavour and high smoke point, making it excellent for deep-frying and sautéing. It is rich in monounsaturated fats and vitamin E. Zero chemicals, zero hexane extraction.',
    inStock: true,
    isNew: false,
    isFeatured: false,
    isBestseller: false,
    isTraditional: true
  },

  /* ——— Pulses ——— */
  {
    id: 'native-green-gram-500g',
    name: 'Native Green Gram',
    categoryId: 'pulses',
    categoryName: 'Pulses',
    price: 125,
    originalPrice: null,
    unit: '500 g',
    tag: 'STORE FAVOURITE',
    img: 'https://images.unsplash.com/photo-1515543904379-3d757bbe4e7e?auto=format&fit=crop&w=700&q=85',
    desc: 'Whole green moong sourced directly from small organic farms in Rajasthan where it grows with minimal water. Mildly sweet, easy to digest, and rich in plant protein, iron, and folate — it is a staple in dals, sprouts, and payasam. No pesticides, no post-harvest chemical treatment.',
    inStock: true,
    isNew: false,
    isFeatured: true,
    isBestseller: false,
    isTraditional: false
  },
  {
    id: 'urad-dal-black-500g',
    name: 'Urad Dal Black',
    categoryId: 'pulses',
    categoryName: 'Pulses',
    price: 155,
    originalPrice: null,
    unit: '500 g',
    tag: 'STORE FAVOURITE',
    img: 'https://images.unsplash.com/photo-1573246123716-6b1782bfc499?auto=format&fit=crop&w=700&q=85',
    desc: 'Whole black urad (sabut urad) is the backbone of dal makhani and idli batter, delivering a creamy richness and dense protein that split varieties cannot match. Grown organically in Madhya Pradesh, sun-dried, and packed without sorting chemicals. Soak overnight for best results in slow-cooked dals.',
    inStock: true,
    isNew: false,
    isFeatured: true,
    isBestseller: false,
    isTraditional: false
  },

  /* ——— Organic Soaps ——— */
  {
    id: 'herbal-bath-soap-100g',
    name: 'Herbal Bath Soap',
    categoryId: 'organic-soaps',
    categoryName: 'Organic Soaps',
    price: 95,
    originalPrice: null,
    unit: '100 g',
    tag: 'NEW ARRIVAL',
    img: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?auto=format&fit=crop&w=700&q=85',
    desc: 'Cold-process soap bar made with a base of coconut oil, castor oil, and shea butter infused with dried neem leaf, tulsi, and vetiver root. Lathers gently, leaving skin soft and lightly scented. Palm-oil free, sulphate-free, and completely biodegradable.',
    inStock: true,
    isNew: true,
    isFeatured: false,
    isBestseller: false,
    isTraditional: false
  },
  {
    id: 'neem-handmade-soap-100g',
    name: 'Neem Handmade Soap',
    categoryId: 'organic-soaps',
    categoryName: 'Organic Soaps',
    price: 85,
    originalPrice: null,
    unit: '100 g',
    tag: 'STORE FAVOURITE',
    img: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=700&q=85',
    desc: 'Handmade in small batches with pure neem leaf extract and neem seed oil, this soap has natural antibacterial and antifungal properties valued in Ayurveda for thousands of years. Suitable for acne-prone and oily skin. The mildly earthy, medicinal scent is authentic and unmasked by synthetic fragrance.',
    inStock: true,
    isNew: false,
    isFeatured: true,
    isBestseller: false,
    isTraditional: false
  },

  /* ——— Papads ——— */
  {
    id: 'traditional-rice-papad-200g',
    name: 'Traditional Rice Papad',
    categoryId: 'papads',
    categoryName: 'Papads',
    price: 110,
    originalPrice: null,
    unit: '200 g',
    tag: 'TRADITIONAL',
    img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=85',
    desc: 'Sun-dried rice papads made using whole-grain parboiled rice batter seasoned with black pepper, cumin, and rock salt — just as they have been made in Tamil Nadu villages for generations. Light and crispy when fried or roasted, they pair beautifully with rice and sambar. No preservatives or artificial flavours.',
    inStock: true,
    isNew: false,
    isFeatured: false,
    isBestseller: false,
    isTraditional: true
  },
  {
    id: 'sundakkai-vathal-100g',
    name: 'Sundakkai Vathal',
    categoryId: 'papads',
    categoryName: 'Papads',
    price: 130,
    originalPrice: null,
    unit: '100 g',
    tag: 'TRADITIONAL',
    img: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=700&q=85',
    desc: 'Sundakkai (Turkey berry) sun-dried in buttermilk brine is a beloved South Indian kitchen staple, added to sambar, kuzhambu, and stir-fries for a pleasantly bitter depth of flavour. Traditionally used as a digestive and liver tonic in Siddha medicine. Sourced from family farms in Tirunelveli.',
    inStock: true,
    isNew: false,
    isFeatured: false,
    isBestseller: false,
    isTraditional: true
  },

  /* ——— Pottery ——— */
  {
    id: 'handcrafted-clay-cup',
    name: 'Handcrafted Clay Cup',
    categoryId: 'pottery',
    categoryName: 'Pottery',
    price: 240,
    originalPrice: null,
    unit: '1 piece',
    tag: 'NEW ARRIVAL',
    img: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=700&q=85',
    desc: 'Wheel-thrown from local terracotta clay and fired in a wood-kiln by artisans in Rajasthan\'s Khurja pottery hub, this rustic cup keeps beverages naturally cool and imparts a subtle earthy flavour. Each cup is unique in texture and finish. Food-safe, unglazed on the interior, and lead-free.',
    inStock: true,
    isNew: true,
    isFeatured: false,
    isBestseller: false,
    isTraditional: false
  },
  {
    id: 'terracotta-water-pot',
    name: 'Terracotta Water Pot',
    categoryId: 'pottery',
    categoryName: 'Pottery',
    price: 580,
    originalPrice: null,
    unit: '1 piece',
    tag: 'TRADITIONAL',
    img: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=700&q=85',
    desc: 'A large, hand-shaped terracotta pot for storing and naturally cooling drinking water — the original refrigerator of Indian homes. The porous clay walls allow slow evaporation that cools water by 4–8 °C without any electricity. Crafted by fourth-generation potters in Bikaner, each pot is a functional piece of living heritage.',
    inStock: true,
    isNew: false,
    isFeatured: false,
    isBestseller: false,
    isTraditional: true
  },

  /* ——— Seeds ——— */
  {
    id: 'black-sesame-seeds-250g',
    name: 'Black Sesame Seeds',
    categoryId: 'seeds',
    categoryName: 'Seeds',
    price: 160,
    originalPrice: null,
    unit: '250 g',
    tag: 'STORE FAVOURITE',
    img: 'https://images.unsplash.com/photo-1501436513145-30f24e19fcc4?auto=format&fit=crop&w=700&q=85',
    desc: 'Hulled black sesame seeds sourced from certified organic farms in Gujarat, prized in Ayurveda for their warming quality and rich supply of calcium, magnesium, and zinc. Sprinkle on salads and rice bowls, blend into chutneys, or use in traditional til ladoos and chikkis. A richer, more complex flavour than white sesame.',
    inStock: true,
    isNew: false,
    isFeatured: true,
    isBestseller: false,
    isTraditional: false
  },

  /* ——— Salt ——— */
  {
    id: 'rock-salt-1kg',
    name: 'Rock Salt',
    categoryId: 'salt',
    categoryName: 'Salt',
    price: 85,
    originalPrice: null,
    unit: '1 kg',
    tag: 'STORE FAVOURITE',
    img: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442d?auto=format&fit=crop&w=700&q=85',
    desc: 'Unrefined Himalayan rock salt (Sendha Namak) mined from ancient sea-bed deposits in Pakistan\'s Punjab region and hand-ground in India. Free from anti-caking agents and contains over 80 natural trace minerals. Milder and less bitter than iodised table salt — widely used in Ayurvedic cooking and fasting diets.',
    inStock: true,
    isNew: false,
    isFeatured: true,
    isBestseller: false,
    isTraditional: false
  },

  /* ——— Refreshments ——— */
  {
    id: 'nannari-sherbet-500ml',
    name: 'Nannari Sherbet Concentrate',
    categoryId: 'refreshments',
    categoryName: 'Refreshments',
    price: 195,
    originalPrice: null,
    unit: '500 ml',
    tag: 'NEW ARRIVAL',
    img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=700&q=85',
    desc: 'Nannari (Indian Sarsaparilla) root concentrate sweetened with palm sugar — a traditional South Indian summer cooler that cools the body from within according to Siddha medicine. Mix 1 part concentrate with 5 parts cold water or milk. No artificial flavours, no synthetic colour. Each bottle yields about 10 drinks.',
    inStock: true,
    isNew: true,
    isFeatured: false,
    isBestseller: false,
    isTraditional: false
  },

  /* ——— Skin Care ——— */
  {
    id: 'moringa-leaf-powder-100g',
    name: 'Moringa Leaf Powder',
    categoryId: 'skincare',
    categoryName: 'Skin Care',
    price: 185,
    originalPrice: null,
    unit: '100 g',
    tag: 'NEW ARRIVAL',
    img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=85',
    desc: 'Shade-dried and finely milled Moringa oleifera leaves from organic farms in Tamil Nadu, retaining their bright green colour and potent nutritional profile — high in vitamins A, C, E, and iron. Mix into face packs with honey for a brightening mask, or blend into smoothies and water. 100% single ingredient, no fillers.',
    inStock: true,
    isNew: true,
    isFeatured: false,
    isBestseller: false,
    isTraditional: false
  },
  {
    id: 'rose-water-mist-100ml',
    name: 'Rose Water Mist',
    categoryId: 'skincare',
    categoryName: 'Skin Care',
    price: 140,
    originalPrice: 165,
    unit: '100 ml',
    tag: 'NEW ARRIVAL',
    img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=700&q=85',
    desc: 'Steam-distilled from Damask roses grown in the organic rose farms of Pushkar, Rajasthan, this pure rose hydrosol is the gentlest toner for all skin types. Mist over your face to set makeup, calm redness, and restore the skin\'s natural pH balance. Contains no alcohol, no synthetic fragrance, and no preservatives.',
    inStock: true,
    isNew: true,
    isFeatured: true,
    isBestseller: false,
    isTraditional: false
  },

  /* ——— Palm Products ——— */
  {
    id: 'palm-sugar-powder-500g',
    name: 'Palm Sugar Powder',
    categoryId: 'palm-products',
    categoryName: 'Palm Products',
    price: 165,
    originalPrice: null,
    unit: '500 g',
    tag: 'TRADITIONAL',
    img: 'https://images.unsplash.com/photo-1604495772376-9657f0035eb5?auto=format&fit=crop&w=700&q=85',
    desc: 'Fine powder made from dehydrated Palmyra palm sap tapped by trained toddy-tapping families in coastal Tamil Nadu. It dissolves instantly in beverages and baking mixes, adding a mild caramel note with a lower glycaemic index than refined sugar. Rich in potassium, iron, and B-vitamins.',
    inStock: true,
    isNew: false,
    isFeatured: false,
    isBestseller: false,
    isTraditional: true
  }
];

/* ============================================================
   3. DEMO ORDER HISTORY
   ============================================================ */

const DEMO_ORDERS = [
  {
    id: 'GO-20241105',
    date: '2024-11-05',
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    items: [
      { productId: 'wildflower-honey-500g',       qty: 2, price: 385 },
      { productId: 'cold-pressed-sesame-oil-500ml', qty: 1, price: 320 },
      { productId: 'rock-salt-1kg',               qty: 1, price: 85  }
    ],
    total: 1175,
    deliveryAddress: '14, Anna Nagar 3rd Street, Chennai, Tamil Nadu 600040'
  },
  {
    id: 'GO-20241118',
    date: '2024-11-18',
    status: 'Processing',
    paymentStatus: 'Paid',
    paymentMethod: 'Net Banking',
    items: [
      { productId: 'bamboo-rice-500g',             qty: 1, price: 340 },
      { productId: 'turmeric-powder-100g',         qty: 2, price: 120 },
      { productId: 'nannari-sherbet-500ml',        qty: 1, price: 195 }
    ],
    total: 775,
    deliveryAddress: '14, Anna Nagar 3rd Street, Chennai, Tamil Nadu 600040'
  },
  {
    id: 'GO-20241121',
    date: '2024-11-21',
    status: 'Out for Delivery',
    paymentStatus: 'Paid',
    paymentMethod: 'Credit Card',
    items: [
      { productId: 'herbal-bath-soap-100g',        qty: 3, price: 95  },
      { productId: 'rose-water-mist-100ml',        qty: 1, price: 140 },
      { productId: 'moringa-leaf-powder-100g',     qty: 1, price: 185 }
    ],
    total: 610,
    deliveryAddress: '7B, Velachery Main Road, Chennai, Tamil Nadu 600042'
  },
  {
    id: 'GO-20241027',
    date: '2024-10-27',
    status: 'Cancelled',
    paymentStatus: 'Refunded',
    paymentMethod: 'UPI',
    items: [
      { productId: 'terracotta-water-pot',         qty: 1, price: 580 },
      { productId: 'handcrafted-clay-cup',         qty: 2, price: 240 }
    ],
    total: 1060,
    deliveryAddress: '14, Anna Nagar 3rd Street, Chennai, Tamil Nadu 600040'
  },
  {
    id: 'GO-20241123',
    date: '2024-11-23',
    status: 'Pending',
    paymentStatus: 'Awaiting Payment',
    paymentMethod: 'COD',
    items: [
      { productId: 'karupatti-palm-jaggery-500g',  qty: 2, price: 220 },
      { productId: 'traditional-millet-mix-500g',  qty: 1, price: 180 },
      { productId: 'sundakkai-vathal-100g',        qty: 1, price: 130 }
    ],
    total: 750,
    deliveryAddress: '14, Anna Nagar 3rd Street, Chennai, Tamil Nadu 600040'
  }
];

/* ============================================================
   4. TOAST SYSTEM
   Singleton that manages a single toast notification element.
   ============================================================ */

const ToastSystem = (() => {
  let _el = null;        // cached DOM reference
  let _hideTimer = null; // pending auto-hide timer

  /** Lazily create (or retrieve) the toast element in the DOM. */
  function _ensureElement() {
    if (_el) return _el;
    _el = document.createElement('div');
    _el.id = 'go-toast';
    _el.className = 'toast-notification';
    _el.setAttribute('role', 'status');
    _el.setAttribute('aria-live', 'polite');
    document.body.appendChild(_el);
    return _el;
  }

  /**
   * Show a toast message.
   * @param {string} msg   - The message text to display.
   * @param {string} type  - 'success' | 'error' | 'info'  (default: 'success')
   * @param {number} duration - Auto-hide delay in ms (default: 3000)
   */
  function show(msg, type = 'success', duration = 3000) {
    const el = _ensureElement();

    // Reset state
    clearTimeout(_hideTimer);
    el.className = `toast-notification toast--${type} toast--visible`;
    el.textContent = msg;

    // Auto-hide after `duration` ms
    _hideTimer = setTimeout(() => hide(), duration);
  }

  /** Hide the toast immediately. */
  function hide() {
    if (!_el) return;
    _el.classList.remove('toast--visible');
  }

  return { show, hide };
})();

/* ============================================================
   5. SHOP APP  —  Central application state & helpers
   ============================================================ */

const ShopApp = {

  /* ── State ─────────────────────────────────────────── */

  /** Logged-in user object (populated from sessionStorage on init). */
  currentUser: null,

  /**
   * Shopping cart.
   * Shape: { [productId]: quantity }
   */
  cart: {},

  /**
   * Wishlist.
   * Shape: [productId, ...]
   */
  wishlist: [],

  /** Active filter / sort state used by getFilteredProducts(). */
  filters: {
    categories: [],     // array of categoryId strings; empty = all
    priceMin: 0,
    priceMax: 2000,
    sort: 'default',    // 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'newest' | 'new'
    view: 'grid',       // 'grid' | 'list'
    search: '',         // free-text search query
    inStock: false,
    discounted: false,
    isNew: false,
    traditional: false
  },

  /** Currently visible SPA view id. */
  activeView: 'home',

  /* ── Initialisation ─────────────────────────────────── */

  /**
   * Bootstrap the app:
   *   1. Restore currentUser from sessionStorage.
   *   2. Load persisted cart & wishlist from localStorage.
   *   3. Sync UI counters.
   */
  init() {
    // Restore logged-in user (shared key with index.html auth)
    try {
      const raw = localStorage.getItem('goorganic-user');
      this.currentUser = raw ? JSON.parse(raw) : null;
    } catch (e) {
      this.currentUser = null;
    }

    // Restore cart (migrate legacy underscore key if present)
    try {
      const rawCart =
        localStorage.getItem('goorganic-cart') ||
        localStorage.getItem('goorganic_cart');
      this.cart = rawCart ? JSON.parse(rawCart) : {};
    } catch (e) {
      this.cart = {};
    }

    // Restore wishlist
    try {
      const rawWish =
        localStorage.getItem('goorganic-wishlist') ||
        localStorage.getItem('goorganic_wishlist');
      this.wishlist = rawWish ? JSON.parse(rawWish) : [];
    } catch (e) {
      this.wishlist = [];
    }

    this._syncCounters();
    this._updateWishlistUI();
    console.log('[GoOrganic] ShopApp initialised.', this.currentUser);
  },

  /* ── Persistence ────────────────────────────────────── */

  /** Persist cart to localStorage and refresh UI badge. */
  saveCart() {
    try {
      localStorage.setItem('goorganic-cart', JSON.stringify(this.cart));
      localStorage.removeItem('goorganic_cart');
    } catch (e) {
      console.warn('[GoOrganic] Could not save cart.', e);
    }
    this._syncCounters();
  },

  /** Persist wishlist to localStorage and refresh UI indicator. */
  saveWishlist() {
    try {
      localStorage.setItem('goorganic-wishlist', JSON.stringify(this.wishlist));
      localStorage.removeItem('goorganic_wishlist');
    } catch (e) {
      console.warn('[GoOrganic] Could not save wishlist.', e);
    }
    this._updateWishlistUI();
  },

  /* ── Cart actions ───────────────────────────────────── */

  /**
   * Add a product to the cart (or increase its quantity).
   * @param {string} productId
   * @param {number} qty - units to add (default 1)
   */
  addToCart(productId, qty = 1) {
    if (!productId || qty < 1) return;

    this.cart[productId] = (this.cart[productId] || 0) + qty;
    this.saveCart();

    const product = this._findProduct(productId);
    const name = product ? product.name : 'Item';
    this.toast(`${name} added to cart`, 'success');
  },

  /**
   * Remove a product from the cart entirely.
   * @param {string} productId
   */
  removeFromCart(productId) {
    if (!this.cart[productId]) return;
    delete this.cart[productId];
    this.saveCart();

    const product = this._findProduct(productId);
    const name = product ? product.name : 'Item';
    this.toast(`${name} removed from cart`, 'info');
  },

  /**
   * Set the quantity of a cart item directly.
   * Removes the item if qty ≤ 0.
   * @param {string} productId
   * @param {number} qty
   */
  updateQty(productId, qty) {
    if (qty <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.cart[productId] = qty;
    this.saveCart();
  },

  /* ── Wishlist actions ───────────────────────────────── */

  /**
   * Toggle a product in/out of the wishlist.
   * @param {string} productId
   * @returns {boolean} true if the product is now in the wishlist
   */
  toggleWishlist(productId) {
    const idx = this.wishlist.indexOf(productId);
    if (idx === -1) {
      this.wishlist.push(productId);
      this.saveWishlist();
      const product = this._findProduct(productId);
      this.toast(`${product ? product.name : 'Item'} added to wishlist ♥`, 'success');
      return true;
    } else {
      this.wishlist.splice(idx, 1);
      this.saveWishlist();
      const product = this._findProduct(productId);
      this.toast(`${product ? product.name : 'Item'} removed from wishlist`, 'info');
      return false;
    }
  },

  /**
   * Check if a product is in the wishlist.
   * @param {string} productId
   * @returns {boolean}
   */
  isInWishlist(productId) {
    return this.wishlist.includes(productId);
  },

  /* ── Cart totals ────────────────────────────────────── */

  /**
   * Total number of units across all cart items.
   * @returns {number}
   */
  getCartCount() {
    return Object.values(this.cart).reduce((sum, qty) => sum + qty, 0);
  },

  /**
   * Total monetary value of the cart in INR.
   * @returns {number}
   */
  getCartTotal() {
    return Object.entries(this.cart).reduce((sum, [id, qty]) => {
      const product = this._findProduct(id);
      return sum + (product ? product.price * qty : 0);
    }, 0);
  },

  /* ── Filtering & search ─────────────────────────────── */

  /**
   * Return a filtered & sorted slice of GOORGANIC_PRODUCTS
   * according to the current this.filters state.
   * @returns {Array}
   */
  getFilteredProducts() {
    let results = [...GOORGANIC_PRODUCTS];
    const f = this.filters;

    // Category filter
    if (f.categories && f.categories.length > 0) {
      results = results.filter(p => f.categories.includes(p.categoryId));
    }

    // Price range filter
    results = results.filter(p => p.price >= f.priceMin && p.price <= f.priceMax);

    // Free-text search (name, categoryName, desc, tag)
    if (f.search && f.search.trim() !== '') {
      const q = f.search.trim().toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        (p.tag || '').toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q)
      );
    }

    if (f.inStock) results = results.filter(p => p.inStock !== false);
    if (f.discounted) results = results.filter(p => p.originalPrice && p.originalPrice > p.price);
    if (f.isNew) results = results.filter(p => p.isNew);
    if (f.traditional) results = results.filter(p => p.isTraditional);

    // Sorting
    switch (f.sort) {
      case 'price-asc':
        results.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        results.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      case 'new':
        results = results.filter(p => p.isNew).concat(results.filter(p => !p.isNew));
        break;
      default:
        results.sort((a, b) => {
          const scoreA = (a.isFeatured ? 2 : 0) + (a.isBestseller ? 1 : 0);
          const scoreB = (b.isFeatured ? 2 : 0) + (b.isBestseller ? 1 : 0);
          return scoreB - scoreA;
        });
    }

    return results;
  },

  /* ── Navigation ─────────────────────────────────────── */

  /**
   * Switch the visible SPA view.
   * Hides all `.view` elements and shows the one with id="view-{viewName}".
   * Also updates nav active states.
   * @param {string} viewName  e.g. 'home', 'shop', 'cart', 'wishlist', 'history', 'help', 'track', 'profile'
   */
  navigate(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));

    // Show target view
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('active');
    } else {
      console.warn(`[GoOrganic] View not found: view-${viewName}`);
    }

    // Update nav active state
    document.querySelectorAll('[data-nav]').forEach(link => {
      link.classList.toggle('active', link.dataset.nav === viewName);
    });

    this.activeView = viewName;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /* ── Auth ───────────────────────────────────────────── */

  /**
   * Log the user out:
   *   1. Remove user from sessionStorage.
   *   2. Clear in-memory state.
   *   3. Redirect to login page.
   */
  logout() {
    localStorage.removeItem('goorganic-user');
    sessionStorage.removeItem('goorganic_user');
    this.currentUser = null;
    this.toast('You have been signed out. See you soon!', 'info');
    setTimeout(() => {
      window.location.href = 'index.html#login';
    }, 800);
  },

  /* ── Formatting helpers ─────────────────────────────── */

  /**
   * Format a number as an Indian-locale currency string.
   * @param {number} n
   * @returns {string}  e.g. '₹1,23,456'
   */
  money(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  },

  /**
   * Display a toast notification.
   * Delegates to the ToastSystem singleton.
   * @param {string} msg
   * @param {string} type  - 'success' | 'error' | 'info'
   */
  toast(msg, type = 'success') {
    ToastSystem.show(msg, type);
  },

  /* ── Private helpers ────────────────────────────────── */

  /**
   * Look up a product by id in GOORGANIC_PRODUCTS.
   * @param {string} id
   * @returns {Object|undefined}
   */
  _findProduct(id) {
    return GOORGANIC_PRODUCTS.find(p => p.id === id);
  },

  /**
   * Sync all cart-count badges in the page.
   * Looks for elements with [data-cart-count] attribute.
   */
  _syncCounters() {
    const count = this.getCartCount();
    document.querySelectorAll('[data-cart-count], #cartCountBadge, .cart-count-badge').forEach(el => {
      el.textContent = count;
      // Hide badge for ALL badge elements when count is 0
      el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  },

  /**
   * Update all wishlist-heart icons to reflect current wishlist state.
   * Looks for elements with [data-wishlist-btn] / [data-wish-id] attributes.
   */
  _updateWishlistUI() {
    document.querySelectorAll('[data-wishlist-btn]').forEach(btn => {
      const id = btn.dataset.wishlistBtn;
      btn.classList.toggle('is-wishlisted', this.isInWishlist(id));
      btn.classList.toggle('active', this.isInWishlist(id));
      btn.setAttribute('aria-pressed', this.isInWishlist(id));
    });

    document.querySelectorAll('[data-wish-id]').forEach(btn => {
      const id = btn.dataset.wishId;
      btn.classList.toggle('wishlisted', this.isInWishlist(id));
      btn.classList.toggle('active', this.isInWishlist(id));
      btn.setAttribute('aria-pressed', this.isInWishlist(id));
    });

    document.querySelectorAll('[data-wishlist-count], #wishlistNavBadge').forEach(el => {
      el.textContent = this.wishlist.length;
      el.style.display = this.wishlist.length > 0 ? 'inline-flex' : 'none';
    });
  }
};

/* ============================================================
   Auto-init when DOM is ready.
   External scripts may also call ShopApp.init() manually.
   ============================================================ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ShopApp.init());
} else {
  ShopApp.init();
}
