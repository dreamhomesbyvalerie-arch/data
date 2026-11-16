/* ───────────── bringing pieces in ───────────── */

// Guess category + subtype from a product name
const SUB_HINTS = [
  [/sports? bra/i, 'active', 'Sports bra'], [/(active|athletic|running|workout|yoga|train(ing)?)\s+(legging|tight)/i, 'active', 'Active leggings'],
  [/(active|running|athletic|bike)\s+short/i, 'active', 'Active shorts'], [/(active|run|training|workout|yoga)\s+(tee|top|tank)/i, 'active', 'Active top'],
  [/jumpsuit|boiler ?suit|overalls?/i, 'dress', 'Jumpsuit'], [/romper|playsuit/i, 'dress', 'Romper'], [/gown/i, 'dress', 'Gown'],
  [/cocktail|sequin(ed)? dress|party dress/i, 'dress', 'Cocktail dress'], [/sweater dress|knit dress/i, 'dress', 'Sweater dress'], [/shirt ?dress/i, 'dress', 'Shirt dress'],
  [/maxi dress/i, 'dress', 'Maxi dress'], [/midi dress|slip dress|wrap dress/i, 'dress', 'Midi dress'], [/dress/i, 'dress', 'Day dress'],
  [/trench/i, 'outerwear', 'Trench'], [/puffer|down jacket|quilted/i, 'outerwear', 'Puffer'], [/parka/i, 'outerwear', 'Parka'], [/rain ?(jacket|coat)|anorak|shell/i, 'outerwear', 'Rain jacket'],
  [/denim jacket|jean jacket|trucker/i, 'outerwear', 'Denim jacket'], [/(leather|moto|biker|suede) jacket/i, 'outerwear', 'Leather jacket'],
  [/(wool|wrap|car|top|overcoat|teddy|peacoat|pea coat)\s*coat|\bcoat\b/i, 'outerwear', 'Wool coat'], [/utility|field|bomber|chore|shacket|shirt jacket/i, 'outerwear', 'Utility jacket'],
  [/blazer|suit jacket/i, 'layer', 'Blazer'], [/cardigan|cardi\b/i, 'layer', 'Cardigan'], [/vest|gilet/i, 'layer', 'Vest'], [/kimono|duster/i, 'layer', 'Kimono'],
  [/turtleneck|mock ?neck|funnel/i, 'top', 'Turtleneck'], [/sweatshirt|hoodie|pullover fleece|crewneck sweatshirt/i, 'top', 'Sweatshirt'],
  [/sweater|pullover|jumper|knit top|cashmere crew/i, 'top', 'Sweater'], [/button[- ]?(down|up)|oxford|shirt\b(?!.*dress)|poplin shirt/i, 'top', 'Button-down'],
  [/blouse|top\b.*(silk|satin)|peasant|tunic/i, 'top', 'Blouse'], [/bodysuit/i, 'top', 'Bodysuit'], [/\bpolo\b/i, 'top', 'Polo'],
  [/tank|cami|camisole|halter/i, 'top', 'Tank / cami'], [/tee\b|t-shirt|tshirt|crew ?neck|v-neck|henley|long[- ]sleeve top|\btop\b/i, 'top', 'Tee'],
  [/jeans?\b|denim (pant|short)?/i, 'bottom', 'Jeans'], [/legging|ponte pant/i, 'bottom', 'Leggings'], [/jogger|sweatpant|track pant/i, 'bottom', 'Joggers'],
  [/short/i, 'bottom', 'Shorts'], [/mini skirt|miniskirt|skort/i, 'bottom', 'Skirt (mini)'], [/maxi skirt/i, 'bottom', 'Skirt (maxi)'], [/skirt/i, 'bottom', 'Skirt (midi)'],
  [/wide[- ]leg|palazzo|culotte|flare pant/i, 'bottom', 'Wide-leg pants'], [/trouser|pant|chino|slacks/i, 'bottom', 'Trousers'],
  [/rain boot|wellie|duck boot/i, 'shoes', 'Rain boots'], [/knee|tall boot|riding boot|over[- ]the[- ]knee/i, 'shoes', 'Tall boots'], [/boot|bootie|chelsea/i, 'shoes', 'Ankle boots'],
  [/running shoe|trainer|athletic shoe/i, 'shoes', 'Athletic shoes'], [/sneaker|plimsoll/i, 'shoes', 'Sneakers'], [/loafer|ballet|flat\b|flats|oxford shoe|moccasin/i, 'shoes', 'Loafers / flats'],
  [/mule|slide/i, 'shoes', 'Mules'], [/sandal|espadrille|flip[- ]flop/i, 'shoes', 'Sandals'], [/heel|pump|stiletto|slingback/i, 'shoes', 'Heels'],
  [/clutch|wristlet|evening bag/i, 'bag', 'Clutch'], [/crossbody|cross-body|belt bag|sling/i, 'bag', 'Crossbody'], [/backpack/i, 'bag', 'Backpack'],
  [/tote|shopper/i, 'bag', 'Tote'], [/satchel|work bag|briefcase|laptop bag/i, 'bag', 'Work bag'], [/bag|purse|hobo|handbag|shoulder/i, 'bag', 'Shoulder bag'],
  [/necklace|pendant|chain\b|choker/i, 'accessory', 'Necklace'], [/earring|hoops?\b|studs?\b|huggie/i, 'accessory', 'Earrings'], [/bracelet|bangle|cuff/i, 'accessory', 'Bracelet'],
  [/watch/i, 'accessory', 'Watch'], [/\bring\b/i, 'accessory', 'Ring'], [/scarf|wrap\b|pashmina/i, 'accessory', 'Scarf'], [/belt/i, 'accessory', 'Belt'],
  [/\bhat\b|beanie|cap\b|fedora|beret/i, 'accessory', 'Hat'], [/sunglass/i, 'accessory', 'Sunglasses'], [/claw clip|scrunchie|headband|hair/i, 'accessory', 'Hair accessory'],
];
function inferCategory(text) { for (const [re, cat, sub] of SUB_HINTS) if (re.test(text)) return { cat, sub }; return { cat: 'top', sub: 'Tee' }; }

