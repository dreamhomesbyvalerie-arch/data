/* ───────────── outfit engine ─────────────
   Reads the day (weather, calendar, season, your profile), scores every piece for each slot,
   then assembles combinations and keeps the one that scores best as a whole. */

const CORE = new Set(['top', 'bottom', 'dress']);
const CLOTHES = new Set(['top', 'bottom', 'dress', 'layer', 'outer']);
const WARM_MATS = new Set(['Wool', 'Cashmere', 'Velvet', 'Tweed', 'Corduroy', 'Fleece']);

function kindLevel(kind) { return S.profile?.kindLevels?.[kind] ?? KINDS[kind]?.f ?? 3; }

function classifyEvent(ev) {
  if (ev.kind && KINDS[ev.kind]) return ev.kind;
  const text = `${ev.title || ''} ${ev.location || ''} ${(ev.desc || '').slice(0, 200)}`;
  for (const [k, re] of KIND_RULES) if (re.test(text)) return k;
  return null;
}

function baseKind(date) {
  const p = S.profile, d = dow(date);
  if ((p.workDays || []).includes(d)) return (p.wfhDays || []).includes(d) ? 'wfh' : (p.workKind || 'work');
  return 'casual';
}

/* Everything the engine needs to know about a day */
function dayContext(date, over = {}) {
  const p = S.profile;
  const evs = Cal.eventsOn(date).map((e) => Object.assign({}, e, { kind: classifyEvent(e) }));
  const base = baseKind(date);
  let kind = over.kindSet || base; const also = [];
  if (!over.kindSet) {
    let best = { kind: base, f: kindLevel(base), ev: false };
    for (const e of evs) {
      if (!e.kind) continue;
      if (e.kind === 'active') { if (!also.includes('active')) also.push('active'); continue; }
      const f = kindLevel(e.kind);
      if (f > best.f || (f === best.f && !best.ev) || (e.kind === 'travel' && best.kind === 'casual')) best = { kind: e.kind, f, ev: true };
    }
    kind = best.kind;
    if (evs.some((e) => e.kind === 'active') && !evs.some((e) => e.kind && e.kind !== 'active') && base !== 'work' && base !== 'client') kind = 'active';
  }
  if (!over.loc && typeof tripOn === 'function') { const tr = tripOn(date); if (tr) over = Object.assign({}, over, { loc: Object.assign({}, tr.dest, { days: tr.wx || {} }) }); }
  const wx = Object.assign({}, Weather.forDate(date, over.loc), over.wx || {});
  const evening = KINDS[kind]?.evening;
  let t = wx.hi == null ? 62 : (evening ? wx.hi * 0.35 + wx.lo * 0.65 : wx.hi * 0.62 + wx.lo * 0.38);
  if (p.runsCold) t -= 5; if (p.runsHot) t += 5; if ((wx.wind || 0) > 15) t -= 3; if ((wx.rain || 0) >= 50) t -= 2;
  const tier = t >= 80 ? 'hot' : t >= 70 ? 'warm' : t >= 60 ? 'mild' : t >= 50 ? 'cool' : t >= 40 ? 'cold' : 'frigid';
  const lat = over.loc?.lat ?? p.location?.lat ?? 38;
  return {
    date, kind, f: over.f ?? kindLevel(kind), events: evs, also, wx, t, tier,
    rain: (wx.rain || 0) >= 45, sunny: [0, 1].includes(wx.code) && (wx.rain || 0) < 30, season: seasonOf(date, lat),
    comfortShoes: !!KINDS[kind]?.comfortShoes || evs.filter((e) => e.kind === 'showing').length >= 2,
    used: over.used || new Map(), packed: over.packed || null, pool: over.pool || null, lock: over.lock || {}, exclude: over.exclude || new Set(),
    jitter: over.jitter ?? 1.1,
  };
}

const IDEAL_WARMTH = { hot: 1, warm: 1.6, mild: 2.4, cool: 3.2, cold: 4, frigid: 4.6 };

