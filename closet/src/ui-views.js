/* ───────────── pages ───────────── */

function greeting() { const h = new Date().getHours(); const n = (S.profile.name || '').split(' ')[0]; return `${h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'}${n ? ', ' + esc(n) : ''}`; }
function getDay(date) { return S.plans.get(weekKeyOf(date))?.days?.[date] || null; }
function forecastShift(day, date) {
  if (!day?.wxSnap || day.worn || day.locked || date < today()) return false;
  const w = Weather.forDate(date); const s = day.wxSnap;
  if (w.src !== 'live' && w.src !== 'claude') return false;
  return Math.abs((w.hi ?? 0) - (s.hi ?? 0)) >= 9 || ((w.rain ?? 0) >= 45) !== ((s.rain ?? 0) >= 45);
}

/* ---------- Today ---------- */
function viewWelcome() {
  return `<section class="welcome" style="padding-top:12px">
    <div class="stack" style="gap:18px">
      <div class="eyebrow">Your wardrobe, planned</div>
      <h1>Get dressed in <em>ten seconds</em>, not twenty minutes.</h1>
      <p class="muted" style="font-size:16px;max-width:46ch">Valet learns your style, reads the forecast and your calendar, and lays out a week of outfits from the clothes you already own. Every Sunday it plans the next one.</p>
      <div class="steps">
        <div class="step"><b>1</b><div><strong>Tell Valet your style.</strong> <span class="muted">A three-minute interview about your go-to looks and your week.</span></div></div>
        <div class="step"><b>2</b><div><strong>Bring in your pieces.</strong> <span class="muted">Photos, order emails from Stitch Fix, Nordstrom, Gap or Old Navy, or a spreadsheet.</span></div></div>
        <div class="step"><b>3</b><div><strong>Wear, tap, learn.</strong> <span class="muted">Log what you wore and see cost per wear, favorites and forgotten pieces.</span></div></div>
      </div>
      <div class="actions"><button class="btn primary" data-act="interview">${icon('sparkles')}Start the style interview</button><button class="btn" data-act="add">${icon('plus')}Add pieces first</button></div>
      <button class="btn quiet sm" data-act="load-sample" style="align-self:flex-start">Explore with a sample closet</button>
    </div>
    <div>${boardHTML([], { empty: emptyArt() + '<p class="small" style="margin-top:12px">Your first outfit appears here once your closet has a few pieces.</p>' })}</div>
  </section>`;
}

