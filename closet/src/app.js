/* ───────────── actions + boot ───────────── */
const dd = (a) => a.dataset;
Object.assign(ACT, {
  nav: (a) => go(dd(a).r),
  search: () => { go('closet'); setTimeout(() => $('#closet-q')?.focus(), 80); },
  add: () => { closeAllSheets(); openAddSheet(); },
  'new-item': () => { closeAllSheets(); openItemSheet(null); },
  'paste-order': (a) => { closeAllSheets(); openPasteOrder(dd(a).store || ''); },
  gmail: (a) => { closeAllSheets(); openGmail(dd(a).q, dd(a).name); },
  csv: () => { closeAllSheets(); openCSV(); },
  'csv-template': () => saveFile('valet-closet-template.csv', CSV_TEMPLATE, 'text/csv'),
  retailers: () => { closeAllSheets(); openRetailers(); },
  interview: () => { closeAllSheets(); Interview.open(); },
  'load-sample': () => { loadSampleCloset(); S.plans.forEach((p, id) => Store.del('plans', id)); autoPlan(); toast('Sample closet loaded. Remove it any time from Today or Profile.'); go('today'); render(); },
  'remove-sample': () => confirmSheet('Remove the sample closet?', 'Sample pieces and plans that use them are removed. Anything you added stays.', 'Remove', () => { removeSampleCloset(); for (const [id, p] of [...S.plans]) { for (const d of Object.keys(p.days || {})) p.days[d].items = (p.days[d].items || []).filter((x) => S.items.get(x)); Store.put('plans', p); } autoPlan(); render(); }),
  occasion: (a) => openOccasion(dd(a).date),
  'set-kind': (a) => { const { plan, day } = dayRecord(dd(a).date); if (dd(a).k) day.kindSet = dd(a).k; else delete day.kindSet; savePlan(plan); planDay(dd(a).date, { lock: day.lockMap, keepLock: true }); closeTopSheet(); refreshSheets(); scheduleRender(); },
  weather: () => openWeatherSheet(),
  'wx-refresh': async () => { await Weather.refresh(true); closeTopSheet(); openWeatherSheet(); scheduleRender(); },
  'edit-location': () => openLocation(),
  'day-wx': (a) => openDayWeather(dd(a).date),
  swap: (a) => openSwap(dd(a).id, dd(a).date),
  'swap-pick': (a) => { const { plan, day } = dayRecord(dd(a).date); day.items = (day.items || []).map((x) => (x === dd(a).old ? dd(a).id : x)); day.manual = true; if (day.lockMap) for (const k in day.lockMap) if (day.lockMap[k] === dd(a).old) delete day.lockMap[k]; savePlan(plan); closeTopSheet(); refreshSheets(); scheduleRender(); },
  'lock-piece': (a) => { const { plan, day } = dayRecord(dd(a).date); const it = S.items.get(dd(a).id); const r = slotOf(it); day.lockMap = day.lockMap || {}; if (day.lockMap[r] === it.id) delete day.lockMap[r]; else day.lockMap[r] = it.id; savePlan(plan); closeTopSheet(); refreshSheets(); scheduleRender(); toast(day.lockMap[r] ? `${it.name} stays when you shuffle.` : 'Unlocked.'); },
  'remove-piece': (a) => { const { plan, day } = dayRecord(dd(a).date); day.items = (day.items || []).filter((x) => x !== dd(a).id); day.manual = true; savePlan(plan); closeTopSheet(); refreshSheets(); scheduleRender(); },
  'add-slot': (a) => { const { plan, day } = dayRecord(dd(a).date); const ctx = dayContext(dd(a).date, { kindSet: day.kindSet, wx: day.wx, jitter: 0 }); const best = slotPool(ctx, dd(a).slot)[0]; if (!best) { toast('No jackets or coats in rotation.'); return; } day.items = [...(day.items || []), best.it.id]; savePlan(plan); closeTopSheet(); refreshSheets(); scheduleRender(); },
  shuffle: (a) => {
    const date = dd(a).date; if (!activeItems().length) { openAddSheet(); return; }
    const { plan, day } = dayRecord(date); const used = usedAround(plan, date);
    (day.items || []).forEach((id) => { if (!Object.values(day.lockMap || {}).includes(id)) used.set(id, (used.get(id) || 0) + 1.2); });
    const r = planDay(date, { lock: day.lockMap, used, jitter: 1.6, keepLock: true });
    if (!r.items.length) toast('Not enough pieces fit this day yet. Add a few more, or change the occasion.');
    refreshSheets(); scheduleRender();
  },
  wear: (a) => {
    const date = dd(a).date; const { plan, day } = dayRecord(date); if (!(day.items || []).length) return;
    logWear(day.items, date, { key: 'day', kind: day.kind, title: day.title }); day.worn = true; savePlan(plan); Learn.build();
    toast(`Logged ${plural(day.items.length, 'piece')} as worn.`, { label: 'Undo', fn: () => ACT.unwear(a) }); refreshSheets(); scheduleRender();
  },
  unwear: (a) => { const date = dd(a).date; const { plan, day } = dayRecord(date); unlogWear(day.items || [], date); day.worn = false; delete day.rating; savePlan(plan); Learn.build(); refreshSheets(); scheduleRender(); },
  rate: (a) => {
    const date = dd(a).date; const { plan, day } = dayRecord(date); day.rating = day.rating === dd(a).v ? undefined : dd(a).v; savePlan(plan);
    const doc = S.log.get(date.slice(0, 7)); const e = doc?.entries?.find((x) => x.d === date && x.key === 'day'); if (e) { e.rating = day.rating; Store.put('log', doc); }
    Learn.build(); if (day.rating === 'love') toast('Noted. Valet will reach for these together more often.'); scheduleRender();
  },
  'save-look': (a) => { const { day } = dayRecord(dd(a).date); openSaveLook(day.items || [], dd(a).date); },
  'save-items': (a) => openSaveLook(dd(a).items.split(',')),
  'wear-items': (a) => { const items = dd(a).items.split(','); setDayItems(today(), items); closeAllSheets(); ACT.wear({ dataset: { date: today() } }); go('today'); },
  'use-items': (a) => { setDayItems(dd(a).date, dd(a).items.split(','), dd(a).title || 'Claude’s pick'); closeAllSheets(); toast(`Set for ${dd(a).date === today() ? 'today' : fmtDay(dd(a).date)}.`); },
  'use-look': (a) => { const o = S.outfits.get(dd(a).id); setDayItems(dd(a).date, o.items, o.name); closeTopSheet(); refreshSheets(); },
  'pick-look': (a) => openPickLook(dd(a).date),
  stylist: (a) => openStylist(dd(a).date),
  ask: async () => {
    const q = $('#ask-q')?.value.trim(); const out = $('#ask-out'); if (!q || !out) return;
    out.innerHTML = '<div class="row"><span class="spinner"></span>Claude is looking through your closet…</div>';
    try { out.innerHTML = stylistHTML(await AI.stylist(q, today()), today()); } catch (e) { out.innerHTML = `<div class="note warn">${icon('info')}<span>${esc(AI.errCopy(e))}</span></div>`; }
  },
  'all-clean': () => { itemsArr((i) => i.status === 'laundry').forEach((i) => { i.status = 'active'; Store.put('items', i); }); toast('Everything’s back in rotation.'); refreshSheets(); scheduleRender(); },
  'laundry-mode': () => openLaundry(),
  'week-nav': (a) => { const v = +dd(a).d; UI.weekOffset = v === 0 ? 0 : UI.weekOffset + v; renderMainOnly(); },
  'week-next': () => { UI.weekOffset = 1; },
  'plan-week': (a) => { planWeek(dd(a).wk); toast('Week planned. Tap a day to swap pieces or change the occasion.'); renderMainOnly(); },
  day: (a) => openDay(dd(a).date),
  'lock-day': (a) => { const { plan, day } = dayRecord(dd(a).date); day.locked = !day.locked; savePlan(plan); toast(day.locked ? 'Locked. Re-planning the week leaves this day alone.' : 'Unlocked.'); refreshSheets(); scheduleRender(); },
  'add-event': (a) => {
    const sh = a.closest('.sheet'); const title = $('#ev-title', sh)?.value.trim(); if (!title) { toast('Name the event first.'); return; }
    const date = dd(a).date; Store.put('events', { date, title, time: $('#ev-time', sh)?.value.trim() || '', src: 'manual' });
    const { day } = dayRecord(date); if (!day.locked && !day.worn) planDay(date, { lock: day.lockMap, keepLock: true });
    const k = classifyEvent({ title }); toast(k ? `Dressing for ${KINDS[k].label.toLowerCase()}.` : 'Added. Set the occasion if Valet should dress differently.'); refreshSheets(); scheduleRender();
  },
  'del-event': (a) => { const e = S.events.get(dd(a).id); Store.del('events', dd(a).id); if (e) { const { day } = dayRecord(e.date); if (!day.locked && !day.worn) planDay(e.date, { lock: day.lockMap, keepLock: true }); } refreshSheets(); scheduleRender(); },
  'closet-cat': (a) => { UI.closet.cat = dd(a).v; renderMainOnly(); },
  'closet-status': (a) => { UI.closet.status = dd(a).v; UI.closet.cat = 'all'; renderMainOnly(); },
  item: (a) => openItemSheet(dd(a).id),
  'looks-tab': (a) => { UI.looksTab = dd(a).v; renderMainOnly(); },
  'new-look': () => openLookBuilder(),
  look: (a) => openLook(dd(a).id),
  capsule: (a) => openCapsule(dd(a).key, dd(a).id),
  'wish-add': (a) => { const cat = Object.keys(CATS).find((k) => CATS[k].subs.includes(dd(a).sub)) || 'top'; Store.put('wishlist', { name: dd(a).name, cat, sub: dd(a).sub, colors: [dd(a).col], created: today() }); toast('Added to your wishlist.'); renderMainOnly(); },
  'wish-new': () => openSheet({ title: 'Add to wishlist', body: `<label class="field"><span>What is it?</span><input class="input" id="wn-name" placeholder="e.g. Black leather loafers"></label>
      <div class="grid2"><label class="field"><span>Type</span>${subSelectHTML('wn-sub', 'shoes', 'Loafers / flats')}</label><label class="field"><span>Price</span><input class="input num" id="wn-price" inputmode="decimal" placeholder="$"></label></div>
      <div class="field"><span>Color</span>${swatchesHTML('wn-col', ['black'], { max: 1 })}</div>`, foot: `<button class="btn primary" id="wn-save">Add & check fit</button>`,
    onMount: (el, close) => { bindSwatches(el); $('#wn-name', el).oninput = (e) => { const g = inferCategory(e.target.value); $('#wn-sub', el).value = `${g.cat}|${g.sub}`; const c = inferColors(e.target.value); if (c[0]) $$('.sw', el).forEach((s) => s.setAttribute('aria-pressed', String(s.dataset.color === c[0]))); };
      $('#wn-save', el).onclick = () => { const name = $('#wn-name', el).value.trim(); if (!name) return; const [cat, sub] = $('#wn-sub', el).value.split('|'); Store.put('wishlist', { name, cat, sub, colors: swatchVal($('[data-swatches]', el)), price: parseMoney($('#wn-price', el).value), created: today() }); close(); renderMainOnly(); }; } }),
  'wish-del': (a) => { Store.del('wishlist', dd(a).id); renderMainOnly(); },
  'export-json': () => exportJSON(),
  'export-csv': () => {
    const head = ['name', 'category', 'subcategory', 'colors', 'pattern', 'material', 'brand', 'store', 'price', 'purchase date', 'size', 'status', 'wears', 'cost per wear', 'last worn', 'notes'];
    const rows = itemsArr().map((i) => [i.name, CATS[i.cat]?.label, i.sub, (i.colors || []).map((c) => COLORS[c]?.label).join(' / '), i.pattern, i.material, i.brand, i.store, i.price ?? '', i.purchased, i.size, STATUSES[i.status || 'active'], wearsOf(i), cpw(i) != null ? cpw(i).toFixed(2) : '', lastWorn(i) || '', i.notes]);
    saveFile(`valet-closet-${today()}.csv`, [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n'), 'text/csv');
  },
  wipe: () => confirmSheet('Erase everything?', 'Every piece, photo, look, plan and setting is deleted. Back up first if you might want it later.', 'Erase', async () => { await Store.wipe(); render(); toast('Closet erased.'); }),
  'gcal-sync': async (a) => { a.disabled = true; const ok = await Cal.syncGoogle(true); if (ok) { const wk = weekKeyOf(today()); if (S.plans.get(wk)?.generated) planWeek(wk); toast(`Calendar synced: ${plural(Cal.google.length, 'event')} in the next four weeks.`); } else toast(Cal.gStatus || 'Couldn’t sync the calendar.'); render(); },
  'gcal-off': () => { Cal.disconnectGoogle(); render(); },
  trip: (a) => openTrip(dd(a).id),
  'new-trip': () => openTripEditor(),
});

/* ---------- backup ---------- */
async function exportJSON() {
  toast('Preparing your backup…');
  const items = [];
  for (const i of itemsArr()) {
    const o = clone(i);
    if (i.photo) { try { const local = await Store.exportPhotoData(i.photo); if (local) o.photoData = local; else { const src = Store.photoSrc(i.photo); if (src && !src.startsWith('data:')) { const b = await (await fetch(src)).blob(); o.photoData = await blobToDataURL(b); } else if (src) o.photoData = src; } } catch { /* photo left out */ } }
    delete o.photo; items.push(o);
  }
  const data = { app: 'valet', version: 1, exported: new Date().toISOString(), profile: S.profile, items };
  for (const c of COLLS) if (c !== 'items') data[c] = [...S[c].values()].filter((x) => c !== 'events' || x.src !== 'google');
  saveFile(`valet-backup-${today()}.json`, JSON.stringify(data), 'application/json');
}
async function importJSON(file) {
  let data; try { data = JSON.parse(await file.text()); } catch { toast('That file isn’t a Valet backup.'); return; }
  if (data?.app !== 'valet' || !Array.isArray(data.items)) { toast('That file isn’t a Valet backup.'); return; }
  confirmSheet('Restore this backup?', `${plural(data.items.length, 'piece')} from ${String(data.exported || '').slice(0, 10)}. Pieces with the same id are replaced; everything else stays.`, 'Restore', async () => {
    toast('Restoring…');
    for (const o of data.items) {
      const it = clone(o); delete it.photoData;
      if (o.photoData) { try { const b = await (await fetch(o.photoData)).blob(); it.photo = await Store.savePhoto(b); } catch { it.photo = null; } }
      Store.put('items', it);
    }
    for (const c of COLLS) if (c !== 'items' && Array.isArray(data[c])) data[c].forEach((x) => Store.put(c, x));
    if (data.profile) Store.saveProfile(Object.assign({}, data.profile));
    toast(`Restored ${plural(data.items.length, 'piece')}.`); autoPlan(); render();
  }, false);
}

/* ---------- page bindings after each render ---------- */
function afterRender() {
  const q = $('#closet-q'); if (q) q.oninput = debounce((e) => { UI.closet.q = e.target.value; $('#closet-grid').innerHTML = closetGridHTML(); }, 140);
  const so = $('#closet-sort'); if (so) so.onchange = (e) => { UI.closet.sort = e.target.value; $('#closet-grid').innerHTML = closetGridHTML(); };
  const ask = $('#ask-q'); if (ask) ask.onkeydown = (e) => { if (e.key === 'Enter') ACT.ask(); };
  if (UI.route !== 'profile') return;
  const P = (patch, rerender) => { Store.saveProfile(patch); if (rerender) scheduleRender(); };
  $('#pf-name').onchange = (e) => P({ name: e.target.value.trim() }, true);
  $('#pf-units').onchange = (e) => P({ units: e.target.value }, true);
  $('#pf-wstart').onchange = (e) => { P({ weekStartDow: +e.target.value }); autoPlan(); scheduleRender(); };
  $('#pf-auto').onchange = (e) => P({ autoPlan: e.target.checked });
  $('#pf-plandow').onchange = (e) => P({ planDow: +e.target.value });
  chipToggleGroup(document, '#pf-work', true, (g) => P({ workDays: pressedVals(g).map(Number) }));
  chipToggleGroup(document, '#pf-wfh', true, (g) => P({ wfhDays: pressedVals(g).map(Number) }));
  $('#pf-workkind').onchange = (e) => P({ workKind: e.target.value }, true);
  $('#pf-wl').oninput = (e) => ($('#pf-wl-l').textContent = DRESS_LEVELS[Math.round(+e.target.value)]);
  $('#pf-wl').onchange = (e) => { const kl = Object.assign({}, S.profile.kindLevels); kl[S.profile.workKind || 'work'] = +e.target.value; P({ kindLevels: kl }); };
  $('#pf-ics').onchange = async (e) => { const f = e.target.files[0]; if (!f) return; const n = Cal.importICS(await f.text()); const wk = weekKeyOf(today()); if (S.plans.get(wk)?.generated) planWeek(wk); toast(`Imported ${plural(n, 'event')} from the next three months.`); scheduleRender(); };
  $('#pf-restore').onchange = (e) => { const f = e.target.files[0]; if (f) importJSON(f); };
}

/* ---------- planning rhythm ---------- */
function autoPlan() {
  if (!activeItems().length) return;
  const t = today(); const wk = weekKeyOf(t); const plan = S.plans.get(wk);
  if (!plan?.generated) planWeek(wk); else if (!plan.days?.[t]?.items?.length) planDay(t);
  if (S.profile.autoPlan !== false && dow(t) === (S.profile.planDow ?? 0)) {
    const target = t === wk ? wk : addDays(wk, 7);
    if (target !== wk && !S.plans.get(target)?.generated) { planWeek(target); setTimeout(() => toast(`Your week of ${fmtShort(target)} is planned.`, { label: 'See it', fn: () => { UI.weekOffset = 1; go('week'); } }), 900); }
  }
}
const afterClosetChange = debounce(() => { Learn.build(); capsuleCache.stamp = ''; const t = today(); if (!getDay(t)?.items?.length) { autoPlan(); scheduleRender(); } }, 300);

async function boot() {
  $('#app').innerHTML = `<div class="shell"><main><div class="page"><div class="empty"><span class="spinner"></span><p>Opening your closet…</p></div></div></main></div>`;
  await Promise.all([Store.init(() => { Learn.stamp = 0; scheduleRender(); }), AI.init()]);
  UI.route = routeFromHash(); render();
  addEventListener('hashchange', () => { closeAllSheets(); if (UI.route !== 'week' && routeFromHash() === 'week' && UI.weekOffset < 0) UI.weekOffset = 0; render(); scrollTo(0, 0); });
  await Weather.refresh();
  if (IN_CLAUDE && Cal.gState === 'on') await Cal.syncGoogle();
  autoPlan(); render();
  // pick up a new day if the app stays open overnight
  let lastDay = today();
  setInterval(() => { if (today() !== lastDay) { lastDay = today(); Weather.refresh().then(() => { autoPlan(); render(); }); } }, 60000);
}
boot();