function itemScore(it, ctx, role) {
  const p = S.profile; const why = [];
  const fDiff = Math.abs((it.formality ?? 3) - ctx.f);
  const tol = role === 'acc' || role === 'bag' ? 2.6 : role === 'outer' ? 2.2 : role === 'shoes' ? 1.9 : role === 'layer' ? 1.6 : 1.3;
  if (fDiff > tol) return null;
  if ((['Cocktail dress', 'Gown'].includes(it.sub) || it.material === 'Sequin') && !(KINDS[ctx.kind]?.evening || ctx.f >= 4.5)) return null;
  let s = -fDiff * (role === 'acc' ? 0.6 : 1.5);
  const w = it.warmth ?? 3;
  if (role === 'top' || role === 'dress') s -= Math.abs(w - IDEAL_WARMTH[ctx.tier]) * 0.9;
  if (role === 'bottom') {
    if (['hot', 'warm'].includes(ctx.tier)) s -= Math.max(0, w - 2) * 0.6; else s -= Math.max(0, 2.5 - w) * 1.1;
    if (['cold', 'frigid'].includes(ctx.tier) && ['Shorts', 'Skirt (mini)', 'Active shorts'].includes(it.sub)) s -= 2.5;
  }
  if (it.seasons?.length && !it.seasons.includes(ctx.season)) s -= 1.4;
  const mat = it.material || '';
  if (['hot', 'warm'].includes(ctx.tier) && WARM_MATS.has(mat)) s -= 1.4;
  if (['cold', 'frigid'].includes(ctx.tier) && mat === 'Linen') s -= 1.2;
  if (ctx.rain && (mat === 'Suede' || mat === 'Silk' && role === 'outer')) s -= 2;
  // freshness
  const lw = lastWorn(it); const days = lw ? daysBetween(lw, ctx.date) : 400;
  const rep = p.repeatDays || 10;
  if (CORE.has(role)) { if (days >= 0 && days < rep) s -= ((rep - days) / rep) * 2.4; s += (Math.min(Math.max(days, 0), 60) / 60) * 0.8; }
  else if (role === 'layer') { if (days >= 0 && days < 4) s -= 0.6; s += (Math.min(Math.max(days, 0), 60) / 60) * 0.4; }
  if (wearsOf(it) < 3 && daysBetween(it.created || it.purchased || today(), today()) > 21) { s += 0.45; }
  if (it.fav) s += 0.5;
  const cols = it.colors || [];
  if (cols.some((c) => (p.favColors || []).includes(c))) s += 0.35;
  if ((p.avoidColors || []).includes(cols[0])) s -= 1.6;
  if ((it.occasions || []).includes(ctx.kind)) s += 0.8;
  s += Learn.itemBoost(it.id);
  // weekly variety / trip packing
  const n = ctx.used.get(it.id) || 0;
  if (ctx.packed) {
    if (ctx.packed.has(it.id)) s += role === 'top' ? -1.2 : role === 'dress' ? -1.6 : 2.2;
  } else if (n) s -= CORE.has(role) ? 2.6 * n : role === 'layer' ? 1.3 * n : role === 'outer' || role === 'bag' ? -0.2 : 0.25 * n;
  s += (Math.random() - 0.5) * ctx.jitter;
  return s;
}

function slotPool(ctx, role) {
  const cats = { top: ['top'], bottom: ['bottom'], dress: ['dress'], layer: ['layer'], outer: ['outerwear'], shoes: ['shoes'], bag: ['bag'], acc: ['accessory'] }[role];
  let pool = activeItems().filter((i) => cats.includes(i.cat) && !ctx.exclude.has(i.id));
  if (ctx.pool) pool = pool.filter((i) => ctx.pool.has(i.id));
  if (role === 'shoes') {
    pool = pool.filter((i) => i.sub !== 'Athletic shoes' || ctx.kind === 'active');
    if (!S.profile.heels && ctx.f < 4.5) pool = pool.filter((i) => i.sub !== 'Heels');
  }
  if (role === 'bottom' && ctx.kind !== 'active') pool = pool.filter((i) => i.sub !== 'Leggings' || ctx.f <= 2.5);
  return pool.map((it) => {
    let s = itemScore(it, ctx, role); if (s == null) return null;
    if (role === 'shoes') {
      if (ctx.rain && ['Sandals', 'Mules'].includes(it.sub)) s -= 2.5;
      if (ctx.rain && ['Rain boots', 'Ankle boots', 'Tall boots'].includes(it.sub) && it.material !== 'Suede') s += 1;
      if (['cold', 'frigid'].includes(ctx.tier)) { if (['Sandals'].includes(it.sub)) s -= 3; if (/boot/i.test(it.sub)) s += 0.9; }
      if (ctx.tier === 'cool' && it.sub === 'Sandals') s -= 1.8;
      if (['hot'].includes(ctx.tier) && /boot/i.test(it.sub)) s -= 1.5;
      if (ctx.comfortShoes) { if (it.sub === 'Heels') s -= 2.4; if (['Sneakers', 'Loafers / flats', 'Ankle boots'].includes(it.sub)) s += 0.9; }
    }
    if (role === 'outer') {
      const want = { hot: 0, warm: 1, mild: 2.5, cool: 3, cold: 4.5, frigid: 5 }[ctx.tier];
      s -= Math.abs((it.warmth ?? 3) - want) * 0.9;
      if (ctx.rain && ['Trench', 'Rain jacket'].includes(it.sub)) s += 1.8;
      if (ctx.rain && ['Wool coat', 'Leather jacket'].includes(it.sub)) s -= 0.4;
    }
    if (role === 'layer' && ctx.f >= 3.5 && it.sub === 'Blazer') s += 0.6;
    return { it, s };
  }).filter(Boolean).sort((a, b) => b.s - a.s);
}

