/* ───────────── small helpers ───────────── */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sum = (a) => a.reduce((s, v) => s + (+v || 0), 0);
const by = (fn, dir = 1) => (a, b) => { const x = fn(a), y = fn(b); return x < y ? -dir : x > y ? dir : 0; };
const clone = (o) => (o == null ? o : JSON.parse(JSON.stringify(o)));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const cap = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);
const plural = (n, w, pw) => `${n} ${n === 1 ? w : (pw || w + 's')}`;

function lsGet(k, d) { try { const v = localStorage.getItem('valet:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } }
function lsSet(k, v) { try { localStorage.setItem('valet:' + k, JSON.stringify(v)); } catch { /* storage blocked */ } }

/* dates — always local calendar days as YYYY-MM-DD */
const pad = (n) => String(n).padStart(2, '0');
const iso = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const today = () => iso(new Date());
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const dow = (s) => parseISO(s).getDay();
const fmtDay = (s) => { const d = parseISO(s); return `${DOW[d.getDay()]} ${MON[d.getMonth()]} ${d.getDate()}`; };
const fmtLong = (s) => { const d = parseISO(s); return `${DOW_LONG[d.getDay()]}, ${MON_LONG[d.getMonth()]} ${d.getDate()}`; };
const fmtShort = (s) => { const d = parseISO(s); return `${MON[d.getMonth()]} ${d.getDate()}`; };
const fmtMonthYear = (s) => { const d = parseISO(s); return `${MON[d.getMonth()]} ${d.getFullYear()}`; };
function weekStartOf(s, startDow = 1) { const d = parseISO(s); const diff = (d.getDay() - startDow + 7) % 7; d.setDate(d.getDate() - diff); return iso(d); }
function seasonOf(s, lat = 38) {
  const m = parseISO(s).getMonth();
  const north = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'][m];
  if (lat >= 0) return north;
  return { winter: 'summer', summer: 'winter', spring: 'fall', fall: 'spring' }[north];
}
function relDays(s) {
  if (!s) return 'never';
  const n = daysBetween(s, today());
  if (n <= 0) return 'today'; if (n === 1) return 'yesterday'; if (n < 14) return `${n} days ago`;
  if (n < 60) return `${Math.round(n / 7)} weeks ago`; if (n < 365) return `${Math.round(n / 30)} months ago`;
  return `${(n / 365).toFixed(1).replace('.0', '')} years ago`;
}

/* money */
const money = (v, dec) => {
  if (v == null || v === '' || isNaN(v)) return '—';
  const d = dec ?? (Math.abs(v) < 10 && v % 1 ? 2 : 0);
  return '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};
const parseMoney = (s) => { const m = String(s ?? '').replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };

/* temperatures are stored in °F; shown in the profile's unit */
const tempOut = (f) => (f == null ? '–' : Math.round(S.profile?.units === 'C' ? (f - 32) * 5 / 9 : f) + '°');

function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

/* colour maths for photo swatches */
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbDist(a, b) { const rm = (a[0] + b[0]) / 2; const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]; return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db); }
function nearestColor(rgb) {
  let best = 'grey', bd = Infinity;
  for (const [k, c] of Object.entries(COLORS)) { if (c.multi || c.metal) continue; const d = rgbDist(rgb, hexToRgb(c.hex)); if (d < bd) { bd = d; best = k; } }
  return best;
}
function shade(hex, amt) { const [r, g, b] = hexToRgb(hex); const f = (v) => clamp(Math.round(v + (amt < 0 ? v * amt : (255 - v) * amt)), 0, 255); return '#' + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join(''); }
function luminance(hex) { const [r, g, b] = hexToRgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; }

/* CSV */
function parseCSV(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; continue; }
    if (c === '"') q = true; else if (c === ',' || c === '\t') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}
const csvCell = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

/* images: resize to a JPEG blob */
function loadImage(src) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
async function fileToImage(file) { const url = URL.createObjectURL(file); try { return await loadImage(url); } finally { setTimeout(() => URL.revokeObjectURL(url), 5000); } }
function imageToBlob(img, max = 900, q = 0.84) {
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
  return new Promise((res) => c.toBlob((b) => res(b), 'image/jpeg', q));
}
function blobToDataURL(b) { return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); }); }

/* dominant garment colour: ignore the background (estimated from the border) */
function dominantColors(img) {
  const N = 64; const c = document.createElement('canvas'); c.width = N; c.height = N;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, N, N);
  const px = x.getImageData(0, 0, N, N).data; const at = (i, j) => { const o = (j * N + i) * 4; return [px[o], px[o + 1], px[o + 2]]; };
  const border = []; for (let i = 0; i < N; i += 4) { border.push(at(i, 0), at(i, N - 1), at(0, i), at(N - 1, i)); }
  const bg = [0, 1, 2].map((k) => sum(border.map((p) => p[k])) / border.length);
  const counts = {};
  for (let j = 6; j < N - 6; j++) for (let i = 6; i < N - 6; i++) {
    const p = at(i, j); if (rgbDist(p, bg) < 70) continue;
    const k = nearestColor(p); const w = 1 - Math.hypot(i - N / 2, j - N / 2) / N; counts[k] = (counts[k] || 0) + w;
  }
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!ranked.length) return [nearestColor(bg)];
  const total = sum(ranked.map((r) => r[1]));
  return ranked.filter((r, i) => i === 0 || r[1] / total > 0.22).slice(0, 2).map((r) => r[0]);
}
