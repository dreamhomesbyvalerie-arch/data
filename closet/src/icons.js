/* ───────────── drawings: garment silhouettes (flat-lay) + UI line icons ───────────── */

// d = filled body, s = coloured stroke (jewellery, straps), x = thin seam/detail lines
const GARMENTS = {
  tee:       { d: 'M30 18L42 14Q50 21 58 14L70 18L87 33L78 43L70 37L70 86L30 86L30 37L22 43L13 33Z' },
  tank:      { d: 'M36 14L42 14Q50 27 58 14L64 14Q64 30 70 38L70 86L30 86L30 38Q36 30 36 14Z' },
  blouse:    { d: 'M30 18L42 13Q50 22 58 13L70 18L88 58L80 62L68 38L70 86Q50 90 30 86L32 38L20 62L12 58Z', x: 'M44 15Q50 30 56 15' },
  shirt:     { d: 'M30 18L42 12L50 20L58 12L70 18L86 62L78 65L68 40L68 88L32 88L32 40L22 65L14 62Z', x: 'M50 20L50 88M42 12L46 22L50 20L54 22L58 12' },
  sweater:   { d: 'M28 20Q50 12 72 20L88 64L78 68L68 42L69 84L31 84L32 42L22 68L12 64Z', x: 'M31 78L69 78M42 17Q50 24 58 17' },
  turtleneck:{ d: 'M28 20Q50 14 72 20L88 64L78 68L68 42L69 84L31 84L32 42L22 68L12 64ZM41 7L59 7L60 19Q50 22 40 19Z', x: 'M31 78L69 78M41 12L59 12' },
  jeans:     { d: 'M30 12L70 12L73 88L56 88L50 36L44 88L27 88Z', x: 'M30 19L70 19M50 19L50 36M34 19Q36 28 44 27M66 19Q64 28 56 27' },
  trousers:  { d: 'M30 12L70 12L72 88L56 88L50 34L44 88L28 88Z', x: 'M30 18L70 18M38 20L40 86M62 20L60 86' },
  wideleg:   { d: 'M32 12L68 12L80 88L54 88L50 40L46 88L20 88Z', x: 'M32 18L68 18' },
  leggings:  { d: 'M34 12L66 12L64 88L54 88L50 34L46 88L36 88Z', x: 'M34 17L66 17' },
  shorts:    { d: 'M28 30L72 30L77 68L54 70L50 50L46 70L23 68Z', x: 'M28 36L72 36' },
  skirtmini: { d: 'M34 28L66 28L77 68L23 68Z', x: 'M34 34L66 34' },
  skirtmidi: { d: 'M36 16L64 16L77 84L23 84Z', x: 'M36 22L64 22M44 24L40 84M56 24L60 84' },
  skirtmaxi: { d: 'M38 8L62 8L76 94L24 94Z', x: 'M38 14L62 14' },
  dress:     { d: 'M38 10L44 10Q50 18 56 10L62 10L64 30L60 40L74 88L26 88L40 40L36 30Z', x: 'M40 40L60 40' },
  dressmidi: { d: 'M37 8L44 8Q50 16 56 8L63 8L65 28L58 40L73 93L27 93L42 40L35 28Z', x: 'M42 40L58 40' },
  dressmaxi: { d: 'M40 5L45 5Q50 12 55 5L60 5L62 26L57 36L71 97L29 97L43 36L38 26Z', x: 'M43 36L57 36' },
  dresscocktail: { d: 'M40 16L60 16L62 32L58 40L74 78L26 78L42 40L38 32Z', x: 'M42 40L58 40' },
  jumpsuit:  { d: 'M38 8L44 8Q50 16 56 8L62 8L64 34L68 93L54 93L50 52L46 93L32 93L36 34Z', x: 'M36 36L64 36' },
  romper:    { d: 'M38 14L44 14Q50 21 56 14L62 14L64 40L71 72L52 72L50 60L48 72L29 72L36 40Z', x: 'M36 42L64 42' },
  cardigan:  { d: 'M28 18Q50 12 72 18L88 64L78 68L68 42L68 86L32 86L32 42L22 68L12 64Z', x: 'M44 15L50 40L50 86M44 15L50 40L56 15' },
  blazer:    { d: 'M28 16L42 12L50 40L58 12L72 16L86 62L78 66L68 42L68 86L32 86L32 42L22 66L14 62Z', x: 'M42 12L45 30L50 40M58 12L55 30L50 40M50 40L50 86' },
  vest:      { d: 'M34 12L42 12L50 40L58 12L66 12L70 84L30 84Z', x: 'M50 40L50 84' },
  jacket:    { d: 'M26 20L42 14L50 22L58 14L74 20L88 66L78 70L68 44L68 78L32 78L32 44L22 70L12 66Z', x: 'M50 22L50 78M32 70L68 70' },
  trench:    { d: 'M28 14L42 10L50 30L58 10L72 14L86 60L78 64L68 40L72 94L28 94L32 40L22 64L14 60Z', x: 'M31 54L69 54M50 30L50 94M42 10L46 24L50 30' },
  coat:      { d: 'M27 14L42 10L50 28L58 10L73 14L88 62L79 66L69 40L71 92L29 92L31 40L21 66L12 62Z', x: 'M50 28L50 92M42 10L46 22L50 28L54 22L58 10' },
  puffer:    { d: 'M26 16Q50 8 74 16L88 60L78 64L68 42L70 84L30 84L32 42L22 64L12 60Z', x: 'M31 34L69 34M31 50L69 50M31 66L69 66M50 14L50 84' },
  raincoat:  { d: 'M40 6Q50 0 60 6L62 14L74 18L86 62L78 66L68 42L70 90L30 90L32 42L22 66L14 62L26 18L38 14Z', x: 'M50 16L50 90M40 6Q50 18 60 6' },
  sneaker:   { d: 'M10 64L12 44Q24 46 34 36L46 36Q58 50 88 54Q95 58 92 66L10 66Z', x: 'M10 62L92 62M38 40L44 50M44 38L50 48' },
  loafer:    { d: 'M10 66L10 50Q24 47 38 52Q50 42 64 43Q84 46 92 59L92 66Z', x: 'M10 61L92 61M50 47Q57 50 60 56' },
  heel:      { d: 'M14 64Q18 48 30 50Q50 56 70 42L84 40Q89 42 86 48L80 50L78 76L74 76L74 52Q52 66 14 66Z' },
  mule:      { d: 'M14 62Q18 50 34 46Q46 44 56 52L86 56Q90 60 88 64L74 64L72 74L68 74L68 64L14 64Z' },
  bootie:    { d: 'M30 20L56 20L58 52Q80 54 90 62L90 70L28 70L28 56Z', x: 'M28 64L90 64M44 22L44 50' },
  boot:      { d: 'M36 6L60 6L60 60Q80 62 88 70L88 78L34 78Z', x: 'M34 72L88 72' },
  sandal:    { d: 'M10 64L92 62L92 69L10 70Z', s: 'M28 64Q38 42 52 63M58 63Q68 44 80 62', sw: 6 },
  tote:      { d: 'M24 40L76 40L72 88L28 88Z', s: 'M36 40Q36 16 50 16Q64 16 64 40', sw: 4 },
  shoulderbag:{ d: 'M22 46Q22 40 28 40L72 40Q78 40 78 46L76 82L24 82Z', s: 'M30 40Q50 6 70 40', sw: 4, x: 'M22 52L78 52' },
  crossbody: { d: 'M28 50L72 50L70 80L30 80Z', s: 'M30 50L20 8M70 50L80 8', sw: 3, x: 'M28 50L50 64L72 50' },
  clutch:    { d: 'M14 38L86 38L86 70L14 70Z', x: 'M14 38L50 58L86 38' },
  backpack:  { d: 'M30 24Q30 14 40 14L60 14Q70 14 70 24L72 86L28 86Z', x: 'M36 56L64 56L64 76L36 76Z' },
  necklace:  { s: 'M24 14Q26 62 50 68Q74 62 76 14', sw: 3, d: 'M50 68m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0' },
  earrings:  { s: 'M36 56m-13 0a13 13 0 1 0 26 0a13 13 0 1 0-26 0M64 56m-13 0a13 13 0 1 0 26 0a13 13 0 1 0-26 0', sw: 5 },
  bracelet:  { s: 'M50 52m-28 0a28 18 0 1 0 56 0a28 18 0 1 0-56 0', sw: 8 },
  watch:     { d: 'M42 10L58 10L58 90L42 90Z', s: 'M50 50m-15 0a15 15 0 1 0 30 0a15 15 0 1 0-30 0', sw: 5 },
  ring:      { s: 'M50 58m-17 0a17 17 0 1 0 34 0a17 17 0 1 0-34 0', sw: 6, d: 'M50 34m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0' },
  scarf:     { d: 'M28 8L58 8L60 56L72 92L52 92L46 60L40 92L22 92L30 56Z', x: 'M30 56L60 56' },
  belt:      { d: 'M8 44L92 44L92 58L8 58Z', s: 'M28 40L42 40L42 62L28 62Z', sw: 3 },
  hat:       { d: 'M30 54Q32 24 50 24Q68 24 70 54ZM10 56Q50 44 90 56Q50 68 10 56Z', x: 'M31 48L69 48' },
  sunglasses:{ d: 'M14 46Q14 38 22 38L42 38Q46 40 46 46Q44 62 30 62Q16 62 14 46ZM54 46Q54 40 58 38L78 38Q86 38 86 46Q84 62 70 62Q56 62 54 46Z', s: 'M46 44Q50 40 54 44', sw: 3 },
};