/* colour + pattern harmony of a set of pieces */
function harmony(pieces) {
  const hues = []; let multi = 0; const keys = [];
  for (const it of pieces) {
    const slot = slotOf(it); if (slot === 'acc') continue;
    (it.colors || []).slice(0, 2).forEach((c, idx) => {
      const C = COLORS[c]; if (!C) return; keys.push(c);
      if (C.multi) multi++; else if (!C.n && !(C.soft && idx > 0)) hues.push(C.h);
    });
  }
  const uniq = []; for (const h of hues) if (!uniq.some((u) => hueDist(u, h) < 22)) uniq.push(h);
  let s = 0;
  if (uniq.length === 0) s += 0.6; else if (uniq.length === 1) s += 1;
  else if (uniq.length === 2) { const d = hueDist(uniq[0], uniq[1]); s += d <= 38 ? 0.7 : d >= 150 ? 0.35 : d >= 100 ? -0.2 : -0.9; }
  else s -= 0.9 * (uniq.length - 2) + 0.3;
  if (multi > 1) s -= 0.8;
  if (new Set(keys).size === 1 && keys.length >= 3) s += 0.4;
  const eclectic = (S.profile.styleWords || []).includes('Eclectic'), minimal = (S.profile.styleWords || []).includes('Minimal');
  const pats = pieces.filter((i) => CLOTHES.has(slotOf(i)) && i.pattern && !['Solid', 'Texture'].includes(i.pattern)).length;
  if (pats === 2) s -= eclectic ? 0.2 : 1.2; else if (pats > 2) s -= eclectic ? 1 : 2.6;
  if (minimal && pats >= 1) s -= 0.3;
  const metals = new Set(pieces.filter((i) => slotOf(i) === 'acc').flatMap((i) => (i.colors || []).filter((c) => COLORS[c]?.metal)));
  if (metals.size > 1) s -= 0.3;
  return s;
}
function hueDist(a, b) { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }

function formulaBonus(byRole) {
  const p = S.profile; let best = 0, label = null;
  for (const f of FORMULAS) {
    const wanted = (p.formulas || []).includes(f.k); if (!wanted) continue;
    const slots = Object.entries(f.need); let hit = 0;
    for (const [slot, subs] of slots) { const it = byRole[slot]; if (it && subs.includes(it.sub)) hit++; }
    if (hit === slots.length) { const b = 1.6 * (p.formulaWeights?.[f.k] || 1); if (b > best) { best = b; label = f.label; } }
  }
  return { bonus: best, label };
}

function softPick(list, temp = 0.9, topK = 8) {
  const L = list.slice(0, topK); if (!L.length) return null;
  const mx = L[0].s; const ws = L.map((x) => Math.exp((x.s - mx) / temp)); let r = Math.random() * sum(ws);
  for (let i = 0; i < L.length; i++) { r -= ws[i]; if (r <= 0) return L[i]; }
  return L[L.length - 1];
}

function needOuter(ctx) { return ['cool', 'cold', 'frigid'].includes(ctx.tier) || (ctx.rain && ctx.tier !== 'hot'); }
function wantLayer(ctx) { return ctx.tier === 'mild' || ctx.tier === 'cool' || (ctx.f >= 3.5 && ctx.tier !== 'hot') || (ctx.tier === 'cold' && Math.random() < 0.4); }

