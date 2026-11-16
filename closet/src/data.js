/* ───────────── Valet · wardrobe vocabulary ───────────── */

const DRESS_LEVELS = ['', 'Lounge', 'Casual', 'Smart casual', 'Polished', 'Formal'];
const WARMTH_LEVELS = ['', 'Breezy', 'Light', 'Medium', 'Warm', 'Very warm'];

// slot: where the piece sits on an outfit board / in the engine
const CATS = {
  top:       { label: 'Tops',        slot: 'top',    subs: ['Tee', 'Tank / cami', 'Blouse', 'Button-down', 'Sweater', 'Turtleneck', 'Sweatshirt', 'Bodysuit', 'Polo'] },
  bottom:    { label: 'Bottoms',     slot: 'bottom', subs: ['Jeans', 'Trousers', 'Wide-leg pants', 'Leggings', 'Joggers', 'Shorts', 'Skirt (mini)', 'Skirt (midi)', 'Skirt (maxi)'] },
  dress:     { label: 'Dresses',     slot: 'dress',  subs: ['Day dress', 'Midi dress', 'Maxi dress', 'Shirt dress', 'Sweater dress', 'Cocktail dress', 'Gown', 'Jumpsuit', 'Romper'] },
  layer:     { label: 'Layers',      slot: 'layer',  subs: ['Cardigan', 'Blazer', 'Vest', 'Shacket', 'Kimono'] },
  outerwear: { label: 'Outerwear',   slot: 'outer',  subs: ['Trench', 'Wool coat', 'Puffer', 'Denim jacket', 'Leather jacket', 'Rain jacket', 'Parka', 'Utility jacket'] },
  shoes:     { label: 'Shoes',       slot: 'shoes',  subs: ['Sneakers', 'Loafers / flats', 'Heels', 'Mules', 'Ankle boots', 'Tall boots', 'Sandals', 'Rain boots', 'Athletic shoes'] },
  bag:       { label: 'Bags',        slot: 'bag',    subs: ['Tote', 'Work bag', 'Shoulder bag', 'Crossbody', 'Clutch', 'Backpack'] },
  accessory: { label: 'Accessories', slot: 'acc',    subs: ['Necklace', 'Earrings', 'Bracelet', 'Watch', 'Ring', 'Scarf', 'Belt', 'Hat', 'Sunglasses', 'Hair accessory'] },
  active:    { label: 'Activewear',  slot: 'active', subs: ['Sports bra', 'Active top', 'Active leggings', 'Active shorts', 'Active jacket'] },
};
const CAT_ORDER = ['top', 'bottom', 'dress', 'layer', 'outerwear', 'shoes', 'bag', 'accessory', 'active'];

