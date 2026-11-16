/* ───────────── sheets: editing, importing, styling ───────────── */
function refreshSheets() { UI.sheetStack.forEach((s) => s.el.refresh?.()); }
function subSelectHTML(id, cat, sub) {
  return `<select class="input" id="${id}">${CAT_ORDER.map((k) => `<optgroup label="${CATS[k].label}">${CATS[k].subs.map((s) => `<option value="${k}|${esc(s)}"${k === cat && s === sub ? ' selected' : ''}>${esc(s)}</option>`).join('')}</optgroup>`).join('')}</select>`;
}

/* ---------- item editor ---------- */
function openItemSheet(id, preset = {}) {
  const existing = id ? S.items.get(id) : null;
  const it = existing ? clone(existing) : newItem(preset);
  let touchedLevels = !!existing; let newPhoto = null;
  const body = () => {
    const n = wearsOf(it); const c = cpw(it);
    return `<div class="row" style="gap:14px;align-items:flex-start">
      <div style="width:120px;flex:none" class="stack"><div id="ie-piece">${pieceHTML(it, { cls: 'tall' })}</div>
        <label class="btn sm block">${icon('camera')}${it.photo ? 'Replace' : 'Photo'}<input type="file" accept="image/*" id="ie-photo" hidden></label>
        ${it.photo ? `<button class="btn quiet sm" id="ie-nophoto">Remove photo</button>` : ''}
        ${AI.on && AI.images && it.photo ? `<button class="btn sm" id="ie-ai">${icon('sparkles')}Auto-fill</button>` : ''}</div>
      <div class="stack grow">
        <label class="field"><span>Name</span><input class="input" id="ie-name" value="${esc(it.name)}" placeholder="e.g. Camel crewneck sweater"></label>
        <label class="field"><span>Type</span>${subSelectHTML('ie-sub', it.cat, it.sub)}</label>
        <div class="toggle" style="padding:4px 0;border:0"><span class="label">Favorite</span><input type="checkbox" class="switch" id="ie-fav" ${it.fav ? 'checked' : ''}></div>
      </div></div>
    ${existing ? `<div class="row wrap"><span class="tagline"><span>${plural(n, 'wear')}</span><span>${c != null ? money(c, c < 10 ? 2 : 0) + '/wear' : 'no price'}</span><span>last ${relDays(lastWorn(it))}</span></span></div>` : ''}
    <div class="field"><span>Colors <span class="muted">(main first, up to two)</span></span>${swatchesHTML('ie-colors', it.colors, { max: 2 })}</div>
    <div class="grid2"><label class="field"><span>Pattern</span>${selectHTML('ie-pattern', PATTERNS, it.pattern)}</label><label class="field"><span>Material</span>${selectHTML('ie-mat', [['', '—'], ...MATERIALS], it.material)}</label></div>
    <div class="grid2"><label class="field"><span>Warmth: <b id="ie-wl">${WARMTH_LEVELS[Math.round(it.warmth)]}</b></span><input type="range" class="range" min="1" max="5" step="1" id="ie-warm" value="${it.warmth}"></label>
      <label class="field"><span>Dress level: <b id="ie-fl">${DRESS_LEVELS[Math.round(it.formality)]}</b></span><input type="range" class="range" min="1" max="5" step="0.5" id="ie-form" value="${it.formality}"></label></div>
    <div class="field"><span>Seasons <span class="muted">(none = all year)</span></span><div class="chips" id="ie-seasons">${SEASONS.map((s) => `<button class="chip" aria-pressed="${(it.seasons || []).includes(s)}" data-v="${s}">${cap(s)}</button>`).join('')}</div></div>
    <div class="field"><span>Great for</span><div class="chips" id="ie-occ">${KIND_ORDER.map((k) => `<button class="chip" aria-pressed="${(it.occasions || []).includes(k)}" data-v="${k}">${KINDS[k].label}</button>`).join('')}</div></div>
    <div class="grid2"><label class="field"><span>Brand / designer</span><input class="input" id="ie-brand" value="${esc(it.brand)}"></label>
      <label class="field"><span>Store</span><input class="input" id="ie-store" list="store-list" value="${esc(it.store)}"><datalist id="store-list">${STORE_NAMES.map((s) => `<option value="${esc(s)}">`).join('')}</datalist></label></div>
    <div class="grid3"><label class="field"><span>Price</span><input class="input num" id="ie-price" inputmode="decimal" value="${it.price ?? ''}" placeholder="$"></label>
      <label class="field"><span>Purchased</span><input class="input" type="date" id="ie-date" value="${esc(it.purchased || '')}"></label>
      <label class="field"><span>Size</span><input class="input" id="ie-size" value="${esc(it.size)}"></label></div>
    <div class="grid2"><label class="field"><span>Status</span>${selectHTML('ie-status', Object.entries(STATUSES), it.status || 'active')}</label>
      <label class="field"><span>Wears before Valet</span><input class="input num" id="ie-prior" inputmode="numeric" value="${it.priorWears || ''}" placeholder="0"></label></div>
    <label class="field"><span>Notes</span><textarea class="input" id="ie-notes" style="min-height:70px" placeholder="Care, fit, tailoring, who gave it to you…">${esc(it.notes)}</textarea></label>
    ${existing ? `<div class="card flat stack"><div class="row between"><strong>Wear log</strong><div class="row"><input class="input" type="date" id="ie-wdate" value="${today()}" style="width:150px;min-height:34px"><button class="btn sm primary" id="ie-logwear">${icon('check')}Log wear</button></div></div>
      ${(it.wears || []).length ? `<div class="wear-dots">${[...it.wears].reverse().slice(0, 40).map((d) => `<button class="chip" data-wd="${d}" title="Remove this wear">${fmtShort(d)}${d.slice(0, 4) !== today().slice(0, 4) ? ' ' + d.slice(0, 4) : ''} ×</button>`).join('')}</div>` : '<p class="small muted">Not worn yet.</p>'}</div>
      <button class="btn" id="ie-style">${icon('sparkles')}Style this piece</button><div id="ie-looks" class="looks-grid"></div>` : ''}`;
  };
  const foot = `${existing ? `<button class="btn quiet danger" id="ie-del">${icon('trash')}Delete</button><span class="grow"></span>` : ''}<button class="btn" data-close2>Cancel</button><button class="btn primary" id="ie-save">Save</button>`;
  openSheet({ title: existing ? existing.name || 'Piece' : 'New piece', body: body(), foot, onMount: (el, close) => {
    const read = () => {
      it.name = $('#ie-name', el).value.trim(); const [c, s] = $('#ie-sub', el).value.split('|'); it.cat = c; it.sub = s;
      it.fav = $('#ie-fav', el).checked; const cols = swatchVal($('[data-swatches]', el)); it.colors = cols.length ? cols : it.colors;
      it.pattern = $('#ie-pattern', el).value; it.material = $('#ie-mat', el).value; it.warmth = +$('#ie-warm', el).value; it.formality = +$('#ie-form', el).value;
      it.seasons = pressedVals($('#ie-seasons', el)); it.occasions = pressedVals($('#ie-occ', el)); it.brand = $('#ie-brand', el).value.trim(); it.store = $('#ie-store', el).value.trim();
      it.price = parseMoney($('#ie-price', el).value); it.purchased = $('#ie-date', el).value; it.size = $('#ie-size', el).value.trim(); it.status = $('#ie-status', el).value;
      it.notes = $('#ie-notes', el).value; it.priorWears = parseInt($('#ie-prior', el).value) || 0;
    };
    const redrawPiece = () => { read(); $('#ie-piece', el).innerHTML = pieceHTML(it, { cls: 'tall' }); };
    const bind = () => {
      bindSwatches(el, redrawPiece); chipToggleGroup(el, '#ie-seasons, #ie-occ');
      $('#ie-sub', el).onchange = () => { const [c, s] = $('#ie-sub', el).value.split('|'); if (!touchedLevels) { const [w, f] = subDefaults(s); $('#ie-warm', el).value = w; $('#ie-form', el).value = f; $('#ie-wl', el).textContent = WARMTH_LEVELS[w]; $('#ie-fl', el).textContent = DRESS_LEVELS[Math.round(f)]; } redrawPiece(); };
      $('#ie-pattern', el).onchange = redrawPiece;
      $('#ie-warm', el).oninput = (e) => { touchedLevels = true; $('#ie-wl', el).textContent = WARMTH_LEVELS[+e.target.value]; };
      $('#ie-form', el).oninput = (e) => { touchedLevels = true; $('#ie-fl', el).textContent = DRESS_LEVELS[Math.round(+e.target.value)]; };
      $('#ie-photo', el).onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return; read();
        try { const img = await fileToImage(f); const blob = await imageToBlob(img); it.photo = await Store.savePhoto(blob); newPhoto = it.photo; if (!existing) it.colors = dominantColors(img); }
        catch { toast('That photo couldn’t be opened. Try a JPEG or PNG.'); return; }
        setSheet(el, { body: body() }); bind();
      };
      $('#ie-nophoto', el)?.addEventListener('click', () => { read(); Store.deletePhoto(it.photo); it.photo = null; setSheet(el, { body: body() }); bind(); });
      $('#ie-ai', el)?.addEventListener('click', async (e) => {
        const b = e.currentTarget; b.disabled = true; b.innerHTML = '<span class="spinner"></span>Reading…';
        try {
          const src = Store.photoSrc(it.photo); const blob = await (await fetch(src)).blob(); const r = await AI.tagPhoto(blob); read(); applyTags(it, r); touchedLevels = true; setSheet(el, { body: body() }); bind();
        } catch (er) { toast(AI.errCopy(er)); b.disabled = false; b.innerHTML = `${icon('sparkles')}Auto-fill`; }
      });
      $('#ie-logwear', el)?.addEventListener('click', () => { read(); const d = $('#ie-wdate', el).value || today(); it.wears = [...new Set([...(it.wears || []), d])].sort(); save(false); toast(`Logged a wear on ${fmtShort(d)}.`); setSheet(el, { body: body() }); bind(); });
      $$('[data-wd]', el).forEach((b) => (b.onclick = () => { read(); it.wears = (it.wears || []).filter((d) => d !== b.dataset.wd); save(false); setSheet(el, { body: body() }); bind(); }));
      $('#ie-style', el)?.addEventListener('click', () => {
        read(); const role = slotOf(it) === 'acc' ? 'acc' : slotOf(it); const looks = [];
        for (let k = 0; k < 3; k++) { const ctx = dayContext(today(), { lock: { [role]: it.id }, f: it.formality, jitter: 2.4, used: new Map(looks.flatMap((l) => l.items).map((x) => [x, 1])) }); const r = buildOutfit(ctx, 20); if (r) looks.push(r); }
        $('#ie-looks', el).innerHTML = looks.map((l) => `<div class="look">${boardHTML(l.items, { caps: false })}<button class="btn sm" data-act="save-items" data-items="${l.items.join(',')}">${icon('heart')}Save look</button></div>`).join('') || '<p class="small muted">Add a few more pieces to style this one.</p>';
      });
    };
    const save = (closeAfter = true) => {
      read(); if (!it.name) it.name = `${COLORS[it.colors[0]]?.label || ''} ${it.sub.toLowerCase()}`.trim();
      Store.put('items', it); if (closeAfter) { close(); toast(existing ? 'Saved.' : `Added ${it.name}.`); afterClosetChange(); } scheduleRender();
    };
    $('#ie-save', el).onclick = () => save(true);
    el.querySelector('[data-close2]').onclick = () => { if (!existing && newPhoto) Store.deletePhoto(newPhoto); close(); };
    $('#ie-del', el)?.addEventListener('click', () => confirmSheet('Delete this piece?', `${existing.name} and its wear history will be removed. To keep the history, set its status to “Gone” instead.`, 'Delete', () => {
      Store.deletePhoto(existing.photo); Store.del('items', existing.id); close(); toast('Deleted.'); scheduleRender();
    }));
    bind();
  } });
}
function applyTags(it, r) {
  if (!r || typeof r !== 'object') return;
  if (r.name) it.name = String(r.name).slice(0, 80);
  if (r.cat && CATS[r.cat]) { it.cat = r.cat; if (CATS[r.cat].subs.includes(r.sub)) it.sub = r.sub; else it.sub = CATS[r.cat].subs[0]; }
  if (Array.isArray(r.colors)) { const c = r.colors.filter((x) => COLORS[x]); if (c.length) it.colors = c.slice(0, 2); }
  if (PATTERNS.includes(r.pattern)) it.pattern = r.pattern; if (MATERIALS.includes(r.material)) it.material = r.material;
  if (r.warmth >= 1 && r.warmth <= 5) it.warmth = Math.round(r.warmth); if (r.formality >= 1 && r.formality <= 5) it.formality = Math.round(r.formality * 2) / 2;
  if (Array.isArray(r.seasons)) it.seasons = r.seasons.filter((s) => SEASONS.includes(s));
}