/* Build one outfit. Returns {items:[ids], byRole, score, reasons, formula} */
function buildOutfit(ctx, tries = 36) {
  if (ctx.kind === 'active') return buildActive(ctx);
  const pools = {}; ['top', 'bottom', 'dress', 'layer', 'outer', 'shoes', 'bag', 'acc'].forEach((r) => (pools[r] = slotPool(ctx, r)));
  const lock = ctx.lock || {};
  const lockedItem = (r) => (lock[r] ? S.items.get(lock[r]) : null);
  const results = [];
  const preferDress = (S.profile.formulas || []).some((k) => FORMULAS.find((f) => f.k === k)?.need.dress);
  for (let t = 0; t < tries; t++) {
    const by = {}; const chosen = [];
    const add = (r, it) => { if (it) { by[r] = it; chosen.push(it); } };
    const pickFor = (r, extra = 0) => {
      if (lockedItem(r)) return lockedItem(r);
      const scored = pools[r].filter((x) => !chosen.includes(x.it)).slice(0, 14).map((x) => ({ it: x.it, s: x.s + harmony([...chosen, x.it]) * 1.1 + extra }));
      scored.sort((a, b) => b.s - a.s); return softPick(scored)?.it || null;
    };
    let dressMode;
    if (lock.dress) dressMode = true; else if (lock.top || lock.bottom) dressMode = false;
    else {
      const hasSep = pools.top.length && pools.bottom.length; const hasDress = pools.dress.length;
      const pD = !hasDress ? 0 : !hasSep ? 1 : clamp((ctx.f >= 4.5 ? 0.6 : ctx.kind === 'date' ? 0.45 : 0.22) + (preferDress ? 0.12 : 0) + (ctx.tier === 'hot' ? 0.1 : 0), 0, 0.9);
      dressMode = Math.random() < pD;
    }
    if (dressMode) add('dress', pickFor('dress')); else { add('top', pickFor('top')); add('bottom', pickFor('bottom')); }
    if (!chosen.length) continue;
    if (lock.layer || (pools.layer.length && wantLayer(ctx))) add('layer', pickFor('layer'));
    if (lock.outer || (pools.outer.length && needOuter(ctx))) add('outer', pickFor('outer'));
    add('shoes', pickFor('shoes'));
    if (ctx.kind !== 'lounge') add('bag', pickFor('bag'));
    // accessories: earrings/necklace first, weather-driven extras after
    const maxAcc = (S.profile.styleWords || []).includes('Minimal') ? 1 : (S.profile.accessories ?? 2);
    const accs = []; const subsUsed = new Set();
    if (lock.acc) { const a = S.items.get(lock.acc); if (a) { accs.push(a); subsUsed.add(a.sub); } }
    const accPool = pools.acc.map((x) => {
      let s = x.s;
      if (x.it.sub === 'Scarf') s += ['cold', 'frigid'].includes(ctx.tier) ? 1.5 : ctx.tier === 'cool' ? 0.2 : -3;
      if (x.it.sub === 'Sunglasses') s += ctx.sunny && ctx.tier !== 'frigid' ? 0.8 : -3;
      if (x.it.sub === 'Hat') s += ctx.tier === 'frigid' || (ctx.sunny && ['hot', 'warm'].includes(ctx.tier) && ctx.kind === 'outdoor') ? 1 : -2.5;
      if (['Earrings', 'Necklace', 'Watch'].includes(x.it.sub)) s += 0.5;
      return { it: x.it, s };
    }).sort((a, b) => b.s - a.s);
    for (const x of accPool) { if (accs.length >= maxAcc + (['cold', 'frigid'].includes(ctx.tier) ? 1 : 0)) break; if (subsUsed.has(x.it.sub) || x.s < -2) continue; accs.push(x.it); subsUsed.add(x.it.sub); }
    accs.forEach((a, k) => { chosen.push(a); by['acc' + k] = a; });

    let score = 0; for (const [r, it] of Object.entries(by)) { const role = r.startsWith('acc') ? 'acc' : r; score += pools[role]?.find((x) => x.it === it)?.s ?? 0; }
    score += harmony(chosen) * 2;
    const fb = formulaBonus(by); score += fb.bonus;
    score += Learn.pairBoost(chosen.map((i) => i.id));
    results.push({ by, chosen, score, formula: fb.label });
  }
  if (!results.length) return null;
  results.sort((a, b) => b.score - a.score);
  const best = results[0];
  return { items: best.chosen.map((i) => i.id), byRole: best.by, score: best.score, formula: best.formula, reasons: explain(best, ctx) };
}

function buildActive(ctx) {
  const act = activeItems().filter((i) => i.cat === 'active' && !ctx.exclude.has(i.id) && (!ctx.pool || ctx.pool.has(i.id)));
  const pickSub = (subs) => act.filter((i) => subs.includes(i.sub)).sort(by((i) => (lastWorn(i) || ''), 1))[0];
  const chosen = [];
  const top = pickSub(['Active top', 'Sports bra']) || activeItems().find((i) => i.cat === 'top' && ['Tee', 'Tank / cami'].includes(i.sub));
  const bot = pickSub(['Active leggings', 'Active shorts']) || activeItems().find((i) => i.sub === 'Leggings');
  const jk = ['cool', 'cold', 'frigid'].includes(ctx.tier) ? pickSub(['Active jacket']) : null;
  const shoes = activeItems().find((i) => i.sub === 'Athletic shoes') || activeItems().find((i) => i.sub === 'Sneakers');
  [top, bot, jk, shoes].forEach((x) => x && chosen.push(x));
  if (!chosen.length) return null;
  return { items: chosen.map((i) => i.id), byRole: {}, score: 0, reasons: ['Workout on the calendar, so this is your gym kit.'] };
}