// Per-subtype defaults: warmth (1–5), dress level (1–5), garment drawing
const SUB = {
  'Tee': [2, 2, 'tee'], 'Tank / cami': [1, 2, 'tank'], 'Blouse': [2, 3.5, 'blouse'], 'Button-down': [2, 3.5, 'shirt'],
  'Sweater': [4, 3, 'sweater'], 'Turtleneck': [4, 3.5, 'turtleneck'], 'Sweatshirt': [3, 1.5, 'sweater'], 'Bodysuit': [2, 3, 'tank'], 'Polo': [2, 2.5, 'tee'],
  'Jeans': [3, 2, 'jeans'], 'Trousers': [3, 4, 'trousers'], 'Wide-leg pants': [3, 3.5, 'wideleg'], 'Leggings': [2, 1.5, 'leggings'], 'Joggers': [3, 1.5, 'trousers'],
  'Shorts': [1, 1.5, 'shorts'], 'Skirt (mini)': [1, 2.5, 'skirtmini'], 'Skirt (midi)': [2, 3.5, 'skirtmidi'], 'Skirt (maxi)': [2, 3, 'skirtmaxi'],
  'Day dress': [2, 2.5, 'dress'], 'Midi dress': [2, 3.5, 'dressmidi'], 'Maxi dress': [2, 3, 'dressmaxi'], 'Shirt dress': [2, 3, 'dress'],
  'Sweater dress': [4, 3, 'dressmidi'], 'Cocktail dress': [2, 4.5, 'dresscocktail'], 'Gown': [2, 5, 'dressmaxi'], 'Jumpsuit': [2, 3.5, 'jumpsuit'], 'Romper': [1, 2, 'romper'],
  'Cardigan': [3, 3, 'cardigan'], 'Blazer': [3, 4, 'blazer'], 'Vest': [2, 3, 'vest'], 'Shacket': [3, 2, 'jacket'], 'Kimono': [1, 2.5, 'cardigan'],
  'Trench': [3, 3.5, 'trench'], 'Wool coat': [5, 4, 'coat'], 'Puffer': [5, 2, 'puffer'], 'Denim jacket': [3, 2, 'jacket'], 'Leather jacket': [3, 3, 'jacket'],
  'Rain jacket': [3, 2, 'raincoat'], 'Parka': [5, 2, 'coat'], 'Utility jacket': [3, 2, 'jacket'],
  'Sneakers': [3, 2, 'sneaker'], 'Loafers / flats': [3, 3.5, 'loafer'], 'Heels': [2, 4.5, 'heel'], 'Mules': [2, 3.5, 'mule'], 'Ankle boots': [4, 3.5, 'bootie'],
  'Tall boots': [5, 3.5, 'boot'], 'Sandals': [1, 2, 'sandal'], 'Rain boots': [4, 1.5, 'boot'], 'Athletic shoes': [3, 1, 'sneaker'],
  'Tote': [3, 3, 'tote'], 'Work bag': [3, 4, 'tote'], 'Shoulder bag': [3, 3.5, 'shoulderbag'], 'Crossbody': [3, 2.5, 'crossbody'], 'Clutch': [3, 4.5, 'clutch'], 'Backpack': [3, 1.5, 'backpack'],
  'Necklace': [3, 3, 'necklace'], 'Earrings': [3, 3, 'earrings'], 'Bracelet': [3, 3, 'bracelet'], 'Watch': [3, 3, 'watch'], 'Ring': [3, 3, 'ring'],
  'Scarf': [4, 3, 'scarf'], 'Belt': [3, 3, 'belt'], 'Hat': [4, 2, 'hat'], 'Sunglasses': [3, 2.5, 'sunglasses'], 'Hair accessory': [3, 2.5, 'ring'],
  'Sports bra': [1, 1, 'tank'], 'Active top': [2, 1, 'tee'], 'Active leggings': [2, 1, 'leggings'], 'Active shorts': [1, 1, 'shorts'], 'Active jacket': [3, 1, 'jacket'],
};

// Colors: neutral pieces pair with anything; hue drives harmony math
const COLORS = {
  black:     { label: 'Black', hex: '#1d1d20', n: 1 },
  charcoal:  { label: 'Charcoal', hex: '#45464c', n: 1 },
  grey:      { label: 'Grey', hex: '#9b9ea6', n: 1 },
  white:     { label: 'White', hex: '#fbfbfa', n: 1 },
  ivory:     { label: 'Ivory', hex: '#efe8d8', n: 1 },
  beige:     { label: 'Beige', hex: '#d8c6a5', n: 1 },
  camel:     { label: 'Camel', hex: '#b88a55', n: 1 },
  brown:     { label: 'Brown', hex: '#6b4631', n: 1 },
  khaki:     { label: 'Khaki', hex: '#b2a47b', n: 1 },
  olive:     { label: 'Olive', hex: '#6b6a3b', n: 1 },
  navy:      { label: 'Navy', hex: '#1f2a46', n: 1 },
  denim:     { label: 'Denim', hex: '#4b6a8e', n: 1 },
  lightwash: { label: 'Light wash', hex: '#94aecb', n: 1 },
  blue:      { label: 'Blue', hex: '#2f5daa', h: 217 },
  skyblue:   { label: 'Sky blue', hex: '#a8c5e6', h: 210 },
  teal:      { label: 'Teal', hex: '#237878', h: 180 },
  green:     { label: 'Green', hex: '#3e7c4f', h: 138 },
  sage:      { label: 'Sage', hex: '#a3b498', h: 100 },
  yellow:    { label: 'Yellow', hex: '#e8c547', h: 48 },
  mustard:   { label: 'Mustard', hex: '#c69a2f', h: 42 },
  orange:    { label: 'Orange', hex: '#df7a3a', h: 24 },
  rust:      { label: 'Rust', hex: '#a7532e', h: 18 },
  red:       { label: 'Red', hex: '#c0392d', h: 5 },
  burgundy:  { label: 'Burgundy', hex: '#6d2030', h: 345 },
  pink:      { label: 'Pink', hex: '#e59ab2', h: 340 },
  blush:     { label: 'Blush', hex: '#ecc8c1', h: 12, soft: 1 },
  fuchsia:   { label: 'Fuchsia', hex: '#c0317a', h: 325 },
  purple:    { label: 'Purple', hex: '#6a4c92', h: 270 },
  lavender:  { label: 'Lavender', hex: '#bda9d7', h: 265 },
  gold:      { label: 'Gold', hex: '#c9a448', metal: 1, n: 1 },
  silver:    { label: 'Silver', hex: '#b9bdc5', metal: 1, n: 1 },
  multi:     { label: 'Multicolor', hex: '#c58f9a', multi: 1, h: 0 },
};