/* ---------- add / import ---------- */
function openAddSheet() {
  const opt = (act, ic, t, d, extra = '') => `<button class="li-btn" data-act="${act}">${icon(ic)}<span class="grow"><strong>${t}</strong><br><span class="small muted">${d}</span></span>${extra}${icon('right')}</button>`;
  openSheet({ title: 'Add to your closet', body: `<div class="list">
    <label class="li-btn" style="cursor:pointer">${icon('camera')}<span class="grow"><strong>Photos</strong><br><span class="small muted">Snap or pick one or many. Valet reads the colors${AI.on && AI.images ? ' and Claude fills in the details' : ''}.</span></span>${icon('right')}<input type="file" accept="image/*" multiple id="add-photos" hidden></label>
    ${opt('new-item', 'edit', 'One piece by hand', 'Type it in. Takes 20 seconds.')}
    ${opt('paste-order', 'file', 'Paste an order email or receipt', 'Stitch Fix, Nordstrom, Gap, Old Navy or any store.')}
    ${IN_CLAUDE ? opt('gmail', 'mail', 'Find orders in Gmail', 'Searches order confirmations from 25+ clothing stores.') : ''}
    ${opt('csv', 'upload', 'Spreadsheet (CSV)', 'Bring a list you already keep. Columns are matched for you.')}
    ${opt('retailers', 'tag', 'Store-by-store guide', 'Where to find your purchase history at each retailer.')}
  </div>`, onMount: (el, close) => { $('#add-photos', el).onchange = (e) => { const files = [...e.target.files]; close(); if (files.length) importPhotos(files); }; } });
}
async function importPhotos(files) {
  const el = openSheet({ title: `Adding ${plural(files.length, 'photo')}`, body: `<div class="row"><span class="spinner"></span><span id="ph-msg">Preparing photos…</span></div>` });
  const cands = []; const useAI = AI.on && AI.images;
  for (let k = 0; k < files.length; k++) {
    const m = $('#ph-msg', el); if (m) m.textContent = `${useAI ? 'Reading' : 'Preparing'} photo ${k + 1} of ${files.length}…`;
    try {
      const img = await fileToImage(files[k]); const blob = await imageToBlob(img); const photo = await Store.savePhoto(blob);
      const it = newItem({ photo, colors: dominantColors(img), source: 'photo', name: '' });
      if (useAI) { try { applyTags(it, await AI.tagPhoto(blob)); } catch (e) { if (e?.code === 'not_granted') { /* keep going without */ } } }
      if (!it.name) { const g = inferCategory(files[k].name.replace(/\.[a-z]+$/i, '').replace(/[_-]+/g, ' ')); if (g.sub !== 'Tee') { it.cat = g.cat; it.sub = g.sub; } it.name = ''; }
      cands.push(it);
    } catch { toast(`Skipped ${files[k].name}: couldn’t read it.`); }
  }
  el.close();
  if (cands.length) reviewSheet(cands, { title: 'Check your pieces', source: 'photo', onCancel: () => cands.forEach((c) => Store.deletePhoto(c.photo)) });
}
function reviewSheet(cands, { title = 'Review', source = 'import', onCancel, note = '' } = {}) {
  const rows = () => cands.map((c, k) => `<div class="rv" data-k="${k}"><input type="checkbox" class="check" ${c._skip ? '' : 'checked'} aria-label="Include"><div class="rv-p">${pieceHTML(c, { cls: 'sm' })}</div>
    <div class="rv-f"><input class="input full" data-f="name" value="${esc(c.name)}" placeholder="Name">${subSelectHTML('', c.cat, c.sub).replace('<select class="input" id="">', '<select class="input" data-f="sub">')}
      ${selectHTML('', Object.entries(COLORS).map(([k2, v]) => [k2, v.label]), c.colors[0]).replace('<select class="input" id="">', '<select class="input" data-f="color">')}
      <input class="input num" data-f="price" value="${c.price ?? ''}" placeholder="$" inputmode="decimal">
      ${c.store || c.purchased || c.brand || c.size ? `<span class="xs muted full">${esc([c.brand, c.store, c.size && 'Size ' + c.size, c.purchased && fmtShort(c.purchased) + ' ' + c.purchased.slice(0, 4)].filter(Boolean).join(' · '))}${c.colorGuessed ? ' · color is a guess' : ''}</span>` : ''}</div></div>`).join('');
  let done = false;
  openSheet({ title, wide: true, body: `${note ? `<div class="note">${icon('info')}<span>${esc(note)}</span></div>` : ''}<p class="small muted">${plural(cands.length, 'piece')} found. Fix anything that looks off, untick what you don’t want, then add.</p><div class="review">${rows()}</div>`,
    foot: `<button class="btn" data-close2>Cancel</button><button class="btn primary" id="rv-add">Add to closet</button>`,
    onClose: () => { if (!done) onCancel?.(); },
    onMount: (el, close) => {
      const sync = (row) => { const c = cands[+row.dataset.k]; c.name = $('[data-f=name]', row).value.trim(); const [cat, sub] = $('[data-f=sub]', row).value.split('|'); if (cat !== c.cat || sub !== c.sub) { const [w, f] = subDefaults(sub); c.warmth = w; c.formality = f; } c.cat = cat; c.sub = sub;
        const col = $('[data-f=color]', row).value; if (col !== c.colors[0]) c.colors = [col, ...c.colors.filter((x) => x !== col)].slice(0, 2); c.price = parseMoney($('[data-f=price]', row).value); c._skip = !$('.check', row).checked; $('.rv-p', row).innerHTML = pieceHTML(c, { cls: 'sm' }); };
      $$('.rv', el).forEach((row) => row.addEventListener('change', () => sync(row)));
      el.querySelector('[data-close2]').onclick = close;
      $('#rv-add', el).onclick = () => {
        $$('.rv', el).forEach(sync); const keep = cands.filter((c) => !c._skip); done = true;
        cands.filter((c) => c._skip).forEach((c) => Store.deletePhoto(c.photo));
        keep.forEach((c) => { const it = newItem(Object.assign({}, c, { id: undefined, source })); delete it._skip; delete it.colorGuessed; if (!it.name) it.name = `${COLORS[it.colors[0]]?.label || ''} ${it.sub.toLowerCase()}`.trim(); if (c.wearsN) it.priorWears = c.wearsN; delete it.wearsN; Store.put('items', it); });
        close(); toast(`Added ${plural(keep.length, 'piece')} to your closet.`); afterClosetChange(); scheduleRender();
      };
    } });
}
function openPasteOrder(storePreset = '') {
  openSheet({ title: 'Paste an order', wide: true, body: `
    <p class="small muted">Open an order confirmation email or your order history page, select everything, copy, and paste it below. Valet finds each item, its price, size and color, and the order date.</p>
    <div class="grid2"><label class="field"><span>Store</span><input class="input" id="po-store" list="store-list2" value="${esc(storePreset)}" placeholder="Detected automatically"><datalist id="store-list2">${STORE_NAMES.map((s) => `<option value="${esc(s)}">`).join('')}</datalist></label>
      <label class="field"><span>Order date</span><input class="input" type="date" id="po-date" placeholder=""></label></div>
    <label class="field"><span>Order text</span><textarea class="input" id="po-text" style="min-height:220px" placeholder="Paste here"></textarea></label>
    ${AI.on ? `<div class="toggle" style="border:0"><div><strong>Read it with Claude</strong><div class="small muted">More accurate with unusual layouts. Falls back to Valet’s own reader.</div></div><input type="checkbox" class="switch" id="po-ai" checked></div>` : ''}`,
    foot: `<button class="btn" data-close2>Cancel</button><button class="btn primary" id="po-go">Find items</button>`,
    onMount: (el, close) => {
      el.querySelector('[data-close2]').onclick = close;
      $('#po-go', el).onclick = async (e) => {
        const text = $('#po-text', el).value.trim(); if (!text) { toast('Paste the order text first.'); return; }
        const store = $('#po-store', el).value.trim(); const date = $('#po-date', el).value; const b = e.currentTarget; b.disabled = true; b.innerHTML = '<span class="spinner"></span>Reading…';
        let items = [];
        if (AI.on && $('#po-ai', el)?.checked) { try { items = normalizeAIItems(await AI.parseOrder(text, store ? `Store: ${store}` : ''), store, date || detectDate(text)); } catch (er) { toast(AI.errCopy(er) + ' Using Valet’s reader.'); } }
        if (!items.length) items = parseOrderText(text, { store, date });
        b.disabled = false; b.textContent = 'Find items';
        if (!items.length) { toast('No items with prices found. Try copying the full order details, including prices.'); return; }
        close(); reviewSheet(items.map((x) => newItem(x)), { title: 'Items in this order', source: 'order' });
      };
    } });
}
function normalizeAIItems(arr, store, date) {
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => x && x.name).map((x) => {
    const g = inferCategory(x.name); const cat = CATS[x.cat] ? x.cat : g.cat; const sub = CATS[cat].subs.includes(x.sub) ? x.sub : (CATS[cat].subs.includes(g.sub) ? g.sub : CATS[cat].subs[0]);
    const cols = (Array.isArray(x.colors) ? x.colors : []).filter((c) => COLORS[c]); const [w, f] = subDefaults(sub);
    return { name: String(x.name).slice(0, 80), brand: x.brand || '', store: x.store || store || '', price: typeof x.price === 'number' ? x.price : parseMoney(x.price), purchased: /^\d{4}-\d{2}-\d{2}$/.test(x.purchased || '') ? x.purchased : date || today(),
      size: x.size || '', cat, sub, colors: cols.length ? cols : inferColors(x.name).length ? inferColors(x.name) : ['black'], pattern: PATTERNS.includes(x.pattern) ? x.pattern : inferPattern(x.name), material: MATERIALS.includes(x.material) ? x.material : inferMaterial(x.name), warmth: w, formality: f };
  });
}
function openCSV() {
  openSheet({ title: 'Import a spreadsheet', body: `
    <p class="small muted">Save your sheet as CSV (File → Download → CSV in Google Sheets, or Save As → CSV in Excel). Valet matches columns like name, category, color, brand, store, price, purchase date, size and times worn.</p>
    <label class="photo-drop" id="csv-drop">${icon('upload')}<strong>Choose a CSV file</strong><span class="small muted">or drop it here</span><input type="file" accept=".csv,text/csv,.tsv,text/tab-separated-values" id="csv-file" hidden></label>
    <button class="btn sm" data-act="csv-template" style="align-self:flex-start">${icon('download')}Get a template</button>`,
    onMount: (el, close) => {
      const handle = async (f) => { if (!f) return; const rows = parseCSV(await f.text()); if (rows.length < 2) { toast('That file has no rows to import.'); return; } const items = mapCSV(rows); close(); reviewSheet(items.map((x) => newItem(x)), { title: `Rows from ${f.name}`, source: 'csv' }); };
      $('#csv-file', el).onchange = (e) => handle(e.target.files[0]);
      const d = $('#csv-drop', el); d.ondragover = (e) => { e.preventDefault(); d.classList.add('over'); }; d.ondragleave = () => d.classList.remove('over'); d.ondrop = (e) => { e.preventDefault(); d.classList.remove('over'); handle(e.dataTransfer.files[0]); };
    } });
}
function openRetailers() {
  openSheet({ title: 'Bring in store purchases', wide: true, body: `
    <div class="note">${icon('info')}<span>None of these stores lets outside apps read your account, so there’s no one-tap login. These routes take about a minute per order${IN_CLAUDE ? ', and Gmail search can pull many orders at once' : ''}.</span></div>
    <div class="list">${RETAILERS.map((r) => `<div class="ret"><span class="mk">${esc(r.mark)}</span><div class="grow stack" style="gap:6px"><strong>${esc(r.name)}</strong><span class="small muted">${esc(r.how)}</span>
      <div class="actions"><button class="btn sm" data-act="paste-order" data-store="${esc(r.k === 'any' || r.k === 'gapinc' ? '' : r.name)}">${icon('file')}Paste an order</button>${IN_CLAUDE && r.q ? `<button class="btn sm" data-act="gmail" data-q="${esc(r.q)}" data-name="${esc(r.name)}">${icon('mail')}Search Gmail</button>` : ''}${r.k === 'amazon' ? `<button class="btn sm" data-act="csv">${icon('upload')}Upload CSV</button>` : ''}</div></div></div>`).join('')}</div>`
  });
}
async function openGmail(q, name) {
  const el = openSheet({ title: name ? `${name} orders in Gmail` : 'Orders in Gmail', wide: true, body: `<div class="row"><span class="spinner"></span>Searching your Gmail for order emails${name ? ' from ' + esc(name) : ' from Stitch Fix, Nordstrom, Gap, Old Navy and other clothing stores'}…</div>` });
  let threads;
  try { threads = await Mail.find(q); } catch (e) { setSheet(el, { body: `<div class="note warn">${icon('info')}<span>${esc(e?.code === 'unavailable' ? 'Gmail search works when Valet is open inside Claude.' : mcpErrorCopy(e, 'Gmail'))}</span></div>` }); return; }
  const done = new Set(S.profile.importedThreads || []);
  if (!threads.length) { setSheet(el, { body: `<div class="empty"><h3>No order emails found</h3><p>Nothing matched in the Gmail account connected to Claude. If you shop with a different email address, connect that Gmail account in claude.ai Settings → Connectors, or paste orders instead.</p><button class="btn" data-act="paste-order">${icon('file')}Paste an order</button></div>` }); return; }
  setSheet(el, { body: `<p class="small muted">${plural(threads.length, 'email')} found. Pick the orders to read${done.size ? '; ones already imported are unticked' : ''}.</p>
    <div class="list">${threads.map((t) => `<label class="li" style="cursor:pointer"><input type="checkbox" class="check" data-t="${esc(t.id)}" ${done.has(t.id) ? '' : 'checked'}><div class="grow" style="min-width:0"><strong style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(t.subject)}</strong><span class="small muted">${esc(t.from)} · ${t.date ? fmtShort(t.date) + ' ' + t.date.slice(0, 4) : ''}</span></div>${done.has(t.id) ? '<span class="badge">Imported</span>' : ''}</label>`).join('')}</div>`,
    foot: `<button class="btn" data-close2>Cancel</button><button class="btn primary" id="gm-go">Read selected</button>` });
  el.querySelector('[data-close2]').onclick = el.close;
  $('#gm-go', el).onclick = async () => {
    const ids = $$('[data-t]', el).filter((c) => c.checked).map((c) => c.dataset.t); if (!ids.length) { toast('Pick at least one email.'); return; }
    setSheet(el, { body: `<div class="row"><span class="spinner"></span><span id="gm-msg">Reading 1 of ${ids.length}…</span></div>`, foot: '' });
    const all = []; let failed = 0;
    for (let k = 0; k < ids.length; k++) {
      $('#gm-msg', el) && ($('#gm-msg', el).textContent = `Reading ${k + 1} of ${ids.length}…`);
      try {
        const m = await Mail.read(ids[k]); const store = detectStore(`${m.from} ${m.subject} ${m.text.slice(0, 2000)}`); const date = m.date || detectDate(m.text);
        let items = [];
        if (AI.on) { try { items = normalizeAIItems(await AI.parseOrder(m.text, `Email from ${m.from}, subject “${m.subject}”, sent ${m.date}`), store, date); } catch { items = []; } }
        if (!items.length) items = parseOrderText(m.text, { store, date });
        items.forEach((x) => { if (!all.some((y) => y.name === x.name && y.price === x.price && y.purchased === x.purchased)) all.push(x); });
      } catch { failed++; }
    }
    el.close();
    S.profile.importedThreads = [...new Set([...(S.profile.importedThreads || []), ...ids])].slice(-600); Store.saveProfile();
    if (!all.length) { toast(failed ? 'Couldn’t read those emails. Try pasting an order instead.' : 'No clothing items found in those emails.'); return; }
    reviewSheet(all.map((x) => newItem(x)), { title: 'Items from your orders', source: 'gmail', note: failed ? `${plural(failed, 'email')} couldn’t be read.` : '' });
  };
}