function explain(res, ctx) {
  const out = []; const by = res.by; const wx = ctx.wx;
  if (by.outer) {
    if (ctx.rain) out.push(`${by.outer.name}: ${wx.rain}% chance of rain.`);
    else if (wx.lo != null) out.push(`${by.outer.name}: it drops to ${tempOut(wx.lo)}.`);
  }
  if (by.shoes) {
    const sh = ctx.events.filter((e) => e.kind === 'showing').length;
    if (ctx.comfortShoes && sh) out.push(`${by.shoes.name}: you’re on your feet for ${plural(sh, 'showing')}.`);
    else if (ctx.rain && !/sandal/i.test(by.shoes.sub)) out.push(`${by.shoes.name}: closed toes for the wet weather.`);
  }
  const keyEv = ctx.events.find((e) => e.kind === ctx.kind);
  if (keyEv && ctx.kind !== 'casual') out.push(`Dressed for “${keyEv.title}” (${DRESS_LEVELS[Math.round(ctx.f)].toLowerCase()}).`);
  if (res.formula) out.push(`One of your go-to formulas: ${res.formula.toLowerCase()}.`);
  const sleeper = res.chosen.filter((i) => CORE.has(slotOf(i)) || slotOf(i) === 'layer').map((i) => ({ i, d: lastWorn(i) ? daysBetween(lastWorn(i), ctx.date) : null })).sort((a, b) => (b.d ?? 999) - (a.d ?? 999))[0];
  if (sleeper && (sleeper.d == null || sleeper.d > 30)) out.push(sleeper.d == null ? `${sleeper.i.name} hasn’t been worn yet. Today’s the day.` : `${sleeper.i.name} hasn’t been out in ${sleeper.d} days.`);
  if (ctx.also.includes('active')) { const a = ctx.events.find((e) => e.kind === 'active'); out.push(`Pack your workout clothes for ${a?.title || 'your workout'}${a?.time ? ' at ' + a.time : ''}.`); }
  if (ctx.sunny && res.chosen.some((i) => i.sub === 'Sunglasses')) out.push('Sunny, so sunglasses are in.');
  return out.slice(0, 4);
}

function outfitTitle(ctx) {
  const w = ctx.rain ? 'rainy' : { hot: 'hot', warm: 'warm', mild: 'mild', cool: 'cool', cold: 'cold', frigid: 'freezing' }[ctx.tier];
  return `${KINDS[ctx.kind]?.label || 'Everyday'} · ${w}`;
}

/* ---------- learning from what you wear and love ---------- */
const Learn = {
  cache: null, stamp: 0,
  build() {
    const love = new Map(), meh = new Map(), pairs = new Map();
    const addPair = (ids, w) => { const core = ids.filter((id) => { const it = S.items.get(id); return it && CLOTHES.has(slotOf(it)); }); for (let a = 0; a < core.length; a++) for (let b = a + 1; b < core.length; b++) { const k = [core[a], core[b]].sort().join('|'); pairs.set(k, (pairs.get(k) || 0) + w); } };
    for (const e of logEntries()) { if (e.rating === 'love') { e.items.forEach((id) => love.set(id, (love.get(id) || 0) + 1)); addPair(e.items, 1); } if (e.rating === 'meh') e.items.forEach((id) => meh.set(id, (meh.get(id) || 0) + 1)); }
    for (const o of S.outfits.values()) addPair(o.items || [], o.fav ? 1.5 : 0.8);
    this.cache = { love, meh, pairs }; this.stamp = Date.now();
  },
  get() { if (!this.cache || Date.now() - this.stamp > 4000) this.build(); return this.cache; },
  itemBoost(id) { const c = this.get(); return Math.min(0.6, (c.love.get(id) || 0) * 0.15) - Math.min(0.9, (c.meh.get(id) || 0) * 0.3); },
  pairBoost(ids) { const c = this.get(); let s = 0; for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) s += Math.min(1, (c.pairs.get([ids[a], ids[b]].sort().join('|')) || 0) * 0.5); return Math.min(1.5, s); },
};