const PATTERNS = ['Solid', 'Stripe', 'Plaid', 'Check', 'Floral', 'Animal', 'Polka dot', 'Print', 'Texture'];
const MATERIALS = ['Cotton', 'Linen', 'Silk', 'Satin', 'Wool', 'Cashmere', 'Knit', 'Denim', 'Leather', 'Suede', 'Faux leather',
  'Polyester', 'Viscose', 'Tech / nylon', 'Velvet', 'Tweed', 'Corduroy', 'Fleece', 'Sequin'];
const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const STATUSES = {
  active: 'In rotation', laundry: 'In the laundry', tailor: 'Tailor / repair', storage: 'Off-season storage',
  donate: 'Donate / sell', retired: 'Gone',
};

// What a day asks of you. f = dress level target.
const KINDS = {
  work:     { label: 'Work',               f: 3,   icon: 'briefcase' },
  client:   { label: 'Client meeting',     f: 4,   icon: 'handshake' },
  showing:  { label: 'On my feet',         f: 3,   icon: 'key', comfortShoes: 1, note: 'Showings, open houses, tours' },
  wfh:      { label: 'Work from home',     f: 2,   icon: 'laptop' },
  casual:   { label: 'Casual',             f: 2,   icon: 'coffee' },
  date:     { label: 'Date night',         f: 3.5, icon: 'wine', evening: 1 },
  cocktail: { label: 'Party / cocktail',   f: 4,   icon: 'spark', evening: 1 },
  formal:   { label: 'Formal / wedding',   f: 5,   icon: 'diamond', evening: 1 },
  active:   { label: 'Workout',            f: 1,   icon: 'run', active: 1 },
  travel:   { label: 'Travel day',         f: 2,   icon: 'plane', comfortShoes: 1 },
  outdoor:  { label: 'Outdoors',           f: 2,   icon: 'sun', comfortShoes: 1 },
  lounge:   { label: 'At home',            f: 1,   icon: 'home' },
};
const KIND_ORDER = ['work', 'client', 'showing', 'wfh', 'casual', 'date', 'cocktail', 'formal', 'active', 'travel', 'outdoor', 'lounge'];

// Calendar text → kind. First match wins inside an event; the day takes the dressiest event.
const KIND_RULES = [
  ['formal',   /\b(wedding|gala|black[- ]tie|ball\b|opera|funeral|memorial|benefit dinner|awards?\b|bar mitzvah|bat mitzvah|quincea)/i],
  ['cocktail', /\b(cocktail|holiday party|christmas party|party|reception|celebration|theat(er|re)|symphony|ballet|fundraiser|launch event|mixer)/i],
  ['client',   /\b(client|listing (appt|appointment|presentation)|presentation|interview|board meeting|pitch|keynote|panel|investor|closing|signing|escrow|conference|seminar|court|deposition)/i],
  ['showing',  /\b(showing|open house|broker tour|caravan|walk[- ]?through|inspection|tour\b|site visit|preview|appraisal|staging)/i],
  ['active',   /\b(gym|yoga|pilates|barre|run\b|running|hike|hiking|tennis|pickleball|golf|spin|workout|work out|crossfit|f45|orange ?theory|swim|training|trainer|bootcamp|soccer practice)/i],
  ['travel',   /(✈|\bflight\b|\bfly\b|airport|\b[A-Z]{3} ?(→|->|to) ?[A-Z]{3}\b|\bterminal\b|train to|road trip|check[- ]?in|hotel|\btrip\b|vacation|getaway)/i],
  ['date',     /\b(date night|date\b|dinner|drinks|anniversary|happy hour|wine tasting|tasting)/i],
  ['outdoor',  /\b(picnic|park\b|beach|bbq|barbecue|game\b|tailgate|festival|farmers market|zoo|camping|lake|vineyard tour)/i],
  ['casual',   /\b(lunch|brunch|coffee|errands|pickup|pick up|playdate|family|friends|kids|school|church|grocer|haircut|nails|salon|doctor|dentist)/i],
  ['wfh',      /\b(wfh|work from home|remote day|home office)/i],
];

