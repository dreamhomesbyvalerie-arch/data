/* ───────────── UI plumbing: shell, router, sheets, toasts, shared components ───────────── */
const ROUTES = { today: 'Today', week: 'Week', closet: 'Closet', looks: 'Looks', insights: 'Insights', trips: 'Trips', profile: 'Profile' };
const UI = { route: 'today', closet: { q: '', cat: 'all', status: 'active', sort: 'recent' }, looksTab: 'saved', weekOffset: 0, weekTab: 'plan', sheetStack: [] };
const ACT = {};

function routeFromHash() { const h = (location.hash || '').replace('#', ''); return ROUTES[h] ? h : 'today'; }
function go(r) { if (location.hash !== '#' + r) location.hash = r; else render(); }

let toastTimer;
function toast(msg, action) {
  $('.toast')?.remove(); clearTimeout(toastTimer);
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { t.remove(); action.fn(); };
  document.body.appendChild(t); toastTimer = setTimeout(() => t.remove(), action ? 6500 : 3600);
}

/* ---------- sheets (bottom sheet on phones, dialog on desktop) ---------- */
function openSheet({ title, body = '', foot = '', wide = false, onMount, onClose, id }) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const el = document.createElement('section'); el.className = 'sheet' + (wide ? ' wide' : ''); el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', title);
  if (id) el.dataset.sheet = id;
  el.innerHTML = `<div class="grab"></div><header class="sheet-h"><h2>${esc(title)}</h2><button class="iconbtn" data-close aria-label="Close">${icon('close')}</button></header><div class="sheet-b">${body}</div>${foot ? `<footer class="sheet-f">${foot}</footer>` : ''}`;
  const entry = { el, scrim, onClose };
  const close = () => { scrim.remove(); el.remove(); UI.sheetStack = UI.sheetStack.filter((s) => s !== entry); onClose?.(); if (!UI.sheetStack.length) document.body.style.overflow = ''; };
  entry.close = close; scrim.onclick = close; el.querySelector('[data-close]').onclick = close;
  document.body.append(scrim, el); document.body.style.overflow = 'hidden'; UI.sheetStack.push(entry);
  el.close = close; onMount?.(el, close);
  setTimeout(() => el.querySelector('input:not([type=checkbox]):not([type=file]):not([type=range]), textarea')?.focus({ preventScroll: true }), 60);
  return el;
}
function closeTopSheet() { UI.sheetStack[UI.sheetStack.length - 1]?.close(); }
function closeAllSheets() { [...UI.sheetStack].reverse().forEach((s) => s.close()); }
function setSheet(el, { body, foot, title }) {
  if (title != null) el.querySelector('.sheet-h h2').textContent = title;
  if (body != null) el.querySelector('.sheet-b').innerHTML = body;
  if (foot != null) { let f = el.querySelector('.sheet-f'); if (!f) { f = document.createElement('footer'); f.className = 'sheet-f'; el.appendChild(f); } f.innerHTML = foot; if (!foot) f.remove(); }
}
function confirmSheet(title, text, okLabel, fn, danger = true) {
  openSheet({ title, body: `<p class="muted">${esc(text)}</p>`, foot: `<button class="btn" data-close2>Cancel</button><button class="btn ${danger ? 'dark' : 'primary'}" data-ok>${esc(okLabel)}</button>`,
    onMount: (el, close) => { el.querySelector('[data-close2]').onclick = close; el.querySelector('[data-ok]').onclick = () => { close(); fn(); }; } });
}