/* ---------- week plans ---------- */
function weekKeyOf(date) { return weekStartOf(date, S.profile.weekStartDow ?? 1); }
function planDay(date, opts = {}) {
  const wk = weekKeyOf(date); const plan = S.plans.get(wk) || { id: wk, days: {} };
  const prev = plan.days[date] || {};
  const used = opts.used || usedAround(plan, date);
  const ctx = dayContext(date, Object.assign({ kindSet: prev.kindSet, wx: prev.wx, used }, opts));
  const res = buildOutfit(ctx);
  plan.days[date] = Object.assign({}, prev, {
    items: res ? res.items : [], kind: ctx.kind, title: outfitTitle(ctx), reasons: res?.reasons || [], formula: res?.formula || null,
    wxSnap: { hi: ctx.wx.hi, lo: ctx.wx.lo, rain: ctx.wx.rain, code: ctx.wx.code, src: ctx.wx.src },
    events: ctx.events.slice(0, 6).map((e) => ({ title: e.title, time: e.time || '', kind: e.kind })), also: ctx.also, worn: false, locked: prev.locked && opts.keepLock ? prev.locked : false,
  });
  if (opts.save !== false) Store.put('plans', plan);
  return plan.days[date];
}
function usedAround(plan, date) {
  const used = new Map();
  for (const [d, day] of Object.entries(plan.days || {})) { if (d === date) continue; (day.items || []).forEach((id) => used.set(id, (used.get(id) || 0) + 1)); }
  return used;
}
function planWeek(wk, { force = false, pool = null } = {}) {
  const plan = S.plans.get(wk) || { id: wk, days: {} }; const used = new Map(); const t = today();
  const dates = [...Array(7)].map((_, i) => addDays(wk, i));
  const keep = (d) => { const day = plan.days[d]; return day && (day.locked || day.worn || d < t || (!force && day.items?.length && day.manual)); };
  dates.filter(keep).forEach((d) => (plan.days[d].items || []).forEach((id) => used.set(id, (used.get(id) || 0) + 1)));
  for (const d of dates) {
    if (keep(d)) continue;
    const prev = plan.days[d] || {};
    const tr = tripOn(d);
    if (tr?.days?.[d]?.items?.length) {
      plan.days[d] = Object.assign({}, prev, { items: tr.days[d].items.slice(), kind: tr.days[d].kind, title: `${tr.name} · ${KINDS[tr.days[d].kind]?.label || 'Trip'}`, reasons: [`From your ${tr.name} packing list.`], worn: false, locked: false, trip: tr.id });
      tr.days[d].items.forEach((id) => used.set(id, (used.get(id) || 0) + 1)); continue;
    }
    const ctx = dayContext(d, { kindSet: prev.kindSet, wx: prev.wx, used, pool });
    const res = buildOutfit(ctx);
    plan.days[d] = Object.assign({}, prev, { items: res ? res.items : [], kind: ctx.kind, title: outfitTitle(ctx), reasons: res?.reasons || [], formula: res?.formula || null,
      wxSnap: { hi: ctx.wx.hi, lo: ctx.wx.lo, rain: ctx.wx.rain, code: ctx.wx.code, src: ctx.wx.src },
      events: ctx.events.slice(0, 6).map((e) => ({ title: e.title, time: e.time || '', kind: e.kind })), also: ctx.also, worn: false, locked: false });
    (res?.items || []).forEach((id) => used.set(id, (used.get(id) || 0) + 1));
  }
  plan.generated = Date.now(); plan.sample = itemsArr().some((i) => i.sample);
  Store.put('plans', plan);
  return plan;
}
const planItems = (day) => (day?.items || []).map((id) => S.items.get(id)).filter(Boolean);