// Go-to formulas from the style interview; slots map to subtypes
const FORMULAS = [
  { k: 'jeans-tee-blazer',   label: 'Jeans, a tee & a blazer',             need: { bottom: ['Jeans'], top: ['Tee', 'Tank / cami', 'Bodysuit'], layer: ['Blazer'] } },
  { k: 'jeans-sweater-boots', label: 'Jeans, a sweater & boots',          need: { bottom: ['Jeans'], top: ['Sweater', 'Turtleneck'], shoes: ['Ankle boots', 'Tall boots'] } },
  { k: 'shirt-jeans-loafers', label: 'Crisp shirt, jeans & loafers',      need: { bottom: ['Jeans'], top: ['Button-down', 'Blouse'], shoes: ['Loafers / flats', 'Mules'] } },
  { k: 'trousers-blouse',    label: 'Tailored trousers & a blouse',       need: { bottom: ['Trousers', 'Wide-leg pants'], top: ['Blouse', 'Button-down'] } },
  { k: 'trousers-knit-heels', label: 'Trousers, fine knit & heels',       need: { bottom: ['Trousers', 'Wide-leg pants'], top: ['Sweater', 'Turtleneck'], shoes: ['Heels', 'Mules'] } },
  { k: 'dress-denim-sneakers', label: 'Dress, denim jacket & sneakers',   need: { dress: ['Day dress', 'Midi dress', 'Maxi dress', 'Shirt dress'], outer: ['Denim jacket'], shoes: ['Sneakers'] } },
  { k: 'dress-cardigan-boots', label: 'Dress, cardigan & boots',          need: { dress: ['Day dress', 'Midi dress', 'Shirt dress', 'Sweater dress'], layer: ['Cardigan'], shoes: ['Ankle boots', 'Tall boots'] } },
  { k: 'skirt-sweater-boots', label: 'Midi skirt, sweater & boots',       need: { bottom: ['Skirt (midi)', 'Skirt (maxi)'], top: ['Sweater', 'Turtleneck'], shoes: ['Ankle boots', 'Tall boots'] } },
  { k: 'jumpsuit-blazer',    label: 'Jumpsuit & a blazer',                need: { dress: ['Jumpsuit'], layer: ['Blazer'] } },
  { k: 'leggings-sweater',   label: 'Leggings, big sweater & sneakers',   need: { bottom: ['Leggings', 'Joggers'], top: ['Sweater', 'Sweatshirt'], shoes: ['Sneakers'] } },
  { k: 'slip-leather',       label: 'Slip dress & leather jacket',        need: { dress: ['Midi dress', 'Cocktail dress'], outer: ['Leather jacket'] } },
  { k: 'wideleg-tank-sandals', label: 'Wide-leg pants, tank & sandals',   need: { bottom: ['Wide-leg pants', 'Trousers'], top: ['Tank / cami', 'Bodysuit'], shoes: ['Sandals', 'Mules'] } },
];

const STYLE_WORDS = ['Classic', 'Minimal', 'Polished', 'Relaxed', 'Romantic', 'Boho', 'Edgy', 'Sporty', 'Preppy', 'Eclectic', 'Coastal', 'Glam'];

// Retailers: none of these publish a purchase-history API, so each card says how to bring orders in
const RETAILERS = [
  { k: 'stitchfix', name: 'Stitch Fix', mark: 'SF', q: 'stitchfix.com',
    how: 'In the Stitch Fix app or site, open your account’s order history and open a Fix. Select the item list (brand, name, price), copy, and paste it here. Fix checkout emails work too.' },
  { k: 'nordstrom', name: 'Nordstrom', mark: 'N', q: 'nordstrom.com',
    how: 'Sign in at nordstrom.com and open Purchases. Open an order, copy the page text, and paste it here. Order and shipping emails work too.' },
  { k: 'gapinc', name: 'Gap · Old Navy · Banana Republic · Athleta', mark: 'G', q: 'gap.com OR oldnavy.com OR bananarepublic.com OR athleta.com',
    how: 'These four brands share one account. Sign in to any of them and open Order History; orders from all four show up together. Copy an order and paste it here.' },
  { k: 'amazon', name: 'Amazon', mark: 'a', q: 'amazon.com',
    how: 'Open Your Orders, copy the clothing orders and paste them here. For years of history, request your order data from Amazon and upload the CSV.' },
  { k: 'any', name: 'Any other store', mark: '+', q: '',
    how: 'Paste any order confirmation email or receipt text. Valet finds the item names, sizes, colors, prices and the order date.' },
];