/* ---------- pieces + boards ---------- */
function pieceHTML(it, o = {}) {
  if (!it) return '';
  const src = Store.photoSrc(it.photo);
  const pk = it.photo?.k && !src ? ` data-pk="${it.photo.k}"` : '';
  const art = src || pk ? `<img src="${esc(src || '')}" alt=""${pk} ${src ? '' : 'hidden'} loading="lazy">${src ? '' : garmentSVG(it)}` : garmentSVG(it);
  const inner = `${art}${o.lock ? `<span class="lockmark" title="Locked">${icon('lock')}</span>` : ''}${o.cap ? `<span class="cap">${esc(it.name)}</span>` : ''}`;
  const cls = `piece ${o.cls || ''}`;
  if (o.act) return `<button type="button" class="${cls}" data-act="${o.act}" data-id="${it.id}"${o.role ? ` data-role="${o.role}"` : ''}${o.date ? ` data-date="${o.date}"` : ''} aria-label="${esc(it.name)}">${inner}</button>`;
  return `<div class="${cls}" title="${esc(it.name)}">${inner}</div>`;
}
function arrange(items) {
  const g = { outer: [], layer: [], main: [], side: [] };
  for (const it of items) {
    const s = slotOf(it);
    if (s === 'outer') g.outer.push(it); else if (s === 'layer') g.layer.push(it);
    else if (s === 'top' || s === 'bottom' || s === 'dress' || s === 'active') g.main.push(it); else g.side.push(it);
  }
  const order = { dress: 0, top: 1, active: 1, bottom: 2 }; g.main.sort((a, b) => (order[slotOf(a)] ?? 3) - (order[slotOf(b)] ?? 3));
  const so = { shoes: 0, bag: 1, acc: 2 }; g.side.sort((a, b) => (so[slotOf(a)] ?? 3) - (so[slotOf(b)] ?? 3));
  return g;
}
function boardHTML(ids, o = {}) {
  const items = (ids || []).map((id) => S.items.get(id)).filter(Boolean);
  if (!items.length) return `<div class="board"><div class="board-empty">${o.empty || 'No outfit yet.'}</div></div>`;
  const g = arrange(items); const locks = o.locks || {};
  const P = (it, cls) => pieceHTML(it, { cls, cap: o.caps !== false, act: o.act, date: o.date, role: slotOf(it), lock: Object.values(locks).includes(it.id) });
  const left = [...g.outer, ...g.layer];
  const cols = left.length ? '' : 'grid-template-columns:1.5fr .85fr;grid-template-areas:"main side"';
  return `<div class="board" style="${cols}">
    ${left.length ? `<div class="col c-left">${left.map((it) => P(it, 'tall')).join('')}</div>` : ''}
    <div class="col c-main">${g.main.map((it) => P(it, g.main.length === 1 ? 'tall' : '')).join('')}</div>
    <div class="col c-side">${g.side.filter((it) => slotOf(it) !== 'acc').map((it) => P(it, 'sm')).join('')}${(() => { const a = g.side.filter((it) => slotOf(it) === 'acc'); return a.length ? `<div class="accs ${a.length === 1 ? 'one' : ''}">${a.map((it) => P(it, 'sm')).join('')}</div>` : ''; })()}</div></div>`;
}
function miniHTML(ids, max = 8) {
  const items = (ids || []).map((id) => S.items.get(id)).filter(Boolean); const g = arrange(items);
  const list = [...g.outer, ...g.layer, ...g.main, ...g.side].slice(0, max);
  if (!list.length) return `<div class="mini" style="grid-template-columns:1fr"><div class="piece" style="aspect-ratio:4/1;font-size:12px;color:#777">No outfit</div></div>`;
  return `<div class="mini ${list.length > 4 && list.length !== 6 && list.length < 9 ? '' : ''}" style="grid-template-columns:repeat(${Math.min(list.length, 4)},1fr)">${list.map((it) => pieceHTML(it, { cls: 'sm' })).join('')}</div>`;
}
function virtualItem(sub, color, pattern = 'Solid') { const cat = Object.keys(CATS).find((k) => CATS[k].subs.includes(sub)) || 'top'; return { id: 'v' + sub, name: sub, cat, sub, colors: [color], pattern }; }