let _gid = 0;
function patternDef(id, pattern, c2) {
  const P = {
    Stripe: `<rect width="8" height="3.2" fill="${c2}"/>`, Plaid: `<rect width="8" height="2" fill="${c2}" opacity=".7"/><rect width="2" height="8" fill="${c2}" opacity=".7"/>`,
    Check: `<rect width="4" height="4" fill="${c2}" opacity=".8"/><rect x="4" y="4" width="4" height="4" fill="${c2}" opacity=".8"/>`,
    Floral: `<circle cx="2" cy="2" r="1.6" fill="${c2}"/><circle cx="6" cy="6" r="1" fill="${c2}" opacity=".7"/>`,
    Animal: `<ellipse cx="3" cy="3" rx="1.8" ry="1.2" fill="${c2}"/><ellipse cx="7" cy="7" rx="1" ry="1.4" fill="${c2}"/>`,
    'Polka dot': `<circle cx="4" cy="4" r="1.3" fill="${c2}"/>`, Print: `<path d="M0 8L8 0" stroke="${c2}" stroke-width="1.6"/>`, Texture: `<path d="M0 4L8 4" stroke="${c2}" stroke-width=".7" opacity=".55"/>`,
  }[pattern];
  return P ? `<pattern id="${id}" patternUnits="userSpaceOnUse" width="8" height="8">${P}</pattern>` : '';
}
function garmentSVG(item) {
  const sh = GARMENTS[itemShape(item)] || GARMENTS.tee;
  const c1 = primaryColor(item).hex; const lum = luminance(c1);
  const c2 = COLORS[(item.colors || [])[1]]?.hex || shade(c1, lum > 0.45 ? -0.32 : 0.42);
  const stroke = lum > 0.62 ? '#a9a49c' : shade(c1, -0.38);
  const id = 'gp' + (++_gid); const pd = item.pattern && item.pattern !== 'Solid' ? patternDef(id, item.pattern, c2) : '';
  let out = `<svg viewBox="0 0 100 100" class="gsvg" aria-hidden="true">${pd ? `<defs>${pd}</defs>` : ''}`;
  if (sh.s) out += `<path d="${sh.s}" fill="none" stroke="${c1}" stroke-width="${sh.sw || 4}" stroke-linecap="round"/>`;
  if (sh.d) { out += `<path d="${sh.d}" fill="${c1}" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>`; if (pd) out += `<path d="${sh.d}" fill="url(#${id})"/>`; }
  if (sh.x) out += `<path d="${sh.x}" fill="none" stroke="${stroke}" stroke-width="1.2" stroke-linecap="round" opacity=".75"/>`;
  return out + '</svg>';
}