/* ---------- capsules ---------- */
const CAPSULE_PRESETS = {
  work:    { label: 'Workweek capsule', blurb: 'Five office days from a dozen pieces.', kind: 'work', size: { top: 5, bottom: 3, dress: 1, layer: 2, outer: 1, shoes: 2, bag: 1, acc: 2 } },
  weekend: { label: 'Weekend capsule', blurb: 'Errands, brunch, and everything between.', kind: 'casual', size: { top: 4, bottom: 3, dress: 1, layer: 1, outer: 1, shoes: 2, bag: 1, acc: 1 } },
  travel:  { label: 'Carry-on, 5 days', blurb: 'Fits in a carry-on, mixes every way.', kind: 'casual', size: { top: 4, bottom: 2, dress: 1, layer: 1, outer: 1, shoes: 2, bag: 1, acc: 2 } },
  evening: { label: 'After-dark capsule', blurb: 'Dinners, parties and date nights.', kind: 'date', size: { top: 3, bottom: 2, dress: 3, layer: 1, outer: 1, shoes: 2, bag: 1, acc: 3 } },
  season:  { label: 'Season capsule', blurb: 'Your best 20 for this time of year.', kind: null, size: { top: 7, bottom: 4, dress: 2, layer: 2, outer: 2, shoes: 3, bag: 2, acc: 3 } },
};
function compatible(a, b) { return Math.abs((a.formality ?? 3) - (b.formality ?? 3)) <= 1.6 && harmony([a, b]) > -0.5; }
function buildCapsule(key) {
  const P = CAPSULE_PRESETS[key]; const season = seasonOf(today(), S.profile.location?.lat);
  const f = P.kind ? kindLevel(P.kind) : null;
  const ok = (i) => (f == null || Math.abs((i.formality ?? 3) - f) <= 1.3) && (!i.seasons?.length || i.seasons.includes(season));
  const pool = activeItems().filter(ok); const pick = [];
  const base = (i) => (i.fav ? 0.6 : 0) + Math.min(wearsOf(i), 30) / 30 + (COLORS[(i.colors || [])[0]]?.n ? 0.4 : 0);
  const take = (role, n, extra) => {
    const cats = { top: 'top', bottom: 'bottom', dress: 'dress', layer: 'layer', outer: 'outerwear', shoes: 'shoes', bag: 'bag', acc: 'accessory' }[role];
    const cand = pool.filter((i) => i.cat === cats && !pick.includes(i));
    for (let k = 0; k < n && cand.length; k++) {
      cand.sort((a, b) => (extra(b) + base(b) - repeatPenalty(b)) - (extra(a) + base(a) - repeatPenalty(a)));
      pick.push(cand.shift());
    }
  };
  const repeatPenalty = (i) => pick.filter((p) => p.cat === i.cat && (p.colors || [])[0] === (i.colors || [])[0]).length * 0.9 + pick.filter((p) => p.cat === i.cat && p.sub === i.sub).length * 0.25;
  const pairs = (i, cat) => pick.filter((p) => p.cat === cat && compatible(i, p)).length;
  take('bottom', P.size.bottom, (i) => (COLORS[(i.colors || [])[0]]?.n ? 1.4 : 0));
  take('top', P.size.top, (i) => pairs(i, 'bottom') * 0.9);
  take('dress', P.size.dress, () => 0);
  take('layer', P.size.layer, (i) => pairs(i, 'top') * 0.4 + pairs(i, 'dress') * 0.4 + (COLORS[(i.colors || [])[0]]?.n ? 0.8 : 0));
  take('outer', P.size.outer, (i) => (COLORS[(i.colors || [])[0]]?.n ? 0.8 : 0) + (season === 'winter' ? (i.warmth ?? 3) * 0.2 : 0));
  take('shoes', P.size.shoes, (i) => (COLORS[(i.colors || [])[0]]?.n ? 0.8 : 0) + pick.filter((p) => CORE.has(slotOf(p)) && compatible(i, p)).length * 0.15);
  take('bag', P.size.bag, (i) => (COLORS[(i.colors || [])[0]]?.n ? 1 : 0));
  take('acc', P.size.acc, () => 0);
  return { key, label: key === 'season' ? `${cap(season)} capsule` : P.label, blurb: P.blurb, kind: P.kind, items: pick.map((i) => i.id), combos: countCombos(pick) };
}
function countCombos(items) {
  const tops = items.filter((i) => i.cat === 'top'), bottoms = items.filter((i) => i.cat === 'bottom'), dresses = items.filter((i) => i.cat === 'dress');
  const layers = items.filter((i) => i.cat === 'layer'); const shoes = items.filter((i) => i.cat === 'shoes');
  let bases = 0; for (const t of tops) for (const b of bottoms) if (compatible(t, b)) bases++;
  bases += dresses.length;
  return bases * (1 + layers.length) * Math.max(1, Math.min(shoes.length, 2));
}
function capsuleLooks(itemIds, kind, n = 6) {
  const pool = new Set(itemIds); const looks = []; const seen = new Set(); const used = new Map();
  for (let t = 0; t < n * 4 && looks.length < n; t++) {
    const ctx = dayContext(today(), { kindSet: kind || undefined, pool, used, jitter: 2.2 });
    const r = buildOutfit(ctx, 14); if (!r) break;
    const sig = r.items.filter((id) => CORE.has(slotOf(S.items.get(id)))).sort().join('|');
    if (seen.has(sig)) continue; seen.add(sig); looks.push(r); r.items.forEach((id) => used.set(id, (used.get(id) || 0) + 0.5));
  }
  return looks;
}

