/* ───────────── the style interview ───────────── */
const FORMULA_ART = {
  Jeans: 'denim', Trousers: 'black', 'Wide-leg pants': 'camel', Leggings: 'black', 'Skirt (midi)': 'black', Tee: 'white', 'Tank / cami': 'black', Blouse: 'ivory', 'Button-down': 'skyblue',
  Sweater: 'camel', Turtleneck: 'charcoal', Blazer: 'navy', Cardigan: 'beige', 'Denim jacket': 'denim', 'Leather jacket': 'black', 'Ankle boots': 'camel', Sneakers: 'white',
  'Loafers / flats': 'black', Heels: 'black', Sandals: 'camel', 'Day dress': 'navy', 'Midi dress': 'burgundy', Jumpsuit: 'olive',
};
function formulaArt(f) {
  const order = ['outer', 'layer', 'dress', 'top', 'bottom', 'shoes'];
  const v = order.filter((s) => f.need[s]).map((s) => { const sub = f.need[s][0]; return virtualItem(sub, FORMULA_ART[sub] || 'grey'); });
  return `<div class="mini">${v.map((x) => pieceHTML(x, { cls: 'sm' })).join('')}</div>`;
}

const Interview = {
  d: null, step: 0, el: null,
  steps: ['hello', 'week', 'city', 'style', 'formulas', 'occasions', 'colors', 'comfort', 'favorites', 'sunday'],
  open() {
    this.d = clone(S.profile); this.d.kindLevels = this.d.kindLevels || {}; this.step = 0;
    this.el = document.createElement('div'); this.el.className = 'iv'; this.el.setAttribute('role', 'dialog'); this.el.setAttribute('aria-label', 'Style interview');
    document.body.appendChild(this.el); document.body.style.overflow = 'hidden'; this.draw();
  },
  close() { this.el?.remove(); this.el = null; document.body.style.overflow = ''; },
  draw() {
    const d = this.d; const s = this.steps[this.step]; const n = this.steps.length;
    const days = [1, 2, 3, 4, 5, 6, 0]; let body = '';
    if (s === 'hello') body = `<div class="eyebrow">Style interview · 3 minutes</div><h1>First, what should Valet call you?</h1>
      <p class="iv-lede">Then a few questions about your week, your favorite looks and what you reach for. You can change any answer later in Profile.</p>
      <label class="field"><span>First name</span><input class="input" id="iv-name" value="${esc(d.name)}" placeholder="Your name" autocomplete="given-name"></label>`;
    if (s === 'week') body = `<div class="eyebrow">Your week</div><h1>What does a normal week look like?</h1>
      <div class="field"><span>Days you work</span><div class="chips" id="iv-work">${days.map((x) => `<button class="chip" aria-pressed="${(d.workDays || []).includes(x)}" data-v="${x}">${DOW[x]}</button>`).join('')}</div></div>
      <div class="field"><span>Of those, days you’re home</span><div class="chips" id="iv-wfh">${days.map((x) => `<button class="chip" aria-pressed="${(d.wfhDays || []).includes(x)}" data-v="${x}">${DOW[x]}</button>`).join('')}</div></div>
      <div class="field"><span>Most workdays you’re…</span><div class="opt-grid" id="iv-wk">${[['work', 'briefcase', 'At a desk or in the office'], ['client', 'handshake', 'Meeting clients'], ['showing', 'key', 'On your feet: showings, tours, site visits']].map(([k, ic, l]) => `<button class="opt" aria-pressed="${(d.workKind || 'work') === k}" data-v="${k}">${icon(ic)}<span>${l}</span></button>`).join('')}</div></div>
      <label class="field"><span>How dressed up for work? <b id="iv-wl-l">${DRESS_LEVELS[Math.round(d.kindLevels[d.workKind || 'work'] ?? KINDS[d.workKind || 'work'].f)]}</b></span><input type="range" class="range" min="1" max="5" step="0.5" id="iv-wl" value="${d.kindLevels[d.workKind || 'work'] ?? KINDS[d.workKind || 'work'].f}"><div class="levels"><span>Lounge</span><span>Casual</span><span>Smart</span><span>Polished</span><span>Formal</span></div></label>`;
    if (s === 'city') body = `<div class="eyebrow">Weather</div><h1>Where do you get dressed most days?</h1><p class="iv-lede">Valet reads the forecast for your city and dresses you for the “feels like” temperature.</p>
      <div class="row"><input class="input grow" id="iv-city" placeholder="City" value="${esc(d.location?.name || '')}"><button class="btn" id="iv-find">Find</button></div><div id="iv-res" class="list">${d.location ? `<div class="li small">${icon('check')} ${esc(d.location.name)}</div>` : ''}</div>
      <div class="field"><span>Temperatures in</span><div class="seg" id="iv-units"><button aria-pressed="${d.units !== 'C'}" data-v="F">°F</button><button aria-pressed="${d.units === 'C'}" data-v="C">°C</button></div></div>`;
    if (s === 'style') body = `<div class="eyebrow">Your style</div><h1>Pick up to three words for how you like to look.</h1>
      <div class="chips" id="iv-words">${STYLE_WORDS.map((w) => `<button class="chip" aria-pressed="${(d.styleWords || []).includes(w)}" data-v="${w}">${w}</button>`).join('')}</div>
      <p class="small muted">Minimal keeps patterns and accessories quiet. Eclectic lets Valet mix prints and colors more freely.</p>`;
    if (s === 'formulas') body = `<div class="eyebrow">Go-to outfits</div><h1>Which of these do you wear on repeat?</h1><p class="iv-lede">Pick every formula that feels like you. Valet builds around them first.</p>
      <div class="opt-grid" id="iv-form">${FORMULAS.map((f) => `<button class="opt" aria-pressed="${(d.formulas || []).includes(f.k)}" data-v="${f.k}">${formulaArt(f)}<span>${esc(f.label)}</span></button>`).join('')}</div>`;
    if (s === 'occasions') {
      const ks = ['casual', 'wfh', 'date', 'cocktail', 'formal', 'travel', 'client'];
      body = `<div class="eyebrow">What you wear, and when</div><h1>How dressed up do you like to be for…</h1>
      <div>${ks.map((k) => { const v = d.kindLevels[k] ?? KINDS[k].f; return `<div class="kind-row"><span class="row">${kindIcon(k)}<strong>${KINDS[k].label}</strong></span><div><input type="range" class="range" min="1" max="5" step="0.5" data-k="${k}" value="${v}"><div class="levels"><span>Lounge</span><span>Casual</span><span>Smart</span><span>Polished</span><span>Formal</span></div></div></div>`; }).join('')}</div>`;
    }
    if (s === 'colors') body = `<div class="eyebrow">Color</div><h1>Colors you love, and ones you never wear.</h1>
      <div class="field"><span>Love</span>${swatchesHTML('fav', d.favColors || [], { max: 6 })}</div>
      <div class="field"><span>Never</span>${swatchesHTML('avoid', d.avoidColors || [], { max: 6 })}</div>`;
    if (s === 'comfort') body = `<div class="eyebrow">Comfort</div><h1>A few comfort questions.</h1>
      <div class="field"><span>Temperature</span><div class="seg" id="iv-temp"><button aria-pressed="${!!d.runsCold}" data-v="cold">I run cold</button><button aria-pressed="${!d.runsCold && !d.runsHot}" data-v="ok">Just right</button><button aria-pressed="${!!d.runsHot}" data-v="hot">I run warm</button></div></div>
      <div class="toggle"><div><strong>Heels are on the table</strong><div class="small muted">Turn off and Valet saves heels for formal events only.</div></div><input type="checkbox" class="switch" id="iv-heels" ${d.heels !== false ? 'checked' : ''}></div>
      <div class="field"><span>Before you repeat a top, bottom or dress, wait at least</span><div class="seg" id="iv-rep">${[[5, '5 days'], [10, '10 days'], [21, '3 weeks'], [2, 'I don’t mind']].map(([v, l]) => `<button aria-pressed="${(d.repeatDays || 10) === v}" data-v="${v}">${l}</button>`).join('')}</div></div>
      <div class="field"><span>Accessories in a typical outfit</span><div class="seg" id="iv-acc">${[0, 1, 2, 3].map((v) => `<button aria-pressed="${(d.accessories ?? 2) === v}" data-v="${v}">${v === 3 ? '3+' : v}</button>`).join('')}</div></div>`;
    if (s === 'favorites') body = `<div class="eyebrow">Favorite looks</div><h1>Tell Valet about the outfits you love most.</h1>
      <label class="field"><span>Describe a favorite look or two, and when you wear them</span><textarea class="input" id="iv-fav" placeholder="e.g. Black wide-leg trousers, ivory silk blouse and gold hoops for listing presentations. Dark jeans, a striped tee and a navy blazer for Saturday open houses.">${esc(d.favoriteLooks)}</textarea></label>
      <label class="field"><span>Anything else? Fit notes, things you avoid, how you shop</span><textarea class="input" id="iv-notes" style="min-height:90px" placeholder="e.g. No crop tops. I live in flats on showing days.">${esc(d.notes)}</textarea></label>
      ${AI.on ? '<p class="small muted">Claude reads these when you ask it for a look.</p>' : ''}`;
    if (s === 'sunday') body = `<div class="eyebrow">Weekly planning</div><h1>When should Valet plan your week?</h1><p class="iv-lede">Open Valet on your planning day and the next seven days are laid out, matched to the forecast and your calendar. Swap anything you like.</p>
      <div class="toggle"><strong>Plan my week automatically</strong><input type="checkbox" class="switch" id="iv-auto" ${d.autoPlan !== false ? 'checked' : ''}></div>
      <div class="grid2"><label class="field"><span>Planning day</span>${selectHTML('iv-pday', [0, 1, 2, 3, 4, 5, 6].map((x) => [x, DOW_LONG[x]]), d.planDow ?? 0)}</label><label class="field"><span>My week starts</span>${selectHTML('iv-wstart', [[1, 'Monday'], [0, 'Sunday']], d.weekStartDow ?? 1)}</label></div>`;
    this.el.innerHTML = `<div class="iv-in"><div class="row"><div class="iv-progress grow"><b style="width:${((this.step + 1) / n) * 100}%"></b></div><button class="iconbtn" id="iv-x" aria-label="Close interview">${icon('close')}</button></div>
      <div class="stack" style="gap:20px">${body}</div>
      <div class="iv-foot">${this.step ? `<button class="btn" id="iv-back">${icon('left')}Back</button>` : '<span></span>'}<div class="row">${this.step < n - 1 ? `<button class="btn quiet" id="iv-skip">Skip</button>` : ''}<button class="btn primary" id="iv-next">${this.step < n - 1 ? 'Next' : 'Finish'}${this.step < n - 1 ? icon('right') : icon('check')}</button></div></div></div>`;
    this.bind(s); this.el.scrollTop = 0;
    setTimeout(() => $('.iv input.input, .iv textarea', this.el)?.focus({ preventScroll: true }), 50);
  },
  bind(s) {
    const d = this.d; const el = this.el;
    $('#iv-x', el).onclick = () => { this.read(s); Store.saveProfile(this.d); this.close(); scheduleRender(); };
    $('#iv-back', el)?.addEventListener('click', () => { this.read(s); this.step--; this.draw(); });
    $('#iv-skip', el)?.addEventListener('click', () => { this.step++; this.draw(); });
    $('#iv-next', el).onclick = () => { this.read(s); if (this.step < this.steps.length - 1) { this.step++; this.draw(); } else this.finish(); };
    chipToggleGroup(el, '#iv-work, #iv-wfh'); chipToggleGroup(el, '#iv-wk, #iv-units, #iv-temp, #iv-rep, #iv-acc', false);
    chipToggleGroup(el, '#iv-words', true, (g) => { const on = $$('[aria-pressed="true"]', g); if (on.length > 3) on[0].setAttribute('aria-pressed', 'false'); });
    chipToggleGroup(el, '#iv-form');
    bindSwatches(el);
    $('#iv-wl', el)?.addEventListener('input', (e) => ($('#iv-wl-l', el).textContent = DRESS_LEVELS[Math.round(+e.target.value)]));
    $('#iv-wk', el)?.addEventListener('click', () => { const k = pressedVals($('#iv-wk', el))[0] || 'work'; const v = d.kindLevels[k] ?? KINDS[k].f; $('#iv-wl', el).value = v; $('#iv-wl-l', el).textContent = DRESS_LEVELS[Math.round(v)]; });
    const find = async () => {
      const q = $('#iv-city', el).value.trim(); if (!q) return; $('#iv-res', el).innerHTML = '<div class="li"><span class="spinner"></span>Searching…</div>';
      const res = await Weather.geocode(q);
      $('#iv-res', el).innerHTML = res.map((r, k) => `<button class="li-btn" data-k="${k}">${icon('pin')}<span class="grow">${esc(r.name)}</span></button>`).join('');
      $$('#iv-res [data-k]', el).forEach((b) => (b.onclick = () => { d.location = res[+b.dataset.k]; $('#iv-res', el).innerHTML = `<div class="li small">${icon('check')} ${esc(d.location.name)}</div>`; $('#iv-city', el).value = d.location.name; }));
    };
    $('#iv-find', el)?.addEventListener('click', find); $('#iv-city', el)?.addEventListener('keydown', (e) => { if (e.key === 'Enter') find(); });
  },
  read(s) {
    const d = this.d; const el = this.el;
    if (s === 'hello') d.name = $('#iv-name', el).value.trim();
    if (s === 'week') { d.workDays = pressedVals($('#iv-work', el)).map(Number); d.wfhDays = pressedVals($('#iv-wfh', el)).map(Number); d.workKind = pressedVals($('#iv-wk', el))[0] || 'work'; d.kindLevels[d.workKind] = +$('#iv-wl', el).value; }
    if (s === 'city') { d.units = pressedVals($('#iv-units', el))[0] || 'F'; const q = $('#iv-city', el).value.trim(); if (q && (!d.location || d.location.name !== q)) d.location = d.location && d.location.name === q ? d.location : { name: q, lat: null, lon: null, pending: true }; }
    if (s === 'style') d.styleWords = pressedVals($('#iv-words', el));
    if (s === 'formulas') d.formulas = pressedVals($('#iv-form', el));
    if (s === 'occasions') $$('[data-k]', el).forEach((r) => (d.kindLevels[r.dataset.k] = +r.value));
    if (s === 'colors') { d.favColors = swatchVal($('[data-swatches="fav"]', el)); d.avoidColors = swatchVal($('[data-swatches="avoid"]', el)); }
    if (s === 'comfort') { const t = pressedVals($('#iv-temp', el))[0]; d.runsCold = t === 'cold'; d.runsHot = t === 'hot'; d.heels = $('#iv-heels', el).checked; d.repeatDays = +(pressedVals($('#iv-rep', el))[0] || 10); d.accessories = +(pressedVals($('#iv-acc', el))[0] ?? 2); }
    if (s === 'favorites') { d.favoriteLooks = $('#iv-fav', el).value.trim(); d.notes = $('#iv-notes', el).value.trim(); }
    if (s === 'sunday') { d.autoPlan = $('#iv-auto', el).checked; d.planDow = +$('#iv-pday', el).value; d.weekStartDow = +$('#iv-wstart', el).value; }
  },
  async finish() {
    const d = this.d; d.interviewDone = true;
    if (d.location?.pending) { const r = await Weather.geocode(d.location.name); d.location = r[0] || null; }
    if (d.location) delete d.location.pending;
    Store.saveProfile(d); this.close(); Learn.build();
    await Weather.refresh(true);
    if (activeItems().length) { planWeek(weekKeyOf(today())); toast('Got it. Your week has been restyled around your answers.'); scheduleRender(); }
    else { scheduleRender(); toast('Thanks! Now add some pieces.'); openAddSheet(); }
  },
};