const COLOR_WORDS = [
  [/\b(black|onyx|jet|noir)\b/i, 'black'], [/\b(charcoal|graphite|heather charcoal)\b/i, 'charcoal'], [/\b(gr[ae]y|heather|slate|silver gr)/i, 'grey'],
  [/\b(white|optic|bright white)\b/i, 'white'], [/\b(ivory|cream|ecru|oatmeal|oat|vanilla|bone|off[- ]white|natural)\b/i, 'ivory'],
  [/\b(beige|taupe|sand|stone|nude|mushroom|latte)\b/i, 'beige'], [/\b(camel|tan|cognac|caramel|toffee|luggage|saddle|whiskey)\b/i, 'camel'],
  [/\b(brown|chocolate|espresso|mocha|coffee|chestnut)\b/i, 'brown'], [/\b(khaki|british khaki)\b/i, 'khaki'], [/\b(olive|army|moss|military)\b/i, 'olive'],
  [/\b(navy|midnight|ink)\b/i, 'navy'], [/\b(light wash|lightwash|bleach|vintage wash)\b/i, 'lightwash'], [/\b(denim|indigo|dark wash|medium wash|rinse)\b/i, 'denim'],
  [/\b(sky|light blue|baby blue|powder|chambray)\b/i, 'skyblue'], [/\b(blue|cobalt|royal|sapphire)\b/i, 'blue'], [/\b(teal|peacock|turquoise|aqua)\b/i, 'teal'],
  [/\b(sage|mint|seafoam|eucalyptus)\b/i, 'sage'], [/\b(green|emerald|kelly|forest|hunter)\b/i, 'green'], [/\b(mustard|ochre|gold(en)? yellow)\b/i, 'mustard'],
  [/\b(yellow|lemon|butter)\b/i, 'yellow'], [/\b(rust|terracotta|copper|cinnamon|brick)\b/i, 'rust'], [/\b(orange|coral|tangerine|apricot)\b/i, 'orange'],
  [/\b(burgundy|wine|oxblood|maroon|merlot|bordeaux|plum)\b/i, 'burgundy'], [/\b(red|scarlet|cherry|crimson|tomato)\b/i, 'red'],
  [/\b(blush|dusty rose|rose|petal|pale pink)\b/i, 'blush'], [/\b(fuchsia|magenta|hot pink|berry)\b/i, 'fuchsia'], [/\b(pink)\b/i, 'pink'],
  [/\b(lavender|lilac|orchid)\b/i, 'lavender'], [/\b(purple|violet|grape|eggplant|aubergine)\b/i, 'purple'], [/\b(gold|brass)\b/i, 'gold'], [/\b(silver|chrome|metallic)\b/i, 'silver'],
  [/\b(multi|print|floral|rainbow)\b/i, 'multi'],
];
function inferColors(text) { const out = []; for (const [re, k] of COLOR_WORDS) if (re.test(text) && !out.includes(k)) out.push(k); return out.slice(0, 2); }
function inferPattern(text) {
  const t = text.toLowerCase();
  if (/stripe|breton/.test(t)) return 'Stripe'; if (/plaid|tartan/.test(t)) return 'Plaid'; if (/check|gingham|houndstooth/.test(t)) return 'Check';
  if (/floral|flower|ditsy/.test(t)) return 'Floral'; if (/leopard|cheetah|snake|animal|zebra|tortoise/.test(t)) return 'Animal'; if (/polka|dot\b/.test(t)) return 'Polka dot';
  if (/print|paisley|geo/.test(t)) return 'Print'; if (/cable|rib|waffle|tweed|boucle|bouclé/.test(t)) return 'Texture'; return 'Solid';
}
function inferMaterial(text) {
  const t = text.toLowerCase();
  const m = [['cashmere', 'Cashmere'], ['merino', 'Wool'], ['wool', 'Wool'], ['linen', 'Linen'], ['silk', 'Silk'], ['satin', 'Satin'], ['denim', 'Denim'], ['vegan leather', 'Faux leather'],
    ['faux leather', 'Faux leather'], ['leather', 'Leather'], ['suede', 'Suede'], ['velvet', 'Velvet'], ['tweed', 'Tweed'], ['corduroy', 'Corduroy'], ['fleece', 'Fleece'], ['sequin', 'Sequin'],
    ['knit', 'Knit'], ['ponte', 'Knit'], ['cotton', 'Cotton'], ['poplin', 'Cotton'], ['nylon', 'Tech / nylon'], ['polyester', 'Polyester'], ['viscose', 'Viscose'], ['rayon', 'Viscose']];
  for (const [k, v] of m) if (t.includes(k)) return v; return '';
}
function detectStore(text) {
  const t = text.toLowerCase();
  if (/stitch ?fix/.test(t)) return 'Stitch Fix';
  for (const s of STORE_NAMES) if (t.includes(s.toLowerCase())) return s;
  return '';
}
const MONTHS_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
function detectDate(text) {
  let m = text.match(new RegExp(`(?:order(?:ed)?|placed|purchase(?:d)?|date)[^\\n]{0,20}?${MONTHS_RE}\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i')) || text.match(new RegExp(`${MONTHS_RE}\\.?\\s+(\\d{1,2}),?\\s+(\\d{4})`, 'i'));
  if (m) { const mi = MON.findIndex((x) => m[1].toLowerCase().startsWith(x.toLowerCase())); const d = new Date(+m[3], mi, +m[2]); if (!isNaN(d)) return iso(d); }
  m = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/); if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; const d = new Date(y, +m[1] - 1, +m[2]); if (!isNaN(d)) return iso(d); }
  m = text.match(/(\d{4})-(\d{2})-(\d{2})/); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return '';
}

/* Order email / order page text → candidate items.
   Works line by line: every product price anchors an item; the name is the nearest
   meaningful line above it, with Color / Size lines picked up in between. */
const SKIP_LINE = /^(sub ?total|total|tax|estimated|shipping|delivery|discount|savings|promo|you saved|order (total|summary|number|#)|item ?#|style ?#|sku|qty|quantity|price|payment|visa|mastercard|amex|card ending|gift card|rewards|points|balance|ship(ping)? to|bill(ing)? to|return|track|view|questions|need help|thank you|hi |hello|dear|free shipping|merchandise|original price|now\b|was\b|sale price|final sale|in stock|arrives|est\.? delivery|styling fee|credit|applied|keep|kept|returned|send back|checkout)/i;
function parseOrderText(text, defaults = {}) {
  const store = defaults.store || detectStore(text); const date = defaults.date || detectDate(text) || today();
  const lines = text.replace(/ /g, ' ').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const items = []; let lastPriceIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const pm = L.match(/\$\s?(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)/); if (!pm) continue;
    if (SKIP_LINE.test(L) || /total|tax|shipping|discount|savings|you saved|fee|credit/i.test(L)) { lastPriceIdx = i; continue; }
    const price = parseMoney(pm[1]);
    if (price == null || price <= 0) continue;
    let name = '', color = '', size = '', brand = '';
    const inline = L.replace(pm[0], '').replace(/\s{2,}/g, ' ').replace(/[–—-]\s*$/, '').trim();
    if (inline.length > 3 && /[a-z]{3}/i.test(inline) && !SKIP_LINE.test(inline) && !/^(qty|price|each|ea\.?|x\s?\d)/i.test(inline)) name = inline;
    for (let j = i - 1; j > lastPriceIdx && j >= i - 6; j--) {
      const P = lines[j];
      const cm = P.match(/^colou?r\s*[:\-]?\s*(.+)$/i); if (cm) { color = color || cm[1]; continue; }
      const sm = P.match(/^size\s*[:\-]?\s*(.+)$/i); if (sm) { size = size || sm[1]; continue; }
      if (/^(qty|quantity|item|style|sku|#|\d+$|ea|each|price|sale|final|was|now|in stock|ships|arrives)/i.test(P) || SKIP_LINE.test(P)) continue;
      if (/\$\d/.test(P)) continue;
      if (!name && /[a-z]{3}/i.test(P) && P.length <= 90) { name = P; continue; }
      if (name && !brand && P.length <= 40 && /^[A-Z0-9&'.\s-]+$|^[A-Z][\w'.-]*(\s(&|[A-Z][\w&'.-]*)){0,4}$/.test(P)) { brand = P; break; }
    }
    for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
      const P = lines[j]; const cm = P.match(/^colou?r\s*[:\-]?\s*(.+)$/i); if (cm && !color) color = cm[1]; const sm = P.match(/^size\s*[:\-]?\s*(.+)$/i); if (sm && !size) size = sm[1];
    }
    lastPriceIdx = i;
    if (!name || name.length < 3) continue;
    if (items.some((x) => x.name === name && x.price === price)) continue;
    const text2 = `${name} ${color}`; const { cat, sub } = inferCategory(name);
    const [w, f] = subDefaults(sub);
    items.push({ name: name.replace(/\s+/g, ' ').slice(0, 80), brand: brand && brand.toLowerCase() !== store.toLowerCase() ? brand : '', store, price, purchased: date,
      size: size.slice(0, 20), colors: inferColors(text2).length ? inferColors(text2) : ['black'], colorGuessed: !inferColors(text2).length,
      pattern: inferPattern(text2), material: inferMaterial(name), cat, sub, warmth: w, formality: f });
  }
  return items;
}

/* CSV → items, with forgiving column names */
const CSV_FIELDS = {
  name: ['name', 'item', 'item name', 'product', 'product name', 'description', 'title'],
  cat: ['category', 'type', 'cat'], sub: ['subcategory', 'subtype', 'kind', 'style'], colors: ['color', 'colour', 'colors', 'colours'],
  brand: ['brand', 'designer', 'label', 'maker'], store: ['store', 'retailer', 'shop', 'vendor', 'seller', 'purchased from', 'where'],
  price: ['price', 'cost', 'amount', 'paid', 'item total', 'unit price'], purchased: ['date', 'purchased', 'purchase date', 'order date', 'bought', 'date purchased'],
  size: ['size'], notes: ['notes', 'note', 'comments'], material: ['material', 'fabric'], pattern: ['pattern', 'print'], wears: ['wears', 'times worn', 'wear count'],
};
function mapCSV(rows) {
  const head = rows[0].map((h) => h.trim().toLowerCase()); const idx = {};
  for (const [f, names] of Object.entries(CSV_FIELDS)) { const i = head.findIndex((h) => names.includes(h)); if (i >= 0) idx[f] = i; }
  if (idx.name == null) idx.name = 0;
  return rows.slice(1).map((r) => {
    const g = (f) => (idx[f] != null ? (r[idx[f]] || '').trim() : '');
    const name = g('name'); if (!name) return null;
    let cat = (g('cat') || '').toLowerCase(); let sub = g('sub');
    const catKey = Object.keys(CATS).find((k) => k === cat || CATS[k].label.toLowerCase() === cat || CATS[k].label.toLowerCase().startsWith(cat));
    const guess = inferCategory(`${sub} ${cat} ${name}`);
    cat = catKey || guess.cat; if (!CATS[cat].subs.includes(sub)) sub = CATS[cat].subs.includes(guess.sub) ? guess.sub : CATS[cat].subs[0];
    const ctext = `${g('colors')} ${name}`; const colors = inferColors(ctext);
    const [w, f] = subDefaults(sub); const wearsN = parseInt(g('wears')) || 0;
    let purchased = g('purchased'); if (purchased) { const dd = detectDate(purchased) || (isNaN(Date.parse(purchased)) ? '' : iso(new Date(purchased))); purchased = dd; }
    return { name, cat, sub, colors: colors.length ? colors : ['black'], brand: g('brand'), store: g('store'), price: parseMoney(g('price')), purchased, size: g('size'),
      notes: g('notes'), material: g('material') || inferMaterial(name), pattern: PATTERNS.find((p) => p.toLowerCase() === g('pattern').toLowerCase()) || inferPattern(name),
      warmth: w, formality: f, wearsN };
  }).filter(Boolean);
}
const CSV_TEMPLATE = 'name,category,subcategory,color,brand,store,price,purchase date,size,material,notes\n' +
  'Navy blazer,Layers,Blazer,navy,Banana Republic,Banana Republic,149,2025-03-14,6,Wool,\n' +
  'White leather sneakers,Shoes,Sneakers,white,Veja,Nordstrom,98,2024-09-02,8,Leather,\n';

/* .ics calendar file → events */
function parseICS(text, from = addDays(today(), -14), to = addDays(today(), 90)) {
  const raw = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/);
  const evs = []; let cur = null;
  const val = (l) => l.slice(l.indexOf(':') + 1);
  const unesc = (s) => s.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
  for (const l of raw) {
    if (l === 'BEGIN:VEVENT') cur = { ex: [] };
    else if (l === 'END:VEVENT') { if (cur) evs.push(cur); cur = null; }
    else if (cur) {
      const key = l.split(/[:;]/)[0];
      if (key === 'SUMMARY') cur.title = unesc(val(l)); else if (key === 'LOCATION') cur.location = unesc(val(l)); else if (key === 'DESCRIPTION') cur.desc = unesc(val(l)).slice(0, 300);
      else if (key === 'DTSTART') cur.start = icsDate(l); else if (key === 'RRULE') cur.rrule = val(l); else if (key === 'EXDATE') val(l).split(',').forEach((v) => cur.ex.push(icsDate('X:' + v).date));
      else if (key === 'STATUS') cur.status = val(l); else if (key === 'RECURRENCE-ID') cur.recur = true;
    }
  }
  const out = [];
  for (const e of evs) {
    if (!e.start || e.status === 'CANCELLED') continue;
    const dates = e.rrule ? expandRRule(e.start.date, e.rrule, from, to).filter((d) => !e.ex.includes(d)) : [e.start.date];
    for (const d of dates) if (d >= from && d <= to) out.push({ id: uid('e'), date: d, time: e.start.time || '', title: e.title || 'Event', location: e.location || '', desc: e.desc || '', src: 'ics' });
  }
  return out;
}
function icsDate(line) {
  const v = line.slice(line.lastIndexOf(':') + 1).trim();
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?/); if (!m) return null;
  if (!m[4]) return { date: `${m[1]}-${m[2]}-${m[3]}`, time: '' };
  let d = m[7] ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])) : new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return { date: iso(d), time: fmtTime(d.getHours(), d.getMinutes()) };
}
function fmtTime(h, m) { const ap = h >= 12 ? 'p' : 'a'; const hh = h % 12 || 12; return m ? `${hh}:${pad(m)}${ap}` : `${hh}${ap}`; }
function expandRRule(start, rule, from, to) {
  const R = Object.fromEntries(rule.split(';').map((p) => p.split('=')));
  const interval = +(R.INTERVAL || 1); const count = R.COUNT ? +R.COUNT : Infinity;
  const until = R.UNTIL ? `${R.UNTIL.slice(0, 4)}-${R.UNTIL.slice(4, 6)}-${R.UNTIL.slice(6, 8)}` : to;
  const byday = R.BYDAY ? R.BYDAY.split(',').map((d) => ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].indexOf(d.slice(-2))) : null;
  const out = []; let n = 0; let d = start; const end = until < to ? until : to;
  for (let guard = 0; guard < 4000 && d <= end && n < count; guard++) {
    if (R.FREQ === 'DAILY') { out.push(d); n++; d = addDays(d, interval); }
    else if (R.FREQ === 'WEEKLY') {
      const ws = addDays(d, -dow(d));
      const days = (byday || [dow(start)]).slice().sort();
      for (const k of days) { const x = addDays(ws, k); if (x >= start && x <= end && n < count) { out.push(x); n++; } }
      d = addDays(ws, 7 * interval);
    } else if (R.FREQ === 'MONTHLY') { out.push(d); n++; const dt = parseISO(d); dt.setMonth(dt.getMonth() + interval); d = iso(dt); }
    else if (R.FREQ === 'YEARLY') { out.push(d); n++; const dt = parseISO(d); dt.setFullYear(dt.getFullYear() + interval); d = iso(dt); }
    else { out.push(d); break; }
  }
  return out.filter((x) => x >= from);
}