function viewToday() {
  if (!S.items.size) return viewWelcome();
  const d = today(); const day = getDay(d); const ctx = dayContext(d, { kindSet: day?.kindSet, wx: day?.wx });
  const w = ctx.wx; const loc = S.profile.location;
  const ids = (day?.items || []).filter((id) => S.items.get(id));
  const locks = day?.lockMap || {};
  const worn = !!day?.worn;
  const evs = ctx.events;
  const tm = addDays(d, 1); const tday = getDay(tm); const tctx = dayContext(tm, { kindSet: tday?.kindSet, wx: tday?.wx });
  return `
  <section class="today-hero">
    <div class="stack" style="gap:6px;min-width:0">
      <div class="eyebrow">${esc(fmtLong(d))}</div>
      <h1 class="page-title">${greeting()}</h1>
      <div class="row wrap" style="margin-top:4px">${kindChip(ctx.kind)}<button class="chip" data-act="occasion" data-date="${d}">${icon('edit')}Change</button></div>
    </div>
    <button class="card flat" data-act="weather" style="text-align:right;min-width:132px;cursor:pointer" aria-label="Weather details">
      <div class="row" style="justify-content:flex-end">${icon(wxIcon(w))}<span class="wx-big num">${tempOut(w.rawHi ?? w.hi)}</span></div>
      <div class="small">${esc(wxLabel(w))} · low ${tempOut(w.rawLo ?? w.lo)}</div>
      <div class="xs muted">${loc ? `${w.rain ?? 0}% rain · ${esc(loc.name.split(',')[0])}` : 'Estimate · set your city'}</div>
    </button>
  </section>
  ${Weather.status ? `<div class="note">${icon('info')}<span>${esc(Weather.status)}</span></div>` : ''}
  <section class="outfit-card">
    <div>${boardHTML(ids, { act: 'swap', date: d, locks, empty: `<div class="stack" style="align-items:center">${emptyArt()}<p>No outfit yet for today.</p><button class="btn primary" data-act="shuffle" data-date="${d}">${icon('sparkles')}Style me</button></div>` })}</div>
    <div class="stack" style="gap:16px">
      <div><div class="eyebrow">Today’s outfit</div><h2 class="display" style="font-size:30px;line-height:1.1;margin-top:4px">${esc(day?.title || outfitTitle(ctx))}</h2></div>
      ${(day?.reasons || []).length ? `<ul class="why">${day.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
      ${evs.length ? `<div class="events">${evs.slice(0, 5).map((e) => `<div class="ev"><span class="t">${esc(e.allDay ? 'All day' : e.time)}</span>${e.kind ? `<span class="badge">${esc(KINDS[e.kind].label)}</span>` : ''}<span class="n">${esc(e.title)}</span></div>`).join('')}</div>` : `<p class="small muted">${icon('calendar', 'xs')} Nothing on the calendar${Cal.gState === 'on' || S.profile.icsImported ? '' : ' that Valet can see. Connect a calendar in Profile.'}</p>`}
      ${ids.length ? (worn ? `<div class="note accent">${icon('check')}<div class="grow"><strong>Logged as worn.</strong> How did it feel?
          <div class="row" style="margin-top:8px"><button class="chip" aria-pressed="${day.rating === 'love'}" data-act="rate" data-v="love" data-date="${d}">${icon('heart')}Loved it</button><button class="chip" aria-pressed="${day.rating === 'meh'}" data-act="rate" data-v="meh" data-date="${d}">Not quite</button><button class="chip" data-act="unwear" data-date="${d}">Undo</button></div></div></div>`
        : `<div class="actions"><button class="btn primary" data-act="wear" data-date="${d}">${icon('check')}I wore this</button><button class="btn" data-act="shuffle" data-date="${d}">${icon('shuffle')}Shuffle</button><button class="btn" data-act="save-look" data-date="${d}">${icon('heart')}Save look</button>${AI.on ? `<button class="btn" data-act="stylist" data-date="${d}">${icon('sparkles')}Ask Claude</button>` : ''}</div>
           <p class="xs muted">Tap any piece to swap it or lock it in place before shuffling.</p>`) : ''}
    </div>
  </section>
  <section class="cols">
    <div class="card"><div class="section-head"><h3 class="section-title">Tomorrow</h3><a class="btn quiet sm" href="#week">Week ${icon('right')}</a></div>
      <div class="row between" style="margin-bottom:10px">${kindChip(tctx.kind)}${wxInline(tctx.wx)}</div>
      ${tday?.items?.length ? miniHTML(tday.items) : `<button class="btn block" data-act="shuffle" data-date="${tm}">${icon('sparkles')}Plan tomorrow</button>`}
    </div>
    <div class="card"><div class="section-head"><h3 class="section-title">Worth a look</h3></div>${nudgesHTML()}</div>
  </section>`;
}

function nudgesHTML() {
  const out = []; const t = today();
  if (itemsArr((i) => i.sample).length) out.push(`<div class="note accent">${icon('info')}<div class="grow">You’re exploring a sample closet. <button class="btn quiet sm" data-act="remove-sample">Remove sample pieces</button></div></div>`);
  if (!S.profile.interviewDone) out.push(`<button class="li-btn" data-act="interview">${icon('sparkles')}<span class="grow"><strong>Take the style interview</strong><br><span class="small muted">Three minutes, and every outfit gets more you.</span></span>${icon('right')}</button>`);
  if (!S.profile.location) out.push(`<button class="li-btn" data-act="edit-location">${icon('pin')}<span class="grow"><strong>Add your city</strong><br><span class="small muted">So outfits follow the real forecast.</span></span>${icon('right')}</button>`);
  const trip = [...S.trips.values()].filter((x) => x.end >= t).sort(by((x) => x.start))[0];
  if (trip && daysBetween(t, trip.start) <= 14) out.push(`<button class="li-btn" data-act="trip" data-id="${trip.id}">${icon('suitcase')}<span class="grow"><strong>${esc(trip.dest?.name?.split(',')[0] || trip.name)} ${trip.start <= t ? 'now' : 'in ' + plural(daysBetween(t, trip.start), 'day')}</strong><br><span class="small muted">Packing list: ${plural(Object.keys(trip.packList || {}).length, 'piece')}</span></span>${icon('right')}</button>`);
  const laundry = itemsArr((i) => i.status === 'laundry');
  if (laundry.length) out.push(`<div class="li">${icon('wash')}<span class="grow"><strong>${plural(laundry.length, 'piece')} in the laundry</strong><br><span class="small muted">Left out of outfits until they’re back.</span></span><button class="btn sm" data-act="all-clean">All clean</button></div>`);
  const sleepers = activeItems().filter((i) => !['accessory'].includes(i.cat) && daysBetween(i.created || t, t) > 30 && (!lastWorn(i) || daysBetween(lastWorn(i), t) > 60)).sort(by((i) => lastWorn(i) || '0')).slice(0, 4);
  if (sleepers.length) out.push(`<div class="stack" style="gap:8px;padding:12px 0"><div><strong>Forgotten favorites?</strong> <span class="small muted">Not worn in 60+ days.</span></div><div class="capsule-strip" style="grid-template-columns:repeat(4,1fr)">${sleepers.map((i) => pieceHTML(i, { cls: 'sm', act: 'item' })).join('')}</div></div>`);
  if (dow(t) === (S.profile.planDow ?? 0)) { const nx = addDays(weekKeyOf(t), 7); if (S.plans.get(nx)?.generated) out.push(`<a class="li-btn" href="#week" data-act="week-next">${icon('week')}<span class="grow"><strong>Next week is planned</strong><br><span class="small muted">Week of ${fmtShort(nx)}. Swap anything you like.</span></span>${icon('right')}</a>`); }
  return out.length ? `<div class="list">${out.join('')}</div>` : `<p class="muted small">Nothing needs you right now.</p>`;
}

/* ---------- Week ---------- */
function weekTabs(cur) { return `<div class="seg" role="group"><button aria-pressed="${cur === 'plan'}" data-act="nav" data-r="week">Plan</button><button aria-pressed="${cur === 'trips'}" data-act="nav" data-r="trips">Trips</button></div>`; }
function viewWeek() {
  const base = weekKeyOf(today()); const wk = addDays(base, 7 * UI.weekOffset); const plan = S.plans.get(wk);
  const label = UI.weekOffset === 0 ? 'This week' : UI.weekOffset === 1 ? 'Next week' : UI.weekOffset === -1 ? 'Last week' : `Week of ${fmtShort(wk)}`;
  const dates = [...Array(7)].map((_, i) => addDays(wk, i)); const t = today();
  const all = dates.flatMap((d) => (plan?.days?.[d]?.items || []).filter((id) => S.items.get(id)));
  const core = all.filter((id) => CORE.has(slotOf(S.items.get(id))));
  const repeats = core.length - new Set(core).size;
  const head = `<div class="page-head"><div><div class="eyebrow">${fmtShort(wk)} – ${fmtShort(addDays(wk, 6))}</div><h1 class="page-title">${label}</h1></div>${weekTabs('plan')}</div>
    <div class="row between wrap"><div class="row"><button class="iconbtn" data-act="week-nav" data-d="-1" aria-label="Previous week">${icon('left')}</button><button class="btn sm" data-act="week-nav" data-d="0">Today</button><button class="iconbtn" data-act="week-nav" data-d="1" aria-label="Next week">${icon('right')}</button></div>
    ${S.items.size ? `<button class="btn ${plan?.generated ? '' : 'primary'} sm" data-act="plan-week" data-wk="${wk}">${icon('sparkles')}${plan?.generated ? 'Re-plan open days' : 'Plan this week'}</button>` : ''}</div>`;
  if (!S.items.size) return head + `<div class="empty">${emptyArt()}<h3>Your week starts with your closet</h3><p>Add a handful of pieces and Valet lays out seven days of outfits, matched to the forecast and your calendar.</p><button class="btn primary" data-act="add">${icon('plus')}Add pieces</button></div>`;
  const cards = dates.map((d) => {
    const day = plan?.days?.[d]; const ctx = dayContext(d, { kindSet: day?.kindSet, wx: day?.wx }); const past = d < t;
    const evs = ctx.events.filter((e) => e.kind || !e.allDay).slice(0, 2);
    return `<button class="day ${d === t ? 'is-today' : ''} ${past ? 'past' : ''}" data-act="day" data-date="${d}">
      <div class="day-h"><span class="day-name">${DOW_LONG[dow(d)]}</span><span class="muted small num">${fmtShort(d)}</span></div>
      <div class="day-meta">${wxInline(ctx.wx)}<span>·</span>${kindIcon(ctx.kind)}<span>${esc(KINDS[ctx.kind].label)}</span></div>
      ${day?.items?.length ? miniHTML(day.items) : `<div class="mini" style="grid-template-columns:1fr"><div class="piece" style="aspect-ratio:4/1.2;font-size:12.5px;color:#888">${past ? 'Nothing logged' : 'Tap to plan'}</div></div>`}
      ${evs.length ? `<div class="events">${evs.map((e) => `<div class="ev"><span class="t">${esc(e.time || 'All day')}</span><span class="n small">${esc(e.title)}</span></div>`).join('')}</div>` : ''}
      <div class="row wrap">${day?.worn ? `<span class="badge good">${icon('check', 'xs')} Worn</span>` : ''}${day?.locked ? `<span class="badge">${icon('lock', 'xs')} Locked</span>` : ''}${forecastShift(day, d) ? `<span class="badge warn">Forecast changed</span>` : ''}${ctx.also.includes('active') ? `<span class="badge accent">+ gym kit</span>` : ''}</div>
    </button>`;
  }).join('');
  const stats = plan?.generated ? `<div class="note">${icon('info')}<span>${plural(new Set(all).size, 'piece')} across the week${repeats ? `, ${plural(repeats, 'core piece')} repeated` : ', no tops, bottoms or dresses repeated'}. ${Weather.src && Weather.src !== 'live' ? esc(Weather.srcLabel(Weather.src)) + ' used for weather.' : ''}</span></div>` : '';
  return head + stats + `<div class="week">${cards}</div>`;
}

/* ---------- Trips ---------- */
function viewTrips() {
  const t = today(); const trips = [...S.trips.values()].sort(by((x) => x.start));
  const up = trips.filter((x) => x.end >= t), past = trips.filter((x) => x.end < t).reverse();
  const card = (x) => `<button class="look" data-act="trip" data-id="${x.id}">
      <div class="row between"><div class="grow"><div class="eyebrow">${fmtShort(x.start)} – ${fmtShort(x.end)} · ${plural(daysBetween(x.start, x.end) + 1, 'day')}</div><h3 class="display" style="font-size:22px">${esc(x.dest?.name?.split(',')[0] || x.name || 'Trip')}</h3></div>${icon('suitcase')}</div>
      ${Object.keys(x.packList || {}).length ? `<div class="capsule-strip">${Object.keys(x.packList).map((id) => S.items.get(id)).filter(Boolean).slice(0, 12).map((i) => pieceHTML(i, { cls: 'sm' })).join('')}</div>` : ''}
      <div class="small muted">${plural(Object.keys(x.packList || {}).length, 'piece')} · ${Object.values(x.packList || {}).filter(Boolean).length} packed</div></button>`;
  return `<div class="page-head"><div><div class="eyebrow">Travel</div><h1 class="page-title">Trips</h1></div>${weekTabs('trips')}</div>
    <div class="row"><button class="btn primary" data-act="new-trip">${icon('plus')}New trip</button><span class="small muted">Valet checks the destination’s weather and builds a mix-and-match packing list.</span></div>
    ${up.length ? `<div class="looks-grid">${up.map(card).join('')}</div>` : `<div class="empty">${icon('suitcase')}<h3>Going somewhere?</h3><p>Add a trip and get outfits for each day plus a packing list that reuses pieces, so your bag stays light.</p></div>`}
    ${past.length ? `<h3 class="section-title">Past trips</h3><div class="looks-grid">${past.map(card).join('')}</div>` : ''}`;
}

/* ---------- Closet ---------- */
function closetFiltered() {
  const C = UI.closet; const q = C.q.trim().toLowerCase();
  let list = itemsArr((i) => (C.status === 'all' ? i.status !== 'retired' : (i.status || 'active') === C.status) && (C.cat === 'all' || i.cat === C.cat));
  if (q) list = list.filter((i) => `${i.name} ${i.brand} ${i.store} ${i.sub} ${(i.colors || []).map((c) => COLORS[c]?.label).join(' ')} ${i.material} ${i.notes}`.toLowerCase().includes(q));
  const sorts = { recent: by((i) => i.purchased || i.created || '', -1), worn: by(wearsOf, -1), least: by((i) => wearsOf(i) + (lastWorn(i) ? 0 : -0.5)), cpw: by((i) => cpw(i) ?? -1, -1), price: by((i) => i.price || 0, -1), name: by((i) => i.name.toLowerCase()), last: by((i) => lastWorn(i) || '') };
  return list.sort(sorts[C.sort] || sorts.recent);
}
function itemCardHTML(i) {
  const n = wearsOf(i); const c = cpw(i);
  return `<button class="item" data-act="item" data-id="${i.id}">${pieceHTML(i)}
    ${i.status && i.status !== 'active' ? `<span class="flag badge ${i.status === 'donate' ? 'warn' : ''}">${esc(STATUSES[i.status])}</span>` : ''}${i.fav ? `<span class="fav">${icon('heart')}</span>` : ''}
    <span class="item-b"><span class="item-n">${esc(i.name || i.sub)}</span><span class="item-m"><span>${n ? plural(n, 'wear') : 'Never worn'}</span>${c != null ? `<span>· ${money(c, c < 10 ? 2 : 0)}/wear</span>` : ''}</span></span></button>`;
}
function viewCloset() {
  const C = UI.closet; const all = itemsArr((i) => i.status !== 'retired');
  const counts = {}; all.forEach((i) => { if ((i.status || 'active') === C.status || C.status === 'all') counts[i.cat] = (counts[i.cat] || 0) + 1; });
  const val = sum(all.map((i) => i.price || 0));
  return `<div class="page-head"><div><div class="eyebrow">${plural(all.length, 'piece')}${val ? ` · ${money(val)} invested` : ''}</div><h1 class="page-title">Closet</h1></div>
      <div class="row"><button class="btn sm" data-act="laundry-mode">${icon('wash')}Laundry</button><button class="btn primary sm" data-act="add">${icon('plus')}Add</button></div></div>
    <div class="toolbar"><label class="search"><span class="sr">Search</span>${icon('search')}<input class="input" id="closet-q" placeholder="Search name, brand, store, color" value="${esc(C.q)}" autocomplete="off"></label>
      ${selectHTML('closet-sort', [['recent', 'Newest'], ['worn', 'Most worn'], ['least', 'Least worn'], ['last', 'Longest unworn'], ['cpw', 'Highest cost/wear'], ['price', 'Price'], ['name', 'A–Z']], C.sort)}</div>
    <div class="chips scroll" role="group" aria-label="Category"><button class="chip" aria-pressed="${C.cat === 'all'}" data-act="closet-cat" data-v="all">All</button>${CAT_ORDER.filter((k) => counts[k]).map((k) => `<button class="chip" aria-pressed="${C.cat === k}" data-act="closet-cat" data-v="${k}">${CATS[k].label} <span class="muted num">${counts[k]}</span></button>`).join('')}</div>
    <div class="chips scroll" role="group" aria-label="Status">${[['active', 'In rotation'], ['laundry', 'Laundry'], ['tailor', 'Tailor'], ['storage', 'Storage'], ['donate', 'Donate / sell'], ['all', 'Everything']].map(([k, l]) => `<button class="chip soft" aria-pressed="${C.status === k}" data-act="closet-status" data-v="${k}">${l}</button>`).join('')}</div>
    <div id="closet-grid">${closetGridHTML()}</div>`;
}
function closetGridHTML() {
  const list = closetFiltered();
  if (!S.items.size) return `<div class="empty">${emptyArt()}<h3>An empty rail</h3><p>Snap a few photos, paste an order email, or import a spreadsheet. Ten pieces is enough for Valet to start styling.</p><button class="btn primary" data-act="add">${icon('plus')}Add your first pieces</button></div>`;
  if (!list.length) return `<div class="empty"><p>Nothing matches. Try another filter.</p></div>`;
  return `<div class="items">${list.map(itemCardHTML).join('')}</div>`;
}

/* ---------- Looks + capsules ---------- */
function viewLooks() {
  const tab = UI.looksTab;
  const head = `<div class="page-head"><div><div class="eyebrow">Outfits & capsules</div><h1 class="page-title">Looks</h1></div>
    <div class="seg" role="group"><button aria-pressed="${tab === 'saved'}" data-act="looks-tab" data-v="saved">Saved</button><button aria-pressed="${tab === 'capsules'}" data-act="looks-tab" data-v="capsules">Capsules</button><button aria-pressed="${tab === 'ideas'}" data-act="looks-tab" data-v="ideas">Ideas</button></div></div>`;
  if (!S.items.size) return head + `<div class="empty">${emptyArt()}<h3>Looks start with pieces</h3><p>Once your closet has a few items, build and save outfits here, and Valet will suggest capsules that mix every way.</p><button class="btn primary" data-act="add">${icon('plus')}Add pieces</button></div>`;
  if (tab === 'capsules') return head + capsulesHTML();
  if (tab === 'ideas') return head + ideasHTML();
  const looks = [...S.outfits.values()].sort(by((o) => o.created || '', -1));
  return head + `<div class="row"><button class="btn primary" data-act="new-look">${icon('plus')}Build a look</button><span class="small muted">Saved looks teach Valet which pieces you like together.</span></div>
    ${looks.length ? `<div class="looks-grid">${looks.map((o) => `<button class="look" data-act="look" data-id="${o.id}">${boardHTML(o.items, { caps: false })}<div class="row between"><strong class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(o.name || 'Untitled look')}</strong>${o.fav ? `<span style="color:var(--accent)">${icon('heart')}</span>` : ''}</div><div class="small muted">${(o.kinds || []).map((k) => KINDS[k]?.label).filter(Boolean).join(', ') || 'Any occasion'}</div></button>`).join('')}</div>`
      : `<div class="empty"><h3>No saved looks yet</h3><p>Save an outfit from Today or the Week, or build one here piece by piece.</p></div>`}`;
}
let capsuleCache = { stamp: '', list: [] };
function capsulesHTML() {
  const stamp = `${S.items.size}:${[...S.items.values()].map((i) => i.updated || 0).reduce((a, b) => Math.max(a, b), 0)}`;
  if (capsuleCache.stamp !== stamp) capsuleCache = { stamp, list: Object.keys(CAPSULE_PRESETS).map(buildCapsule).filter((c) => c.items.length >= 5) };
  const saved = [...S.capsules.values()];
  const card = (c, saved) => `<button class="look" data-act="capsule" ${saved ? `data-id="${c.id}"` : `data-key="${c.key}"`}>
    <div class="row between"><div class="grow"><h3 class="display" style="font-size:22px">${esc(c.label || c.name)}</h3><div class="small muted">${esc(c.blurb || c.note || '')}</div></div><span class="badge accent num">${c.combos ?? countCombos(c.items.map((id) => S.items.get(id)).filter(Boolean))} outfits</span></div>
    <div class="capsule-strip">${c.items.map((id) => S.items.get(id)).filter(Boolean).map((i) => pieceHTML(i, { cls: 'sm' })).join('')}</div>
    <div class="small muted">${plural(c.items.length, 'piece')}</div></button>`;
  return `<p class="muted" style="max-width:62ch">A capsule is a small set of pieces that all work together. Valet picks versatile neutrals first, then tops that pair with the most bottoms, and counts how many outfits the set makes.</p>
    ${saved.length ? `<h3 class="section-title">Your capsules</h3><div class="looks-grid">${saved.map((c) => card(c, true)).join('')}</div><h3 class="section-title">Suggested</h3>` : ''}
    ${capsuleCache.list.length ? `<div class="looks-grid">${capsuleCache.list.map((c) => card(c, false)).join('')}</div>` : `<div class="note">${icon('info')}<span>Add more pieces (a few tops, bottoms and shoes) and capsule suggestions appear here.</span></div>`}`;
}
function ideasHTML() {
  const g = closetGaps(); const wl = [...S.wishlist.values()];
  return `<div class="cols">
    <div class="card"><div class="section-head"><h3 class="section-title">Smart shopping list</h3></div>
      <p class="small muted" style="margin-bottom:8px">Staples you don’t own yet, ranked by how many of your pieces each one would pair with.</p>
      ${g.staples.length ? `<div class="list">${g.staples.map((s) => `<div class="li">${pieceHTML(virtualItem(s.sub, s.col), { cls: 'sm' }).replace('class="piece sm"', 'class="piece sm" style="width:48px"')}<div class="grow"><strong>${esc(s.name)}</strong><div class="small muted">Pairs with ${plural(s.n, 'piece')} you own</div></div><button class="btn sm" data-act="wish-add" data-name="${esc(s.name)}" data-sub="${esc(s.sub)}" data-col="${s.col}">${icon('plus')}Wishlist</button></div>`).join('')}</div>` : '<p class="small muted">Your staples are covered.</p>'}
      ${g.notes.length ? `<div class="stack" style="margin-top:12px;gap:8px">${g.notes.map((n) => `<div class="note warn">${icon('info')}<span>${esc(n)}</span></div>`).join('')}</div>` : ''}
    </div>
    <div class="card"><div class="section-head"><h3 class="section-title">Wishlist</h3><button class="btn sm" data-act="wish-new">${icon('plus')}Add</button></div>
      <p class="small muted" style="margin-bottom:8px">Before you buy, see how hard a piece would work with what you already have.</p>
      ${wl.length ? `<div class="list">${wl.map((w) => { const im = purchaseImpact(w); return `<div class="li">${pieceHTML(virtualItem(w.sub, (w.colors || ['black'])[0]), { cls: 'sm' }).replace('class="piece sm"', 'class="piece sm" style="width:48px"')}<div class="grow"><strong>${esc(w.name)}</strong><div class="small muted">${w.price ? money(w.price) + ' · ' : ''}pairs with ${plural(im.n, 'piece')}${im.similar.length ? ` · you own ${plural(im.similar.length, 'similar piece')}` : ''}${w.price && im.n ? ` · ${money(w.price / Math.max(1, im.n * 3), 2)}/wear if worn 3× per pairing` : ''}</div></div><button class="iconbtn" data-act="wish-del" data-id="${w.id}" aria-label="Remove">${icon('trash')}</button></div>`; }).join('')}</div>` : '<p class="small muted">Nothing on your wishlist.</p>'}
    </div></div>
    ${AI.on ? `<div class="card"><div class="section-head"><h3 class="section-title">${icon('sparkles')} Ask Claude for a look</h3></div><div class="row"><input class="input grow" id="ask-q" placeholder="What should I wear to a winter wedding?"><button class="btn primary" data-act="ask">Ask</button></div><div id="ask-out" class="stack" style="margin-top:12px"></div></div>` : ''}`;
}

/* ---------- Insights ---------- */
function viewInsights() {
  const items = itemsArr((i) => i.status !== 'retired'); const t = today();
  if (!items.length) return `<div class="page-head"><div><div class="eyebrow">Wear patterns</div><h1 class="page-title">Insights</h1></div></div><div class="empty"><h3>Numbers need a closet</h3><p>Add pieces and log what you wear. Cost per wear, favorites and forgotten pieces show up here.</p></div>`;
  const priced = items.filter((i) => i.price); const value = sum(priced.map((i) => i.price));
  const totalWears = sum(items.map(wearsOf));
  const recent = items.filter((i) => lastWorn(i) && daysBetween(lastWorn(i), t) <= 90);
  const util = Math.round((recent.length / items.length) * 100);
  const avgCpw = priced.length ? sum(priced.map((i) => i.price)) / Math.max(1, sum(priced.map(wearsOf))) : null;
  // heatmap: last 26 weeks
  const start = addDays(weekStartOf(t, 0), -7 * 25); const counts = {};
  const wearDays = {}; items.forEach((i) => (i.wears || []).forEach((d) => { if (d >= start) { wearDays[d] = wearDays[d] || new Set(); wearDays[d].add(i.id); } }));
  for (const [d, set] of Object.entries(wearDays)) counts[d] = set.size;
  let heat = ''; for (let k = 0; k < 26 * 7; k++) { const d = addDays(start, k); if (d > t) { heat += '<i style="visibility:hidden"></i>'; continue; } const n = counts[d] || 0; const l = n === 0 ? 0 : n < 3 ? 1 : n < 5 ? 2 : n < 7 ? 3 : 4; heat += `<i data-l="${l}" data-tip="${fmtDay(d)}: ${n ? plural(n, 'piece') + ' worn' : 'nothing logged'}"></i>`; }
  const bars = (rows, fmt = (v) => v, maxV) => { const mx = maxV ?? Math.max(1, ...rows.map((r) => r[1])); return `<div class="bars">${rows.map(([l, v, tip, id]) => `<div class="bar" data-tip="${esc(tip || l + ': ' + fmt(v))}">${id ? `<button class="lbl" style="border:0;background:none;padding:0;text-align:left;cursor:pointer;color:var(--ink-2)" data-act="item" data-id="${id}">${esc(l)}</button>` : `<span class="lbl">${esc(l)}</span>`}<span class="trk"><span class="fil" style="width:${(v / mx) * 100}%;display:block"></span></span><span class="val">${fmt(v)}</span></div>`).join('')}</div>`; };
  const most = items.filter(wearsOf).sort(by(wearsOf, -1)).slice(0, 8).map((i) => [i.name, wearsOf(i), `${i.name}: ${plural(wearsOf(i), 'wear')}`, i.id]);
  const best = priced.filter((i) => wearsOf(i) >= 3).sort(by(cpw)).slice(0, 6).map((i) => [i.name, cpw(i), `${i.name}: ${money(i.price)} over ${plural(wearsOf(i), 'wear')}`, i.id]);
  const worst = priced.filter((i) => daysBetween(i.purchased || i.created || t, t) > 30).sort(by((i) => cpw(i), -1)).slice(0, 6).map((i) => [i.name, cpw(i), `${i.name}: ${money(i.price)}, worn ${plural(wearsOf(i), 'time')}`, i.id]);
  const sleepers = items.filter((i) => (i.status || 'active') === 'active' && daysBetween(i.created || t, t) > 30 && (!lastWorn(i) || daysBetween(lastWorn(i), t) > 90)).sort(by((i) => lastWorn(i) || '0'));
  const byCat = CAT_ORDER.map((k) => [CATS[k].label, sum(items.filter((i) => i.cat === k).map(wearsOf))]).filter((r) => r[1]);
  const dowCounts = [0, 0, 0, 0, 0, 0, 0]; logEntries().forEach((e) => dowCounts[dow(e.d)]++);
  const dowRows = [1, 2, 3, 4, 5, 6, 0].map((k) => [DOW[k], dowCounts[k]]);
  const stores = {}; priced.forEach((i) => { const s = i.store || 'Unknown'; stores[s] = (stores[s] || 0) + i.price; });
  const storeRows = Object.entries(stores).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([s, v]) => [s, v, `${s}: ${money(v)} across ${plural(priced.filter((i) => (i.store || 'Unknown') === s).length, 'piece')}`]);
  const months = []; for (let k = 11; k >= 0; k--) { const d = parseISO(t); d.setDate(1); d.setMonth(d.getMonth() - k); months.push(iso(d).slice(0, 7)); }
  const spend = months.map((m) => [m, sum(priced.filter((i) => (i.purchased || '').startsWith(m)).map((i) => i.price))]); const spMax = Math.max(1, ...spend.map((s) => s[1]));
  const colorCount = {}; items.forEach((i) => { const c = (i.colors || [])[0]; if (c) colorCount[c] = (colorCount[c] || 0) + 1; });
  const pal = Object.entries(colorCount).sort((a, b) => b[1] - a[1]);
  return `<div class="page-head"><div><div class="eyebrow">Wear patterns & value</div><h1 class="page-title">Insights</h1></div>${S.items.size ? `<button class="btn sm" data-act="export-csv">${icon('download')}Export CSV</button>` : ''}</div>
  <div class="kpis">
    <div class="kpi"><span class="eyebrow">Closet value</span><b>${money(value)}</b><small>${plural(priced.length, 'priced piece')} of ${items.length}</small></div>
    <div class="kpi"><span class="eyebrow">Avg cost / wear</span><b>${avgCpw != null ? money(avgCpw, 2) : '—'}</b><small>${plural(totalWears, 'wear')} logged</small></div>
    <div class="kpi"><span class="eyebrow">Worn in 90 days</span><b>${util}%</b><small>${recent.length} of ${items.length} pieces</small></div>
    <div class="kpi"><span class="eyebrow">Sleeping</span><b>${sleepers.length}</b><small>not worn in 90+ days</small></div>
  </div>
  <div class="card"><div class="section-head"><h3 class="section-title">What you wore, last 26 weeks</h3><span class="legend">Less <i style="background:var(--surface-2)"></i><i style="background:color-mix(in srgb,var(--accent) 30%,var(--surface-2))"></i><i style="background:color-mix(in srgb,var(--accent) 55%,var(--surface-2))"></i><i style="background:var(--accent)"></i> More</span></div>
    <div class="heat" role="img" aria-label="Pieces worn per day over the last 26 weeks">${heat}</div><p class="xs muted" style="margin-top:6px">Each square is a day, Sunday at the top. Darker means more pieces logged.</p></div>
  <div class="cols">
    <div class="card"><div class="section-head"><h3 class="section-title">Most worn</h3><span class="xs muted">wears</span></div>${most.length ? bars(most) : '<p class="small muted">Log a few outfits to see your workhorses.</p>'}</div>
    <div class="card"><div class="section-head"><h3 class="section-title">Best value</h3><span class="xs muted">cost per wear</span></div>${best.length ? bars(best, (v) => money(v, 2)) : '<p class="small muted">Add prices and wears to see your best buys.</p>'}</div>
    <div class="card"><div class="section-head"><h3 class="section-title">Highest cost per wear</h3><span class="xs muted">wear these more</span></div>${worst.length ? bars(worst, (v) => money(v, v < 10 ? 2 : 0)) : '<p class="small muted">Nothing yet.</p>'}</div>
    <div class="card"><div class="section-head"><h3 class="section-title">Sleeping pieces</h3><span class="xs muted">${sleepers.length}</span></div>${sleepers.length ? `<div class="capsule-strip">${sleepers.slice(0, 18).map((i) => pieceHTML(i, { cls: 'sm', act: 'item' })).join('')}</div><p class="xs muted" style="margin-top:8px">Valet gives these a nudge in your plans. Still not reaching for one after a month? Mark it Donate / sell.</p>` : '<p class="small muted">Everything has been out recently. Nicely done.</p>'}</div>
    <div class="card"><div class="section-head"><h3 class="section-title">Wears by category</h3></div>${byCat.length ? bars(byCat) : '<p class="small muted">No wears logged yet.</p>'}</div>
    <div class="card"><div class="section-head"><h3 class="section-title">Outfits logged by weekday</h3></div>${sum(dowCounts) ? bars(dowRows) : '<p class="small muted">Tap “I wore this” on Today to start the log.</p>'}</div>
    <div class="card"><div class="section-head"><h3 class="section-title">Spending by store</h3></div>${storeRows.length ? bars(storeRows, (v) => money(v)) : '<p class="small muted">Add prices and stores to see where your money goes.</p>'}</div>
    <div class="card"><div class="section-head"><h3 class="section-title">Purchases, last 12 months</h3><span class="xs muted num">${money(sum(spend.map((s) => s[1])))}</span></div>
      <div class="cols-chart" role="img" aria-label="Spending per month">${spend.map(([m, v]) => `<div class="c" data-tip="${MON[+m.slice(5) - 1]} ${m.slice(0, 4)}: ${money(v)}"><b style="height:${(v / spMax) * 100}%"></b><span>${MON[+m.slice(5) - 1].charAt(0)}</span></div>`).join('')}</div></div>
  </div>
  <div class="card"><div class="section-head"><h3 class="section-title">Your palette</h3><span class="xs muted">by main color</span></div>
    <div class="palette">${pal.map(([c, n]) => `<i style="flex:${n};background:${COLORS[c]?.hex};${c === 'white' ? 'box-shadow:inset 0 0 0 1px var(--line)' : ''}" data-tip="${COLORS[c]?.label}: ${plural(n, 'piece')}"></i>`).join('')}</div>
    <div class="row wrap" style="margin-top:10px">${pal.slice(0, 10).map(([c, n]) => `<span class="row small" style="gap:6px"><span class="dot" style="background:${COLORS[c]?.hex}"></span>${COLORS[c]?.label} <span class="muted num">${n}</span></span>`).join('')}</div></div>`;
}

/* ---------- Profile ---------- */
function viewProfile() {
  const p = S.profile; const days = [1, 2, 3, 4, 5, 6, 0];
  const icsN = [...S.events.values()].filter((e) => e.src === 'ics').length;
  return `<div class="page-head"><div><div class="eyebrow">You & your setup</div><h1 class="page-title">${esc(p.name || 'Profile')}</h1></div><button class="btn primary sm" data-act="interview">${icon('sparkles')}${p.interviewDone ? 'Retake style interview' : 'Style interview'}</button></div>
  <div class="cols">
  <div class="card stack">
    <h3 class="section-title">Basics</h3>
    <label class="field"><span>Name</span><input class="input" id="pf-name" value="${esc(p.name)}" placeholder="Your first name"></label>
    <div class="field"><span>City for weather</span><button class="btn" data-act="edit-location" style="justify-content:flex-start">${icon('pin')}${esc(p.location?.name || 'Choose a city')}</button></div>
    <div class="grid2"><label class="field"><span>Temperatures</span>${selectHTML('pf-units', [['F', '°F'], ['C', '°C']], p.units)}</label>
      <label class="field"><span>Weeks start on</span>${selectHTML('pf-wstart', [[1, 'Monday'], [0, 'Sunday']], p.weekStartDow ?? 1)}</label></div>
    <div class="toggle"><div><strong>Plan my week automatically</strong><div class="small muted">Valet lays out next week when you open it on your planning day.</div></div><input type="checkbox" class="switch" id="pf-auto" ${p.autoPlan ? 'checked' : ''}></div>
    <label class="field"><span>Planning day</span>${selectHTML('pf-plandow', [0, 1, 2, 3, 4, 5, 6].map((d) => [d, DOW_LONG[d]]), p.planDow ?? 0)}</label>
  </div>
  <div class="card stack">
    <h3 class="section-title">Your week</h3>
    <div class="field"><span>Work days</span><div class="chips" id="pf-work">${days.map((d) => `<button class="chip" aria-pressed="${(p.workDays || []).includes(d)}" data-v="${d}">${DOW[d]}</button>`).join('')}</div></div>
    <div class="field"><span>Work-from-home days</span><div class="chips" id="pf-wfh">${days.map((d) => `<button class="chip" aria-pressed="${(p.wfhDays || []).includes(d)}" data-v="${d}">${DOW[d]}</button>`).join('')}</div></div>
    <label class="field"><span>A typical workday is mostly</span>${selectHTML('pf-workkind', [['work', 'Office / desk work'], ['client', 'Client-facing meetings'], ['showing', 'On my feet: showings, tours, site visits']], p.workKind || 'work')}</label>
    <label class="field"><span>Workday dress level: <b id="pf-wl-l">${DRESS_LEVELS[Math.round(kindLevel(p.workKind || 'work'))]}</b></span><input type="range" class="range" id="pf-wl" min="1" max="5" step="0.5" value="${kindLevel(p.workKind || 'work')}"></label>
  </div>
  <div class="card stack">
    <h3 class="section-title">Calendar</h3>
    ${IN_CLAUDE ? `<div class="li">${icon('calendar')}<div class="grow"><strong>Google Calendar</strong><div class="small muted">${Cal.gState === 'on' ? `Synced ${Cal.gUpdated ? relDays(iso(new Date(Cal.gUpdated))) : ''} · ${plural(Cal.google.length, 'event')} in the next 4 weeks` : 'Read your events to dress for meetings, showings and dinners.'}</div>${Cal.gStatus ? `<div class="small" style="color:var(--warn)">${esc(Cal.gStatus)}</div>` : ''}</div>${Cal.gState === 'on' ? `<button class="btn sm" data-act="gcal-sync">${icon('refresh')}Sync</button><button class="btn quiet sm" data-act="gcal-off">Disconnect</button>` : `<button class="btn primary sm" data-act="gcal-sync">Connect</button>`}</div>`
      : `<div class="note">${icon('info')}<span>Live Google Calendar sync works when you open Valet inside Claude. Here, import a calendar file. In Google Calendar, go to Settings → Import & export → Export, unzip, and choose the .ics file.</span></div>`}
    <div class="li">${icon('file')}<div class="grow"><strong>Calendar file (.ics)</strong><div class="small muted">${icsN ? `${plural(icsN, 'event')} imported${p.icsImported ? ' ' + relDays(p.icsImported) : ''}` : 'From Google, Apple or Outlook calendar.'}</div></div><label class="btn sm">${icon('upload')}Import<input type="file" accept=".ics,text/calendar" id="pf-ics" hidden></label></div>
  </div>
  <div class="card stack">
    <h3 class="section-title">Stores & imports</h3>
    <p class="small muted">Stitch Fix, Nordstrom, Gap and Old Navy don’t let other apps read your purchase history, so Valet brings purchases in from your order emails and order pages.</p>
    <div class="actions"><button class="btn" data-act="retailers">${icon('tag')}Store import guide</button>${IN_CLAUDE ? `<button class="btn" data-act="gmail">${icon('mail')}Find orders in Gmail</button>` : ''}<button class="btn" data-act="paste-order">${icon('file')}Paste an order</button><button class="btn" data-act="csv">${icon('upload')}Spreadsheet</button></div>
  </div>
  <div class="card stack">
    <h3 class="section-title">Your data</h3>
    <p class="small muted">${Store.mode === 'cloud' ? 'Your closet is saved with this Valet page in Claude and follows you to any device where you open it.' : 'Your closet is saved in this browser on this device. Back it up now and then, or open Valet inside Claude to sync across devices.'}</p>
    <div class="actions"><button class="btn" data-act="export-json">${icon('download')}Back up</button><label class="btn">${icon('upload')}Restore backup<input type="file" accept=".json,application/json" id="pf-restore" hidden></label><button class="btn" data-act="export-csv">${icon('download')}Export CSV</button></div>
    <div class="actions">${itemsArr((i) => i.sample).length ? `<button class="btn" data-act="remove-sample">Remove sample pieces</button>` : `<button class="btn quiet" data-act="load-sample">Load sample closet</button>`}<button class="btn quiet danger" data-act="wipe">Erase everything</button></div>
  </div>
  <div class="card stack">
    <h3 class="section-title">About Valet</h3>
    <p class="small muted">Weather: ${esc(Weather.srcLabel(Weather.src))}${Weather.updated ? ', updated ' + new Date(Weather.updated).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : ''}. ${AI.on ? 'Claude features are on: photo tagging, order reading and styling questions.' : IN_CLAUDE ? 'Claude features are off for this page.' : 'Open Valet inside Claude for photo auto-tagging, Gmail order import and styling questions.'}</p>
  </div>
  </div>`;
}