/* ---------- closet gaps: staples you don't own, and what each would unlock ---------- */
const STAPLES = [
  ['White tee', 'top', 'Tee', 'white'], ['Striped tee', 'top', 'Tee', 'navy', 'Stripe'], ['Ivory blouse', 'top', 'Blouse', 'ivory'], ['Grey crewneck', 'top', 'Sweater', 'grey'],
  ['Black turtleneck', 'top', 'Turtleneck', 'black'], ['Dark straight jeans', 'bottom', 'Jeans', 'denim'], ['Black trousers', 'bottom', 'Trousers', 'black'],
  ['Midi skirt', 'bottom', 'Skirt (midi)', 'black'], ['Little black dress', 'dress', 'Day dress', 'black'], ['Navy blazer', 'layer', 'Blazer', 'navy'],
  ['Neutral cardigan', 'layer', 'Cardigan', 'beige'], ['Trench coat', 'outerwear', 'Trench', 'khaki'], ['Camel wool coat', 'outerwear', 'Wool coat', 'camel'],
  ['Denim jacket', 'outerwear', 'Denim jacket', 'denim'], ['White sneakers', 'shoes', 'Sneakers', 'white'], ['Black ankle boots', 'shoes', 'Ankle boots', 'black'],
  ['Black loafers', 'shoes', 'Loafers / flats', 'black'], ['Neutral sandals', 'shoes', 'Sandals', 'camel'], ['Black tote', 'bag', 'Work bag', 'black'], ['Gold hoops', 'accessory', 'Earrings', 'gold'],
];
function closetGaps() {
  const act = activeItems(); if (act.length < 6) return { staples: [], notes: [] };
  const owns = (cat, sub, col) => act.some((i) => i.cat === cat && i.sub === sub && (COLORS[(i.colors || [])[0]]?.n === COLORS[col]?.n) && ((i.colors || [])[0] === col || Math.abs(luminance(primaryColor(i).hex) - luminance(COLORS[col].hex)) < 0.12));
  const staples = [];
  for (const [name, cat, sub, col, pattern] of STAPLES) {
    if (owns(cat, sub, col)) continue;
    const [w, f] = subDefaults(sub); const v = { id: 'v', name, cat, sub, colors: [col], pattern: pattern || 'Solid', warmth: w, formality: f };
    const partners = cat === 'top' ? act.filter((i) => i.cat === 'bottom') : cat === 'bottom' ? act.filter((i) => i.cat === 'top') : act.filter((i) => ['top', 'bottom', 'dress'].includes(i.cat));
    const n = partners.filter((i) => compatible(v, i)).length;
    if (n >= 3) staples.push({ name, cat, sub, col, n });
  }
  staples.sort((a, b) => b.n - a.n);
  const notes = []; const has = (fn) => act.some(fn);
  if (!has((i) => i.cat === 'outerwear' && (i.warmth ?? 3) >= 4)) notes.push('No warm coat in rotation for the coldest days.');
  if (!has((i) => ['Rain jacket', 'Trench'].includes(i.sub))) notes.push('Nothing rain-ready to wear over your clothes.');
  if (!has((i) => i.cat === 'shoes' && /boot|Sneakers|Loafers/.test(i.sub) && i.material !== 'Suede')) notes.push('No closed shoes that can handle wet sidewalks.');
  if (!has((i) => (i.formality ?? 3) >= 4.5 && ['dress', 'bottom', 'top'].includes(i.cat))) notes.push('Nothing formal enough for a black-tie invitation.');
  const nb = act.filter((i) => i.cat === 'bottom' && COLORS[(i.colors || [])[0]]?.n).length, nt = act.filter((i) => i.cat === 'top').length;
  if (nt >= 8 && nb <= 2) notes.push(`${nt} tops but only ${nb} neutral bottoms, so many tops share the same two partners.`);
  if (Cal.hasKind('active') && !has((i) => i.cat === 'active')) notes.push('Workouts on your calendar but no activewear in your closet.');
  return { staples: staples.slice(0, 6), notes };
}

/* What a wishlist piece would add to the closet you already own */
function purchaseImpact(w) {
  const [wm, f] = subDefaults(w.sub); const v = { id: 'v', name: w.name, cat: w.cat, sub: w.sub, colors: w.colors?.length ? w.colors : ['black'], pattern: w.pattern || 'Solid', warmth: wm, formality: f };
  const act = activeItems();
  const partners = v.cat === 'top' ? act.filter((i) => i.cat === 'bottom') : v.cat === 'bottom' ? act.filter((i) => i.cat === 'top') : act.filter((i) => ['top', 'bottom', 'dress'].includes(i.cat));
  const n = partners.filter((i) => compatible(v, i)).length;
  const similar = act.filter((i) => i.cat === v.cat && i.sub === v.sub && (i.colors || [])[0] === v.colors[0]);
  return { n, similar };
}