/* ---------- outfit editing: swap, occasion, day ---------- */
function dayRecord(date) { const wk = weekKeyOf(date); const plan = S.plans.get(wk) || { id: wk, days: {} }; if (!S.plans.has(wk)) S.plans.set(wk, plan); plan.days[date] = plan.days[date] || { items: [] }; return { plan, day: plan.days[date] }; }
function savePlan(plan) { Store.put('plans', plan); }
function openSwap(itemId, date) {
  const cur = S.items.get(itemId); if (!cur) return; const { plan, day } = dayRecord(date);
  const role = slotOf(cur); const accKey = role === 'acc' ? 'acc' : role;
  const ctx = dayContext(date, { kindSet: day.kindSet, wx: day.wx, jitter: 0 });
  const pool = role === 'active' ? activeItems().filter((i) => i.cat === 'active') : slotPool(ctx, accKey === 'acc' ? 'acc' : accKey).map((x) => x.it);
  const alts = pool.filter((i) => !(day.items || []).includes(i.id)).filter((i) => role !== 'acc' || i.sub === cur.sub || true).slice(0, 15);
  const locked = (day.lockMap || {})[role] === itemId;
  openSheet({ title: cur.name, body: `
    <div class="row" style="gap:14px;align-items:flex-start"><div style="width:110px;flex:none">${pieceHTML(cur, { cls: 'tall' })}</div><div class="stack grow"><span class="small muted">${esc(cur.sub)} · ${esc(DRESS_LEVELS[Math.round(cur.formality)])} · ${plural(wearsOf(cur), 'wear')}, last ${relDays(lastWorn(cur))}</span>
      <div class="actions"><button class="btn sm" data-act="lock-piece" data-id="${cur.id}" data-date="${date}">${icon(locked ? 'unlock' : 'lock')}${locked ? 'Unlock' : 'Lock in'}</button><button class="btn sm" data-act="remove-piece" data-id="${cur.id}" data-date="${date}">Remove</button><button class="btn sm quiet" data-act="item" data-id="${cur.id}">Details</button></div>
      <span class="xs muted">Locked pieces stay put when you shuffle.</span></div></div>
    <div><h3 class="section-title" style="margin-bottom:8px">Swap for</h3>${alts.length ? `<div class="items" style="grid-template-columns:repeat(auto-fill,minmax(96px,1fr))">${alts.map((i) => `<button class="item" data-act="swap-pick" data-id="${i.id}" data-old="${cur.id}" data-date="${date}">${pieceHTML(i)}<span class="item-b"><span class="item-n small">${esc(i.name)}</span></span></button>`).join('')}</div>` : '<p class="small muted">No other pieces fit this day.</p>'}</div>
    ${role !== 'outer' && !(day.items || []).some((id) => slotOf(S.items.get(id) || {}) === 'outer') ? `<button class="btn sm" data-act="add-slot" data-slot="outer" data-date="${date}">${icon('plus')}Add a jacket or coat</button>` : ''}`, id: 'swap' });
}
function openOccasion(date) {
  const { day } = dayRecord(date); const cur = day.kindSet || dayContext(date).kind;
  openSheet({ title: `Dressing for ${fmtDay(date)}`, body: `<p class="small muted">Pick what the day calls for. Valet restyles the outfit to match.</p>
    <div class="opt-grid">${KIND_ORDER.map((k) => `<button class="opt" aria-pressed="${cur === k}" data-act="set-kind" data-k="${k}" data-date="${date}">${kindIcon(k)}<span class="grow">${esc(KINDS[k].label)}<br><span class="xs muted">${DRESS_LEVELS[Math.round(kindLevel(k))]}${KINDS[k].note ? ' · ' + KINDS[k].note : ''}</span></span></button>`).join('')}</div>
    ${day.kindSet ? `<button class="btn quiet sm" data-act="set-kind" data-k="" data-date="${date}">Go back to automatic</button>` : ''}` });
}
function openDay(date) {
  const el = openSheet({ title: fmtLong(date), wide: true, id: 'day', body: '' });
  el.refresh = () => {
    const { day } = dayRecord(date); const ctx = dayContext(date, { kindSet: day.kindSet, wx: day.wx }); const ids = (day.items || []).filter((id) => S.items.get(id)); const past = date < today();
    const manual = [...S.events.values()].filter((e) => e.date === date && e.src === 'manual');
    setSheet(el, { body: `
      <div class="row between wrap"><div class="row wrap">${kindChip(ctx.kind)}<button class="chip" data-act="occasion" data-date="${date}">${icon('edit')}Occasion</button></div><button class="chip" data-act="day-wx" data-date="${date}">${wxInline(ctx.wx)}</button></div>
      ${forecastShift(day, date) ? `<div class="note warn">${icon('info')}<span class="grow">The forecast changed since this was planned.</span><button class="btn sm" data-act="shuffle" data-date="${date}">Restyle</button></div>` : ''}
      <div class="outfit-card"><div>${boardHTML(ids, { act: 'swap', date, locks: day.lockMap || {}, empty: `<div class="stack" style="align-items:center"><p>No outfit yet.</p><button class="btn primary" data-act="shuffle" data-date="${date}">${icon('sparkles')}Style this day</button></div>` })}</div>
      <div class="stack">${(day.reasons || []).length ? `<ul class="why">${day.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
        <div><div class="eyebrow" style="margin-bottom:6px">On the calendar</div>${ctx.events.length ? `<div class="events">${ctx.events.map((e) => `<div class="ev"><span class="t">${esc(e.allDay ? 'All day' : e.time || '')}</span>${e.kind ? `<span class="badge">${esc(KINDS[e.kind].label)}</span>` : ''}<span class="n">${esc(e.title)}</span>${e.src === 'manual' ? `<button class="iconbtn" style="width:28px;height:28px" data-act="del-event" data-id="${e.id}" aria-label="Remove">${icon('close')}</button>` : ''}</div>`).join('')}</div>` : '<p class="small muted">Nothing scheduled.</p>'}
          <div class="row" style="margin-top:8px"><input class="input" id="ev-title" placeholder="Add: client lunch, open house…" style="min-height:36px"><input class="input" id="ev-time" placeholder="Time" style="width:80px;min-height:36px"><button class="btn sm" data-act="add-event" data-date="${date}">Add</button></div></div>
      </div></div>`,
      foot: ids.length ? `<button class="btn" data-act="shuffle" data-date="${date}">${icon('shuffle')}Shuffle</button><button class="btn" data-act="lock-day" data-date="${date}">${icon(day.locked ? 'unlock' : 'lock')}${day.locked ? 'Unlock day' : 'Lock day'}</button><button class="btn" data-act="save-look" data-date="${date}">${icon('heart')}Save look</button><button class="btn" data-act="pick-look" data-date="${date}">${icon('looks')}Use a saved look</button>${day.worn ? `<button class="btn" data-act="unwear" data-date="${date}">Undo worn</button>` : date <= today() ? `<button class="btn primary" data-act="wear" data-date="${date}">${icon('check')}${past ? 'I wore this' : 'I wore this'}</button>` : ''}`
        : `<button class="btn" data-act="pick-look" data-date="${date}">${icon('looks')}Use a saved look</button>` });
  };
  el.refresh();
}
function openDayWeather(date) {
  const { plan, day } = dayRecord(date); const w = Object.assign({}, Weather.forDate(date), day.wx || {});
  openSheet({ title: `Weather · ${fmtDay(date)}`, body: `<p class="small muted">${esc(Weather.srcLabel((day.wx ? 'manual' : w.src)))}. Change it if you know better, or if you’ll be somewhere else.</p>
    <div class="grid3"><label class="field"><span>High °F</span><input class="input num" id="dw-hi" inputmode="numeric" value="${w.hi ?? ''}"></label><label class="field"><span>Low °F</span><input class="input num" id="dw-lo" inputmode="numeric" value="${w.lo ?? ''}"></label><label class="field"><span>Rain %</span><input class="input num" id="dw-rain" inputmode="numeric" value="${w.rain ?? 0}"></label></div>`,
    foot: `${day.wx ? `<button class="btn quiet" id="dw-reset">Use forecast</button>` : ''}<button class="btn primary" id="dw-save">Save & restyle</button>`,
    onMount: (el, close) => {
      $('#dw-save', el).onclick = () => { day.wx = { hi: +$('#dw-hi', el).value, lo: +$('#dw-lo', el).value, rain: +$('#dw-rain', el).value, code: +$('#dw-rain', el).value >= 50 ? 61 : 2, src: 'manual' }; savePlan(plan); planDay(date, { lock: day.lockMap }); close(); refreshSheets(); scheduleRender(); };
      $('#dw-reset', el)?.addEventListener('click', () => { delete day.wx; savePlan(plan); planDay(date, { lock: day.lockMap }); close(); refreshSheets(); scheduleRender(); });
    } });
}
function openWeatherSheet() {
  const loc = S.profile.location; const days = [...Array(10)].map((_, k) => addDays(today(), k));
  openSheet({ title: loc ? loc.name.split(',')[0] : 'Weather', body: `
    ${Weather.status ? `<div class="note">${icon('info')}<span>${esc(Weather.status)}</span></div>` : ''}
    <div class="list">${days.map((d) => { const w = Weather.forDate(d); return `<div class="li"><span style="width:96px" class="small"><strong>${DOW[dow(d)]}</strong> <span class="muted">${fmtShort(d)}</span></span>${icon(wxIcon(w))}<span class="grow small">${esc(wxLabel(w))}</span><span class="num small">${tempOut(w.rawHi ?? w.hi)} / ${tempOut(w.rawLo ?? w.lo)}</span><span class="num xs muted" style="width:44px;text-align:right">${w.rain ?? 0}%</span></div>`; }).join('')}</div>
    <p class="xs muted">${esc(Weather.srcLabel(Weather.src))}. Valet dresses for the “feels like” temperature and how long you’re out.</p>`,
    foot: `<button class="btn" data-act="edit-location">${icon('pin')}Change city</button><button class="btn" data-act="wx-refresh">${icon('refresh')}Refresh</button>` });
}
function openLocation() {
  openSheet({ title: 'Your city', body: `<div class="row"><input class="input grow" id="loc-q" placeholder="Your city" value=""><button class="btn primary" id="loc-go">Search</button></div>
    ${!IN_CLAUDE && navigator.geolocation ? `<button class="btn" id="loc-gps">${icon('pin')}Use my current location</button>` : ''}<div id="loc-res" class="list"></div>`,
    onMount: (el, close) => {
      const pickLoc = async (loc) => { Store.saveProfile({ location: loc }); close(); toast(`Weather set to ${loc.name}.`); await Weather.refresh(true); const wk = weekKeyOf(today()); if (S.plans.get(wk)?.generated) planWeek(wk); scheduleRender(); refreshSheets(); };
      const search = async () => {
        const q = $('#loc-q', el).value.trim(); if (!q) return; $('#loc-res', el).innerHTML = '<div class="li"><span class="spinner"></span>Searching…</div>';
        const res = await Weather.geocode(q);
        $('#loc-res', el).innerHTML = res.map((r, k) => `<button class="li-btn" data-k="${k}">${icon('pin')}<span class="grow">${esc(r.name)}</span>${r.lat != null ? `<span class="xs muted num">${r.lat.toFixed(2)}, ${r.lon.toFixed(2)}</span>` : ''}</button>`).join('');
        $$('#loc-res [data-k]', el).forEach((b) => (b.onclick = () => pickLoc(res[+b.dataset.k])));
      };
      $('#loc-go', el).onclick = search; $('#loc-q', el).onkeydown = (e) => { if (e.key === 'Enter') search(); };
      $('#loc-gps', el)?.addEventListener('click', () => navigator.geolocation.getCurrentPosition((p) => pickLoc({ name: 'Current location', lat: +p.coords.latitude.toFixed(3), lon: +p.coords.longitude.toFixed(3) }), () => toast('Location is blocked. Search for your city instead.')));
    } });
}

/* ---------- looks ---------- */
function openSaveLook(items, date) {
  const ids = items.filter((id) => S.items.get(id)); if (!ids.length) return;
  const ctx = date ? dayContext(date) : null;
  openSheet({ title: 'Save this look', body: `${boardHTML(ids, { caps: false })}
    <label class="field"><span>Name</span><input class="input" id="sl-name" value="${esc(ctx ? outfitTitle(ctx).split(' · ')[0] + ' look' : '')}" placeholder="e.g. Showing-day uniform"></label>
    <div class="field"><span>Good for</span><div class="chips" id="sl-kinds">${KIND_ORDER.map((k) => `<button class="chip" aria-pressed="${ctx?.kind === k}" data-v="${k}">${KINDS[k].label}</button>`).join('')}</div></div>
    <div class="toggle" style="border:0"><span><strong>Favorite</strong> <span class="small muted">Valet repeats favorites more often.</span></span><input type="checkbox" class="switch" id="sl-fav" checked></div>`,
    foot: `<button class="btn primary" id="sl-save">Save look</button>`,
    onMount: (el, close) => { chipToggleGroup(el, '#sl-kinds'); $('#sl-save', el).onclick = () => { Store.put('outfits', { name: $('#sl-name', el).value.trim() || 'Saved look', items: ids, kinds: pressedVals($('#sl-kinds', el)), fav: $('#sl-fav', el).checked, created: today() }); Learn.build(); close(); toast('Look saved.'); scheduleRender(); }; } });
}
function openLookBuilder(id) {
  const o = id ? clone(S.outfits.get(id)) : { name: '', items: [], kinds: [], fav: false };
  let tab = 'top'; let q = '';
  const el = openSheet({ title: id ? 'Edit look' : 'Build a look', wide: true, body: '' , foot: `${id ? `<button class="btn quiet danger" id="lb-del">${icon('trash')}Delete</button><span class="grow"></span>` : ''}<button class="btn primary" id="lb-save">Save look</button>` });
  const draw = () => {
    const tabs = CAT_ORDER.filter((k) => activeItems().some((i) => i.cat === k));
    const list = activeItems().filter((i) => i.cat === tab && (!q || i.name.toLowerCase().includes(q)));
    setSheet(el, { body: `<div class="outfit-card"><div>${boardHTML(o.items, { caps: false, empty: 'Pick pieces below.' })}</div><div class="stack">
      <label class="field"><span>Name</span><input class="input" id="lb-name" value="${esc(o.name)}" placeholder="e.g. Open-house uniform"></label>
      <div class="field"><span>Good for</span><div class="chips" id="lb-kinds">${KIND_ORDER.map((k) => `<button class="chip" aria-pressed="${(o.kinds || []).includes(k)}" data-v="${k}">${KINDS[k].label}</button>`).join('')}</div></div>
      <div class="toggle" style="border:0"><strong>Favorite</strong><input type="checkbox" class="switch" id="lb-fav" ${o.fav ? 'checked' : ''}></div></div></div>
      <div class="chips scroll">${tabs.map((k) => `<button class="chip" aria-pressed="${tab === k}" data-tab="${k}">${CATS[k].label}</button>`).join('')}</div>
      <div class="items" style="grid-template-columns:repeat(auto-fill,minmax(100px,1fr))">${list.map((i) => `<button class="item ${o.items.includes(i.id) ? 'sel' : ''}" data-pick="${i.id}">${pieceHTML(i)}<span class="item-b"><span class="item-n small">${esc(i.name)}</span></span></button>`).join('')}</div>` });
    chipToggleGroup(el, '#lb-kinds', true, (g) => (o.kinds = pressedVals(g)));
    $('#lb-name', el).oninput = (e) => (o.name = e.target.value); $('#lb-fav', el).onchange = (e) => (o.fav = e.target.checked);
    $$('[data-tab]', el).forEach((b) => (b.onclick = () => { tab = b.dataset.tab; draw(); }));
    $$('[data-pick]', el).forEach((b) => (b.onclick = () => {
      const it = S.items.get(b.dataset.pick); const s = slotOf(it);
      if (o.items.includes(it.id)) o.items = o.items.filter((x) => x !== it.id);
      else {
        if (s !== 'acc') o.items = o.items.filter((x) => slotOf(S.items.get(x)) !== s || !S.items.get(x));
        if (s === 'dress') o.items = o.items.filter((x) => !['top', 'bottom'].includes(slotOf(S.items.get(x))));
        if (s === 'top' || s === 'bottom') o.items = o.items.filter((x) => slotOf(S.items.get(x)) !== 'dress');
        o.items.push(it.id);
      }
      draw();
    }));
  };
  draw();
  $('#lb-save', el).onclick = () => { if (!o.items.length) { toast('Pick at least one piece.'); return; } o.created = o.created || today(); if (!o.name) o.name = 'Saved look'; Store.put('outfits', o); Learn.build(); el.close(); toast('Look saved.'); scheduleRender(); };
  $('#lb-del', el)?.addEventListener('click', () => confirmSheet('Delete this look?', 'The pieces stay in your closet.', 'Delete', () => { Store.del('outfits', id); el.close(); scheduleRender(); }));
}
function openLook(id) {
  const o = S.outfits.get(id); if (!o) return;
  openSheet({ title: o.name || 'Look', body: `${boardHTML(o.items)}<div class="row wrap">${(o.kinds || []).map((k) => kindChip(k)).join('')}</div>
    <div class="row"><label class="field grow"><span>Plan it for</span><input class="input" type="date" id="lk-date" value="${today()}"></label><button class="btn primary" style="align-self:flex-end" id="lk-plan">${icon('week')}Plan</button></div>`,
    foot: `<button class="btn quiet danger" id="lk-del">${icon('trash')}Delete</button><span class="grow"></span><button class="btn" id="lk-edit">${icon('edit')}Edit</button><button class="btn primary" data-act="wear-items" data-items="${o.items.join(',')}">${icon('check')}Wear today</button>`,
    onMount: (el, close) => {
      $('#lk-plan', el).onclick = () => { const d = $('#lk-date', el).value || today(); setDayItems(d, o.items, o.name); close(); toast(`Planned for ${fmtDay(d)}.`); };
      $('#lk-edit', el).onclick = () => { close(); openLookBuilder(id); };
      $('#lk-del', el).onclick = () => confirmSheet('Delete this look?', 'The pieces stay in your closet.', 'Delete', () => { Store.del('outfits', id); close(); scheduleRender(); });
    } });
}
function setDayItems(date, items, title) {
  const { plan, day } = dayRecord(date); day.items = items.filter((x) => S.items.get(x)); day.manual = true; day.title = title || day.title || 'Saved look'; day.reasons = title ? [`Your saved look “${title}”.`] : []; day.worn = false; savePlan(plan); scheduleRender(); refreshSheets();
}
function openPickLook(date) {
  const looks = [...S.outfits.values()];
  openSheet({ title: 'Use a saved look', wide: true, body: looks.length ? `<div class="looks-grid">${looks.map((o) => `<button class="look" data-act="use-look" data-id="${o.id}" data-date="${date}">${boardHTML(o.items, { caps: false })}<strong>${esc(o.name)}</strong></button>`).join('')}</div>` : '<p class="muted">No saved looks yet. Save one from any outfit, or build one under Looks.</p>' });
}
function openCapsule(key, id) {
  let cap = id ? clone(S.capsules.get(id)) : (capsuleCache.list.find((c) => c.key === key) || buildCapsule(key));
  const el = openSheet({ title: cap.label || cap.name, wide: true, body: '' });
  const draw = () => {
    const items = cap.items.map((x) => S.items.get(x)).filter(Boolean); const looks = capsuleLooks(cap.items, cap.kind, 6);
    setSheet(el, { body: `<div class="row between wrap"><span class="muted">${plural(items.length, 'piece')} · about <strong class="num">${countCombos(items)}</strong> outfits</span><button class="btn sm" data-reshuffle>${icon('shuffle')}More combinations</button></div>
      <div class="capsule-strip" style="grid-template-columns:repeat(auto-fill,minmax(72px,1fr))">${items.map((i) => pieceHTML(i, { cls: 'sm', cap: true, act: 'item' })).join('')}</div>
      <h3 class="section-title">Sample outfits</h3><div class="looks-grid">${looks.map((l) => `<div class="look">${boardHTML(l.items, { caps: false })}<button class="btn sm" data-act="save-items" data-items="${l.items.join(',')}">${icon('heart')}Save look</button></div>`).join('') || '<p class="small muted">Add tops, bottoms and shoes to see combinations.</p>'}</div>`,
      foot: `${id ? `<button class="btn quiet danger" data-capdel>${icon('trash')}Delete</button><span class="grow"></span>` : `<button class="btn" data-capsave>${icon('heart')}Save capsule</button>`}<button class="btn primary" data-capplan>${icon('week')}Plan next week from this</button>` });
    $('[data-reshuffle]', el).onclick = draw;
    $('[data-capsave]', el)?.addEventListener('click', () => { const c = Store.put('capsules', { name: cap.label, note: cap.blurb, items: cap.items, kind: cap.kind, created: today() }); id = c.id; toast('Capsule saved.'); scheduleRender(); draw(); });
    $('[data-capdel]', el)?.addEventListener('click', () => { Store.del('capsules', id); el.close(); scheduleRender(); });
    $('[data-capplan]', el).onclick = () => { const wk = addDays(weekKeyOf(today()), 7); planWeek(wk, { force: true, pool: new Set(cap.items) }); el.close(); UI.weekOffset = 1; go('week'); toast(`Week of ${fmtShort(wk)} planned from your capsule.`); };
  };
  draw();
}

/* ---------- Claude stylist ---------- */
function openStylist(date = today()) {
  const el = openSheet({ title: 'Ask Claude', wide: true, body: `<div class="row"><input class="input grow" id="st-q" placeholder="Something warmer? A dinner after the showing?"><button class="btn primary" id="st-go">Ask</button></div>
    <div class="chips">${['Something more polished', 'Warmer, it’s colder than it looks', 'Use pieces I haven’t worn lately', 'Dinner after work tonight', 'Comfortable for showings all day'].map((s) => `<button class="chip soft" data-sug="${esc(s)}">${esc(s)}</button>`).join('')}</div><div id="st-out" class="stack"></div>` });
  const ask = async (q) => {
    const out = $('#st-out', el); out.innerHTML = '<div class="row"><span class="spinner"></span>Claude is looking through your closet…</div>';
    try { const r = await AI.stylist(q, date); out.innerHTML = stylistHTML(r, date); }
    catch (e) { out.innerHTML = `<div class="note warn">${icon('info')}<span>${esc(AI.errCopy(e))}</span></div>`; }
  };
  $('#st-go', el).onclick = () => { const q = $('#st-q', el).value.trim(); if (q) ask(q); };
  $('#st-q', el).onkeydown = (e) => { if (e.key === 'Enter') $('#st-go', el).click(); };
  $$('[data-sug]', el).forEach((b) => (b.onclick = () => { $('#st-q', el).value = b.dataset.sug; ask(b.dataset.sug); }));
}
function stylistHTML(r, date) {
  const looks = (r?.looks || []).map((l) => Object.assign({}, l, { items: (l.items || []).filter((x) => S.items.get(x)) })).filter((l) => l.items.length);
  if (!looks.length) return `<div class="note">${icon('info')}<span>Claude didn’t find a complete look for that. Try asking another way.</span></div>`;
  return `<div class="looks-grid">${looks.map((l) => `<div class="look">${boardHTML(l.items, { caps: false })}<strong>${esc(l.title || 'Look')}</strong><p class="small muted">${esc(l.why || '')}</p><div class="row"><button class="btn sm primary" data-act="use-items" data-items="${l.items.join(',')}" data-date="${date}" data-title="${esc(l.title || '')}">Wear ${date === today() ? 'today' : 'this'}</button><button class="btn sm" data-act="save-items" data-items="${l.items.join(',')}">Save</button></div></div>`).join('')}</div>${r.tip ? `<div class="note accent">${icon('sparkles')}<span>${esc(r.tip)}</span></div>` : ''}`;
}

/* ---------- laundry ---------- */
function openLaundry() {
  let q = '';
  const el = openSheet({ title: 'Laundry', wide: true, body: '' });
  el.refresh = () => {
    const list = itemsArr((i) => ['active', 'laundry'].includes(i.status || 'active') && !['accessory', 'bag'].includes(i.cat) && (!q || i.name.toLowerCase().includes(q))).sort(by((i) => (i.status === 'laundry' ? 0 : 1)));
    const n = itemsArr((i) => i.status === 'laundry').length;
    setSheet(el, { body: `<p class="small muted">Tap pieces that are in the wash. Valet leaves them out of outfits until you mark them clean.</p><input class="input" id="la-q" placeholder="Search" value="${esc(q)}">
      <div class="items" style="grid-template-columns:repeat(auto-fill,minmax(96px,1fr))">${list.map((i) => `<button class="item ${i.status === 'laundry' ? 'sel' : ''}" data-la="${i.id}">${pieceHTML(i)}${i.status === 'laundry' ? `<span class="flag badge accent">${icon('wash', 'xs')}</span>` : ''}<span class="item-b"><span class="item-n small">${esc(i.name)}</span></span></button>`).join('')}</div>`,
      foot: `<span class="grow small muted">${plural(n, 'piece')} in the laundry</span>${n ? `<button class="btn" data-act="all-clean">All clean</button>` : ''}<button class="btn primary" data-close3>Done</button>` });
    $('#la-q', el).oninput = debounce((e) => { q = e.target.value.toLowerCase(); el.refresh(); setTimeout(() => { const i = $('#la-q', el); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 0); }, 250);
    $$('[data-la]', el).forEach((b) => (b.onclick = () => { const it = S.items.get(b.dataset.la); it.status = it.status === 'laundry' ? 'active' : 'laundry'; Store.put('items', it); el.refresh(); scheduleRender(); }));
    $('[data-close3]', el).onclick = el.close;
  };
  el.refresh();
}

/* ---------- trips ---------- */
function tripOn(date) { return [...S.trips.values()].find((t) => date >= t.start && date <= t.end && t.dest); }
function openTripEditor(id) {
  const t = id ? clone(S.trips.get(id)) : { name: '', dest: null, start: addDays(today(), 7), end: addDays(today(), 10), mainKind: 'casual', extras: [] };
  let results = [];
  openSheet({ title: id ? 'Edit trip' : 'New trip', body: `
    <div class="field"><span>Destination</span><div class="row"><input class="input grow" id="tr-q" value="${esc(t.dest?.name || '')}" placeholder="City"><button class="btn" id="tr-find">Find</button></div><div id="tr-res" class="list"></div></div>
    <div class="grid2"><label class="field"><span>Leave</span><input class="input" type="date" id="tr-start" value="${t.start}"></label><label class="field"><span>Return</span><input class="input" type="date" id="tr-end" value="${t.end}"></label></div>
    <div class="field"><span>Mostly</span><div class="chips" id="tr-kind">${['casual', 'outdoor', 'client', 'work', 'formal', 'active'].map((k) => `<button class="chip" aria-pressed="${t.mainKind === k}" data-v="${k}">${KINDS[k].label}</button>`).join('')}</div></div>
    <div class="field"><span>Also planning</span><div class="chips" id="tr-extra">${['date', 'cocktail', 'formal', 'active', 'outdoor'].map((k) => `<button class="chip" aria-pressed="${(t.extras || []).includes(k)}" data-v="${k}">${KINDS[k].label}</button>`).join('')}</div></div>`,
    foot: `<button class="btn primary" id="tr-save">${id ? 'Save & rebuild' : 'Build packing list'}</button>`,
    onMount: (el, close) => {
      chipToggleGroup(el, '#tr-kind', false); chipToggleGroup(el, '#tr-extra');
      const find = async () => { const q = $('#tr-q', el).value.trim(); if (!q) return; $('#tr-res', el).innerHTML = '<div class="li"><span class="spinner"></span>Searching…</div>'; results = await Weather.geocode(q);
        $('#tr-res', el).innerHTML = results.map((r, k) => `<button class="li-btn" data-k="${k}">${icon('pin')}<span class="grow">${esc(r.name)}</span></button>`).join('');
        $$('#tr-res [data-k]', el).forEach((b) => (b.onclick = () => { t.dest = results[+b.dataset.k]; $('#tr-q', el).value = t.dest.name; $('#tr-res', el).innerHTML = `<div class="li small muted">${icon('check')} ${esc(t.dest.name)}</div>`; })); };
      $('#tr-find', el).onclick = find; $('#tr-q', el).onkeydown = (e) => { if (e.key === 'Enter') find(); };
      $('#tr-save', el).onclick = async (e) => {
        if (!t.dest) { const q = $('#tr-q', el).value.trim(); if (!q) { toast('Add a destination.'); return; } t.dest = (await Weather.geocode(q))[0]; }
        t.start = $('#tr-start', el).value; t.end = $('#tr-end', el).value; if (t.end < t.start) { toast('The return date is before the departure.'); return; }
        t.mainKind = pressedVals($('#tr-kind', el))[0] || 'casual'; t.extras = pressedVals($('#tr-extra', el)); t.name = t.dest.name.split(',')[0];
        e.currentTarget.disabled = true; e.currentTarget.innerHTML = '<span class="spinner"></span>Checking the weather…';
        await buildTrip(t, true); close(); openTrip(t.id); scheduleRender();
      };
    } });
}
async function buildTrip(t, refetch) {
  if (refetch || !t.wx) t.wx = await Weather.forTrip(t.dest, t.start, t.end);
  const loc = Object.assign({}, t.dest, { days: t.wx || {} }); const packed = new Set(); const used = new Map(); t.days = t.days || {};
  const dates = []; for (let d = t.start; d <= t.end; d = addDays(d, 1)) dates.push(d);
  // spread the extra occasions across evenings in the middle of the trip
  const mid = dates.slice(1, -1); const extras = [...(t.extras || [])];
  t.dayKinds = t.dayKinds || {};
  dates.forEach((d, k) => { if (!t.dayKinds[d]) t.dayKinds[d] = k === 0 || k === dates.length - 1 ? (dates.length > 1 ? 'travel' : t.mainKind) : t.mainKind; });
  if (extras.length && mid.length && !t.extrasPlaced) { extras.forEach((k, j) => { const d = mid[Math.min(mid.length - 1, Math.floor(((j + 1) * mid.length) / (extras.length + 1)))]; if (k === 'active') t.activeDays = [...new Set([...(t.activeDays || []), d])]; else t.dayKinds[d] = k; }); t.extrasPlaced = true; }
  for (const d of dates) {
    if (t.days[d]?.locked) { t.days[d].items.forEach((id) => packed.add(id)); continue; }
    const ctx = dayContext(d, { kindSet: t.dayKinds[d], loc, packed, used, jitter: 0.6 });
    const r = buildOutfit(ctx, 40); t.days[d] = { items: r?.items || [], kind: ctx.kind };
    (r?.items || []).forEach((id) => { packed.add(id); used.set(id, (used.get(id) || 0) + 1); });
  }
  if ((t.activeDays || []).length || (t.extras || []).includes('active')) { const a = buildActive(dayContext(t.start, { kindSet: 'active', loc })); a?.items.forEach((id) => packed.add(id)); }
  const prev = t.packList || {}; t.packList = {}; [...packed].forEach((id) => (t.packList[id] = !!prev[id]));
  Store.put('trips', t); return t;
}
function openTrip(id) {
  const el = openSheet({ title: 'Trip', wide: true, body: '' });
  el.refresh = () => {
    const t = S.trips.get(id); if (!t) { el.close(); return; }
    const dates = []; for (let d = t.start; d <= t.end; d = addDays(d, 1)) dates.push(d);
    const items = Object.keys(t.packList || {}).map((x) => S.items.get(x)).filter(Boolean).sort(by((i) => CAT_ORDER.indexOf(i.cat)));
    const nDays = dates.length; const rain = dates.some((d) => (t.wx?.[d]?.rain ?? 0) >= 45); const cold = dates.some((d) => (t.wx?.[d]?.lo ?? 60) < 45); const hot = dates.some((d) => (t.wx?.[d]?.hi ?? 60) >= 82);
    const extras = [`Underwear ×${nDays + 1}`, `Socks ×${nDays}`, 'Sleepwear', 'Chargers', rain && 'Umbrella', cold && 'Gloves', hot && 'Sunscreen', (t.extras || []).includes('active') && 'Workout socks + water bottle'].filter(Boolean);
    const packedN = Object.values(t.packList || {}).filter(Boolean).length;
    setSheet(el, { title: `${t.name} · ${fmtShort(t.start)}–${fmtShort(t.end)}`, body: `
      <div class="row between wrap"><span class="muted small">${plural(nDays, 'day')} · ${plural(items.length, 'piece')} to pack · ${esc(Weather.srcLabel(Object.values(t.wx || {})[0]?.src || 'estimate'))}</span><div class="row"><button class="btn sm" data-trip-edit>${icon('edit')}Edit</button><button class="btn sm" data-trip-rebuild>${icon('shuffle')}Rebuild</button></div></div>
      <div class="week" style="grid-template-columns:repeat(auto-fill,minmax(210px,1fr))">${dates.map((d) => { const w = t.wx?.[d] || Weather.estimate(d, t.dest?.lat); const k = t.days?.[d]?.kind || t.dayKinds?.[d] || t.mainKind; return `<div class="day"><div class="day-h"><span class="day-name" style="font-size:18px">${DOW[dow(d)]} ${fmtShort(d)}</span></div>
        <div class="day-meta">${wxInline(w)}</div><div class="row"><select class="input" data-tk="${d}" style="min-height:32px;padding:4px 8px;font-size:12.5px">${KIND_ORDER.map((x) => `<option value="${x}"${x === k ? ' selected' : ''}>${KINDS[x].label}</option>`).join('')}</select></div>${miniHTML(t.days?.[d]?.items || [])}</div>`; }).join('')}</div>
      <div class="cols"><div class="card flat"><div class="section-head"><h3 class="section-title">Packing list</h3><span class="small muted num">${packedN}/${items.length} packed</span></div>
        <div class="list">${items.map((i) => `<label class="li" style="cursor:pointer"><input type="checkbox" class="check" data-pack="${i.id}" ${t.packList[i.id] ? 'checked' : ''}><div style="width:40px">${pieceHTML(i, { cls: 'sm' })}</div><span class="grow">${esc(i.name)}</span><span class="xs muted">${esc(CATS[i.cat].label)}</span></label>`).join('')}</div></div>
        <div class="card flat"><div class="section-head"><h3 class="section-title">Don’t forget</h3></div><div class="list">${extras.map((x) => `<div class="li small">${icon('check', 'xs')}${esc(x)}</div>`).join('')}</div>
        <p class="xs muted" style="margin-top:8px">Bottoms, shoes and layers are chosen to repeat so the bag stays small. Tops change daily.</p></div></div>`,
      foot: `<button class="btn quiet danger" data-trip-del>${icon('trash')}Delete trip</button><span class="grow"></span><button class="btn primary" data-trip-done>Done</button>` });
    $$('[data-pack]', el).forEach((c) => (c.onchange = () => { const tt = S.trips.get(id); tt.packList[c.dataset.pack] = c.checked; Store.put('trips', tt); el.refresh(); }));
    $$('[data-tk]', el).forEach((s) => (s.onchange = async () => { const tt = S.trips.get(id); tt.dayKinds[s.dataset.tk] = s.value; await buildTrip(tt, false); el.refresh(); }));
    $('[data-trip-rebuild]', el).onclick = async (e) => { e.currentTarget.innerHTML = '<span class="spinner"></span>'; await buildTrip(S.trips.get(id), true); el.refresh(); };
    $('[data-trip-edit]', el).onclick = () => { el.close(); openTripEditor(id); };
    $('[data-trip-done]', el).onclick = el.close;
    $('[data-trip-del]', el).onclick = () => confirmSheet('Delete this trip?', 'Its packing list goes too. Your pieces stay.', 'Delete', () => { Store.del('trips', id); el.close(); scheduleRender(); });
  };
  el.refresh();
}