const STORE_NAMES = ['Stitch Fix', 'Nordstrom Rack', 'Nordstrom', 'Old Navy', 'Banana Republic Factory', 'Banana Republic', 'Gap Factory', 'Gap', 'Athleta',
  'J.Crew', 'Madewell', 'Anthropologie', 'Free People', 'Everlane', 'Quince', 'Lululemon', 'Zara', 'H&M', 'Uniqlo', 'Target', 'Amazon', 'Loft', 'Ann Taylor',
  'Talbots', "Chico's", 'White House Black Market', 'Aritzia', 'Abercrombie', 'Revolve', 'Shopbop', 'Saks', "Bloomingdale's", "Macy's", "Kohl's", 'Costco',
  'Poshmark', 'The RealReal', 'ThredUp', 'Evereve', 'Vince', 'Sézane', 'Reformation', 'Boden', 'Express', 'Dillard\'s', 'TJ Maxx', 'Marshalls'];

const GMAIL_STORES = 'stitchfix.com OR nordstrom.com OR gap.com OR oldnavy.com OR bananarepublic.com OR athleta.com OR jcrew.com OR madewell.com OR anthropologie.com OR freepeople.com OR everlane.com OR quince.com OR lululemon.com OR zara.com OR loft.com OR anntaylor.com OR aritzia.com OR abercrombie.com OR revolve.com OR shopbop.com OR bloomingdales.com OR macys.com OR evereve.com OR sezane.com OR thereformation.com OR target.com';