/* UI icons, 24px grid, stroke = currentColor */
const IC = {
  today: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  week: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  closet: '<path d="M12 6a2 2 0 1 1 2 2c-1 .4-2 1-2 2v1"/><path d="M12 11 3 17.5c-.8.6-.4 1.5.6 1.5h16.8c1 0 1.4-.9.6-1.5L12 11Z"/>',
  looks: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  insights: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>', check: '<path d="m5 12 5 5 9-10"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m14 6 4 4"/>', trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', upload: '<path d="M12 16V4M7 9l5-5 5 5M4 20h16"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18Z"/>',
  cloudsun: '<path d="M9 18h8a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 8 11a3.5 3.5 0 0 0 1 7Z"/><path d="M5 3v1.5M1.5 7H3M2.5 3.5l1 1M8 4.5 9 3.5"/><path d="M4 9.5A3 3 0 0 1 8.5 6"/>',
  rain: '<path d="M7 14h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 5.5 4.3 4.3 0 0 0 7 14Z"/><path d="m8 17-1 3M12 17l-1 3M16 17l-1 3"/>',
  snow: '<path d="M7 14h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 5.5 4.3 4.3 0 0 0 7 14Z"/><path d="M8 18h.01M12 20h.01M16 18h.01"/>',
  storm: '<path d="M7 14h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 5.5 4.3 4.3 0 0 0 7 14Z"/><path d="m12 15-2 4h4l-2 4"/>', fog: '<path d="M4 9h16M4 13h16M6 17h12"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>', handshake: '<path d="m11 17 2 2a1.5 1.5 0 0 0 2-2M14 14l2.5 2.5a1.5 1.5 0 0 0 2-2L13 9l-2 2a1.7 1.7 0 0 1-2.4-2.4L12 5h3l5 5M3 10l4-4 4 1M3 10l6 6 2 2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M17 6l3 3M15 8l2 2"/>', laptop: '<rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 19h20"/>',
  coffee: '<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9ZM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>', wine: '<path d="M8 3h8l-.5 6a3.5 3.5 0 0 1-7 0L8 3ZM12 12.5V20M8.5 20h7"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>', diamond: '<path d="M6 4h12l3 5-9 11L3 9l3-5ZM3 9h18M9 4l3 16 3-16"/>',
  run: '<circle cx="14" cy="4.5" r="1.8"/><path d="m6 21 3-6 3 2 1-5 3 3h3M8 11l3-3 4 1"/>', plane: '<path d="M2 15l20-7-3 9-7-2-3 5v-6l10-7"/>', home: '<path d="M3 11 12 4l9 7M5 10v10h14V10"/>',
  left: '<path d="m15 5-7 7 7 7"/>', right: '<path d="m9 5 7 7-7 7"/>', down: '<path d="m5 9 7 7 7-7"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  sparkles: '<path d="M10 3 8.5 8.5 3 10l5.5 1.5L10 17l1.5-5.5L17 10l-5.5-1.5L10 3ZM18 15l-.8 2.2L15 18l2.2.8L18 21l.8-2.2L21 18l-2.2-.8L18 15Z"/>',
  suitcase: '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V4h6v3M9 11v6M15 11v6"/>', tag: '<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="8.5" r="1.3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>', refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.7L20 9M20 4v5h-5"/>', more: '<path d="M5 12h.01M12 12h.01M19 12h.01"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>', file: '<path d="M6 3h8l5 5v13H6V3ZM14 3v5h5"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>', drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>', pin: '<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  wash: '<path d="M3 7h18l-2 11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L3 7ZM3 7c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/>', needle: '<path d="M20 4 6 18M17 4h3v3M6 18l-2 2M10 8c-3 0-6 2-6 5"/>',
  hanger: '<path d="M12 6a2 2 0 1 1 2 2c-1 .4-2 1-2 2v1"/><path d="M12 11 3 17.5c-.8.6-.4 1.5.6 1.5h16.8c1 0 1.4-.9.6-1.5L12 11Z"/>',
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || IC.info}</svg>`;
const kindIcon = (k) => icon(KINDS[k]?.icon || 'info');