function wxInline(w, { big = false } = {}) {
  if (!w) return '';
  return `<span class="wx">${icon(wxIcon(w))}<span class="num">${tempOut(w.hi)} / ${tempOut(w.lo)}</span>${(w.rain ?? 0) >= 20 ? `<span class="muted small num">${icon('drop', 'xs')} ${w.rain}%</span>` : ''}</span>`;
}
function kindChip(k, extra = '') { return `<span class="chip soft">${kindIcon(k)}${esc(KINDS[k]?.label || k)}${extra}</span>`; }
function emptyArt() {
  const a = virtualItem('Blazer', 'navy'), b = virtualItem('Tee', 'white'), c = virtualItem('Jeans', 'denim');
  return `<div class="mini" style="width:200px;grid-template-columns:repeat(3,1fr)">${[a, b, c].map((x) => pieceHTML(x, { cls: 'sm' })).join('')}</div>`;
}
function selectHTML(id, opts, val, cls = 'input') {
  return `<select class="${cls}" id="${id}">${opts.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(val) ? ' selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
}
function swatchesHTML(name, selected = [], { max = 2 } = {}) {
  return `<div class="swatches" data-swatches="${name}" data-max="${max}">${Object.entries(COLORS).map(([k, c]) =>
    `<button type="button" class="sw" style="background:${c.multi ? 'conic-gradient(#e59ab2,#e8c547,#3e7c4f,#2f5daa,#6a4c92,#e59ab2)' : c.hex}" aria-pressed="${selected.includes(k)}" data-color="${k}" title="${c.label}" aria-label="${c.label}"></button>`).join('')}</div>`;
}
function bindSwatches(root, onChange) {
  $$('[data-swatches]', root).forEach((box) => box.addEventListener('click', (e) => {
    const b = e.target.closest('.sw'); if (!b) return; const max = +box.dataset.max;
    const on = $$('.sw[aria-pressed="true"]', box).map((x) => x.dataset.color);
    if (b.getAttribute('aria-pressed') === 'true') b.setAttribute('aria-pressed', 'false');
    else { if (max === 1 || on.length >= max) { if (max <= 2) $$('.sw', box).forEach((x) => { if (max === 1 || x.dataset.color === on[on.length - 1]) x.setAttribute('aria-pressed', 'false'); }); else return; } b.setAttribute('aria-pressed', 'true'); }
    onChange?.(swatchVal(box));
  }));
}
function swatchVal(box) {
  // keep click order: primary first
  return $$('.sw[aria-pressed="true"]', box).map((x) => x.dataset.color);
}
function chipToggleGroup(root, sel, multi = true, onChange) {
  $$(sel, root).forEach((g) => g.addEventListener('click', (e) => {
    const b = e.target.closest('[aria-pressed]'); if (!b || !g.contains(b)) return;
    if (!multi) $$('[aria-pressed]', g).forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true' || !multi));
    onChange?.(g);
  }));
}
const pressedVals = (g, attr = 'v') => $$('[aria-pressed="true"]', g).map((b) => b.dataset[attr]);

/* hover tooltips for charts */
document.addEventListener('pointerover', (e) => {
  const t = e.target.closest?.('[data-tip]'); $('.tip')?.remove(); if (!t) return;
  const d = document.createElement('div'); d.className = 'tip'; d.textContent = t.dataset.tip; document.body.appendChild(d);
  const r = t.getBoundingClientRect(); const w = d.offsetWidth;
  d.style.left = clamp(r.left + r.width / 2 - w / 2, 8, innerWidth - w - 8) + 'px'; d.style.top = Math.max(8, r.top - d.offsetHeight - 8) + 'px';
});

/* ---------- shell ---------- */
function shellHTML() {
  const p = S.profile; const init = (p.name || 'You').trim().charAt(0).toUpperCase();
  const tabs = [['today', 'today', 'Today'], ['week', 'week', 'Week'], ['closet', 'closet', 'Closet'], ['looks', 'looks', 'Looks'], ['insights', 'insights', 'Insights']];
  const cur = UI.route === 'trips' ? 'week' : UI.route;
  return `<div class="shell">
  <header class="topbar"><div class="topbar-in">
    <a class="wordmark" href="#today" aria-label="Valet home">Valet<i>.</i></a>
    <span class="mode-pill" title="${Store.mode === 'cloud' ? 'Your closet syncs through Claude' : 'Saved in this browser'}">${Store.mode === 'cloud' ? 'Synced via Claude' : 'On this device'}</span>
    <span class="grow"></span>
    <button class="iconbtn" data-act="search" aria-label="Search closet">${icon('search')}</button>
    <a class="avatar" href="#profile" aria-label="Profile and settings" style="text-decoration:none">${esc(init)}</a>
  </div></header>
  ${Store.status ? `<div class="banner" style="padding:0 16px"><div class="note warn">${icon('info')}<span>${esc(Store.status)}</span></div></div>` : ''}
  <main id="main"></main>
  <nav class="tabbar" aria-label="Sections">${tabs.map(([r, ic, l]) => `<a class="tab" href="#${r}" ${cur === r ? 'aria-current="page"' : ''}>${icon(ic)}<span>${l}</span></a>`).join('')}</nav>
  <button class="fab" data-act="add">${icon('plus')}<span>Add</span></button>
</div>`;
}

let renderQueued = false;
function scheduleRender() { if (renderQueued) return; renderQueued = true; requestAnimationFrame(() => { renderQueued = false; if (!UI.sheetStack.length) render(); else renderMainOnly(); }); }
function render() {
  UI.route = routeFromHash();
  const app = $('#app'); const y = scrollY;
  app.innerHTML = shellHTML(); renderMainOnly();
  document.title = 'Valet Wardrobe';
  if (UI.lastRoute === UI.route) scrollTo(0, y); UI.lastRoute = UI.route;
}
function renderMainOnly() {
  const m = $('#main'); if (!m) return;
  const V = { today: viewToday, week: viewWeek, trips: viewTrips, closet: viewCloset, looks: viewLooks, insights: viewInsights, profile: viewProfile }[UI.route] || viewToday;
  try { m.innerHTML = `<div class="page">${V()}</div>`; } catch (e) { console.error(e); m.innerHTML = `<div class="page"><div class="note warn">${icon('info')}<span>Something went wrong drawing this page: ${esc(e.message)}</span></div></div>`; }
  afterRender?.();
}
addEventListener('scroll', () => $('.topbar')?.classList.toggle('scrolled', scrollY > 4), { passive: true });

/* global action dispatch */
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  const fn = ACT[a.dataset.act]; if (!fn) return;
  e.preventDefault(); fn(a, e);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && UI.sheetStack.length) closeTopSheet(); });