/* Sample closet: clearly flagged, removable in one tap. Wears are synthesized relative to today. */
const SAMPLE_CLOSET = [
  // name, cat, sub, colors, pattern, material, price, store, brand, monthsAgo, wearCount
  ['White crew tee', 'top', 'Tee', ['white'], 'Solid', 'Cotton', 28, 'Everlane', 'Everlane', 14, 31],
  ['Black fitted tee', 'top', 'Tee', ['black'], 'Solid', 'Cotton', 30, 'Madewell', 'Madewell', 10, 22],
  ['Breton stripe top', 'top', 'Tee', ['navy', 'white'], 'Stripe', 'Cotton', 54, 'J.Crew', 'J.Crew', 20, 18],
  ['Ivory silk blouse', 'top', 'Blouse', ['ivory'], 'Solid', 'Silk', 98, 'Nordstrom', 'Vince', 8, 9],
  ['Blue oxford shirt', 'top', 'Button-down', ['skyblue'], 'Solid', 'Cotton', 69, 'Banana Republic', 'Banana Republic', 16, 14],
  ['Camel crewneck sweater', 'top', 'Sweater', ['camel'], 'Solid', 'Cashmere', 128, 'Quince', 'Quince', 13, 19],
  ['Charcoal turtleneck', 'top', 'Turtleneck', ['charcoal'], 'Solid', 'Wool', 74, 'Stitch Fix', 'Market & Spruce', 12, 11],
  ['Burgundy cable sweater', 'top', 'Sweater', ['burgundy'], 'Texture', 'Knit', 64, 'Old Navy', 'Old Navy', 2, 1],
  ['Sage wrap blouse', 'top', 'Blouse', ['sage'], 'Solid', 'Viscose', 58, 'Stitch Fix', 'Le Lis', 5, 3],
  ['Dark straight jeans', 'bottom', 'Jeans', ['denim'], 'Solid', 'Denim', 89, 'Gap', 'Gap', 18, 46],
  ['Light wash wide-leg jeans', 'bottom', 'Jeans', ['lightwash'], 'Solid', 'Denim', 79, 'Old Navy', 'Old Navy', 6, 8],
  ['Black tailored trousers', 'bottom', 'Trousers', ['black'], 'Solid', 'Wool', 118, 'Banana Republic', 'Banana Republic', 15, 27],
  ['Camel wide-leg trousers', 'bottom', 'Wide-leg pants', ['camel'], 'Solid', 'Wool', 98, 'Nordstrom', 'Halogen', 9, 7],
  ['Black pleated midi skirt', 'bottom', 'Skirt (midi)', ['black'], 'Solid', 'Satin', 88, 'Stitch Fix', 'Fate', 11, 6],
  ['Black ponte leggings', 'bottom', 'Leggings', ['black'], 'Solid', 'Knit', 49, 'Athleta', 'Athleta', 20, 35],
  ['Navy floral midi dress', 'dress', 'Midi dress', ['navy', 'blush'], 'Floral', 'Viscose', 138, 'Nordstrom', 'Treasure & Bond', 7, 5],
  ['Black wrap dress', 'dress', 'Day dress', ['black'], 'Solid', 'Knit', 110, 'Nordstrom', 'Eliza J', 17, 12],
  ['Emerald cocktail dress', 'dress', 'Cocktail dress', ['green'], 'Solid', 'Satin', 189, 'Nordstrom', 'Adrianna Papell', 24, 2],
  ['Olive utility jumpsuit', 'dress', 'Jumpsuit', ['olive'], 'Solid', 'Cotton', 79, 'Old Navy', 'Old Navy', 4, 2],
  ['Navy blazer', 'layer', 'Blazer', ['navy'], 'Solid', 'Wool', 149, 'Banana Republic', 'Banana Republic', 22, 24],
  ['Black blazer', 'layer', 'Blazer', ['black'], 'Solid', 'Polyester', 129, 'Stitch Fix', 'Liverpool', 12, 15],
  ['Oatmeal long cardigan', 'layer', 'Cardigan', ['beige'], 'Solid', 'Knit', 68, 'Gap', 'Gap', 14, 21],
  ['Classic trench', 'outerwear', 'Trench', ['khaki'], 'Solid', 'Cotton', 168, 'Nordstrom', 'BP.', 26, 17],
  ['Camel wool coat', 'outerwear', 'Wool coat', ['camel'], 'Solid', 'Wool', 248, 'Nordstrom', 'Sam Edelman', 23, 13],
  ['Denim jacket', 'outerwear', 'Denim jacket', ['denim'], 'Solid', 'Denim', 69, 'Old Navy', 'Old Navy', 30, 16],
  ['Black leather moto', 'outerwear', 'Leather jacket', ['black'], 'Solid', 'Faux leather', 98, 'Stitch Fix', 'Blank NYC', 19, 9],
  ['White leather sneakers', 'shoes', 'Sneakers', ['white'], 'Solid', 'Leather', 98, 'Nordstrom', 'Veja', 16, 52],
  ['Black loafers', 'shoes', 'Loafers / flats', ['black'], 'Solid', 'Leather', 119, 'Nordstrom', 'Sam Edelman', 15, 33],
  ['Cognac ankle boots', 'shoes', 'Ankle boots', ['camel'], 'Solid', 'Suede', 159, 'Nordstrom', 'Blondo', 13, 20],
  ['Black block heels', 'shoes', 'Heels', ['black'], 'Solid', 'Leather', 99, 'Nordstrom Rack', 'Vince Camuto', 21, 6],
  ['Tan slide sandals', 'shoes', 'Sandals', ['camel'], 'Solid', 'Leather', 79, 'Madewell', 'Madewell', 6, 9],
  ['Black work tote', 'bag', 'Work bag', ['black'], 'Solid', 'Leather', 198, 'Nordstrom', 'Madewell', 25, 61],
  ['Cognac crossbody', 'bag', 'Crossbody', ['camel'], 'Solid', 'Leather', 128, 'Nordstrom', 'Fossil', 18, 24],
  ['Gold hoops', 'accessory', 'Earrings', ['gold'], 'Solid', '', 45, 'Nordstrom', 'Nordstrom', 30, 70],
  ['Gold pendant necklace', 'accessory', 'Necklace', ['gold'], 'Solid', '', 58, 'Madewell', 'Madewell', 12, 22],
  ['Plaid wool scarf', 'accessory', 'Scarf', ['camel', 'grey'], 'Plaid', 'Wool', 39, 'Old Navy', 'Old Navy', 24, 11],
  ['Tortoise sunglasses', 'accessory', 'Sunglasses', ['brown'], 'Animal', '', 45, 'Target', 'A New Day', 9, 14],
  ['Black active set top', 'active', 'Active top', ['black'], 'Solid', 'Tech / nylon', 58, 'Athleta', 'Athleta', 8, 18],
  ['Navy active leggings', 'active', 'Active leggings', ['navy'], 'Solid', 'Tech / nylon', 89, 'Athleta', 'Athleta', 8, 19],
];
