/* ───────────── outside world: weather, calendar, Gmail, Claude ───────────── */
const IN_CLAUDE = !!(window.claude && typeof window.claude.use === 'function');

const WX_CODES = {
  0: ['Clear', 'sun'], 1: ['Mostly clear', 'sun'], 2: ['Partly cloudy', 'cloudsun'], 3: ['Overcast', 'cloud'], 45: ['Fog', 'fog'], 48: ['Fog', 'fog'],
  51: ['Drizzle', 'rain'], 53: ['Drizzle', 'rain'], 55: ['Drizzle', 'rain'], 56: ['Freezing drizzle', 'rain'], 57: ['Freezing drizzle', 'rain'],
  61: ['Light rain', 'rain'], 63: ['Rain', 'rain'], 65: ['Heavy rain', 'rain'], 66: ['Freezing rain', 'rain'], 67: ['Freezing rain', 'rain'],
  71: ['Light snow', 'snow'], 73: ['Snow', 'snow'], 75: ['Heavy snow', 'snow'], 77: ['Snow', 'snow'], 80: ['Showers', 'rain'], 81: ['Showers', 'rain'], 82: ['Downpours', 'rain'],
  85: ['Snow showers', 'snow'], 86: ['Snow showers', 'snow'], 95: ['Thunderstorms', 'storm'], 96: ['Thunderstorms', 'storm'], 99: ['Thunderstorms', 'storm'],
};
const wxLabel = (w) => (w?.src === 'typical' || w?.src === 'estimate' ? 'Typical weather' : w?.code != null && WX_CODES[w.code] ? WX_CODES[w.code][0] : (w?.rain ?? 0) >= 50 ? 'Rain likely' : 'Fair');
const wxIcon = (w) => (w?.code != null && WX_CODES[w.code] ? WX_CODES[w.code][1] : (w?.rain ?? 0) >= 50 ? 'rain' : 'cloudsun');

async function fetchJSON(url, ms = 8000) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); } finally { clearTimeout(t); }
}

const Weather = {
  days: {}, src: null, updated: null, status: '', typical: null,
  async refresh(force = false) {
    const loc = S.profile.location;
    if (!loc) { this.status = 'Add your city in Profile to dress for the real forecast.'; this.days = {}; return; }
    const key = `${loc.lat},${loc.lon}`; const cache = lsGet('wx', null);
    if (!force && cache && cache.key === key && Date.now() - cache.t < 3 * 3600e3) { this.days = cache.days; this.src = 'live'; this.updated = cache.t; this.status = ''; return; }
    if (loc.lat != null) {
      try {
        const u = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,weather_code,wind_speed_10m_max,uv_index_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=16&past_days=7`;
        const j = await fetchJSON(u); const d = j.daily; const days = {};
        d.time.forEach((t, i) => { days[t] = { hi: Math.round(d.apparent_temperature_max?.[i] ?? d.temperature_2m_max[i]), lo: Math.round(d.apparent_temperature_min?.[i] ?? d.temperature_2m_min[i]),
          rawHi: Math.round(d.temperature_2m_max[i]), rawLo: Math.round(d.temperature_2m_min[i]), rain: d.precipitation_probability_max?.[i] ?? 0, code: d.weather_code[i], wind: d.wind_speed_10m_max?.[i] ?? 0, uv: d.uv_index_max?.[i] ?? 0, src: 'live' }; });
        this.days = days; this.src = 'live'; this.updated = Date.now(); this.status = ''; lsSet('wx', { key, t: this.updated, days }); return;
      } catch { /* blocked inside Claude, or offline */ }
    }
    // A forecast Claude saved for you (e.g. from a Sunday planning task)
    const saved = await Store.getMeta('forecast');
    if (saved?.days && Object.keys(saved.days).some((d) => d >= today())) { this.days = {}; for (const [d, v] of Object.entries(saved.days)) this.days[d] = Object.assign({}, v, { src: 'claude' }); this.src = 'claude'; this.updated = saved.updated; this.status = ''; return; }
    if (cache?.key === key && cache.days) { this.days = cache.days; this.src = 'cached'; this.updated = cache.t; this.status = 'Showing the last forecast you loaded.'; return; }
    this.days = {}; this.src = 'typical';
    this.status = IN_CLAUDE ? 'Inside Claude the live forecast can’t load, so plans use typical weather for your city. Adjust any day by tapping its weather.' : 'Couldn’t reach the forecast. Using typical weather for now.';
    await this.loadTypical(loc);
  },
  async loadTypical(loc) {
    const mk = `typ:${loc.name}:${today().slice(0, 7)}`; const c = lsGet(mk, null);
    if (c) { this.typical = c; return; }
    if (AI.on) {
      try {
        const r = await AI.json(`For ${loc.name}${loc.lat != null ? ` (lat ${loc.lat}, lon ${loc.lon})` : ''}, give typical daily weather for ${MON_LONG[new Date().getMonth()]} and ${MON_LONG[(new Date().getMonth() + 1) % 12]}. Reply with only JSON: {"thisMonth":{"hi":F,"lo":F,"rainDaysPct":0-100},"nextMonth":{"hi":F,"lo":F,"rainDaysPct":0-100}} using Fahrenheit integers.`, 'quick');
        if (r?.thisMonth?.hi) { this.typical = r; lsSet(mk, r); return; }
      } catch { /* fall back to the latitude estimate */ }
    }
    this.typical = null;
  },
  estimate(date, lat = 38) {
    const a = Math.abs(lat); const mean = 82 - 0.75 * Math.max(0, a - 10); const amp = 4 + 0.45 * Math.max(0, a - 10);
    const doy = (parseISO(date) - new Date(parseISO(date).getFullYear(), 0, 0)) / 864e5; const phase = Math.cos(((doy - 200) / 365) * 2 * Math.PI) * (lat >= 0 ? 1 : -1);
    const m = mean + amp * phase; return { hi: Math.round(m + 10), lo: Math.round(m - 10), rain: 25, code: 2, src: 'estimate' };
  },
  forDate(date, loc) {
    if (loc && loc !== S.profile.location) { const tw = loc.days?.[date]; if (tw) return tw; return this.estimate(date, loc.lat ?? 38); }
    if (this.days[date]) return this.days[date];
    if (this.typical) { const m = date.slice(0, 7) === today().slice(0, 7) ? this.typical.thisMonth : this.typical.nextMonth; if (m) return { hi: m.hi, lo: m.lo, rain: m.rainDaysPct ?? 25, code: 2, src: 'typical' }; }
    return this.estimate(date, S.profile.location?.lat ?? 38);
  },
  srcLabel(src) { return { live: 'Live forecast', claude: 'Forecast saved by Claude', cached: 'Last saved forecast', typical: 'Typical for this time of year', estimate: 'Seasonal estimate', manual: 'Set by you', 'last-year': 'Last year on these dates' }[src] || 'Estimate'; },

  async geocode(q) {
    try {
      const j = await fetchJSON(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=en&format=json`);
      return (j.results || []).map((r) => ({ name: [r.name, r.admin1, r.country_code === 'US' ? '' : r.country].filter(Boolean).join(', '), lat: +r.latitude.toFixed(3), lon: +r.longitude.toFixed(3) }));
    } catch { /* fall through */ }
    if (AI.on) {
      try { const r = await AI.json(`Give the coordinates of the place “${q}”. Reply with only JSON: [{"name":"City, State or Country","lat":number,"lon":number}] with up to 3 likely matches.`, 'quick'); if (Array.isArray(r)) return r.filter((x) => x.lat != null).map((x) => ({ name: x.name, lat: +(+x.lat).toFixed(3), lon: +(+x.lon).toFixed(3) })); } catch { /* none */ }
    }
    return [{ name: q, lat: null, lon: null }];
  },
  /* trip weather: forecast if it's close, otherwise last year's actuals for the same dates */
  async forTrip(dest, start, end) {
    const out = {}; if (dest.lat == null) return out;
    const horizon = addDays(today(), 15);
    try {
      if (start <= horizon) {
        const j = await fetchJSON(`https://api.open-meteo.com/v1/forecast?latitude=${dest.lat}&longitude=${dest.lon}&daily=apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,weather_code&temperature_unit=fahrenheit&timezone=auto&forecast_days=16`);
        j.daily.time.forEach((t, i) => { if (t >= start && t <= end) out[t] = { hi: Math.round(j.daily.apparent_temperature_max[i]), lo: Math.round(j.daily.apparent_temperature_min[i]), rain: j.daily.precipitation_probability_max[i] ?? 0, code: j.daily.weather_code[i], src: 'live' }; });
      }
      const missing = []; for (let d = start; d <= end; d = addDays(d, 1)) if (!out[d]) missing.push(d);
      if (missing.length) {
        const ly = (d) => { const x = parseISO(d); x.setFullYear(x.getFullYear() - 1); return iso(x); };
        const j = await fetchJSON(`https://archive-api.open-meteo.com/v1/archive?latitude=${dest.lat}&longitude=${dest.lon}&start_date=${ly(missing[0])}&end_date=${ly(missing[missing.length - 1])}&daily=apparent_temperature_max,apparent_temperature_min,precipitation_sum,weather_code&temperature_unit=fahrenheit&timezone=auto`);
        const map = {}; j.daily.time.forEach((t, i) => (map[t] = i));
        for (const d of missing) { const i = map[ly(d)]; if (i != null) out[d] = { hi: Math.round(j.daily.apparent_temperature_max[i]), lo: Math.round(j.daily.apparent_temperature_min[i]), rain: j.daily.precipitation_sum[i] > 1 ? 70 : 10, code: j.daily.weather_code[i], src: 'last-year' }; }
      }
    } catch { /* estimates fill in */ }
    if (!Object.keys(out).length && AI.on) {
      try {
        const r = await AI.json(`Typical weather in ${dest.name} between ${start} and ${end}. Reply with only JSON {"hi":F,"lo":F,"rainChancePct":0-100} using Fahrenheit integers.`, 'quick');
        if (r?.hi) for (let d = start; d <= end; d = addDays(d, 1)) out[d] = { hi: r.hi, lo: r.lo, rain: r.rainChancePct ?? 25, code: 2, src: 'typical' };
      } catch { /* none */ }
    }
    return out;
  },
};

/* ---------- calendar ---------- */
const Cal = {
  google: lsGet('gcal', { t: 0, events: [] }).events || [], gStatus: '', gState: lsGet('gcalOn', false) ? 'on' : 'off', gUpdated: lsGet('gcal', { t: 0 }).t,
  eventsOn(date) {
    const own = [...S.events.values()].filter((e) => e.date === date);
    const g = this.gState === 'on' ? this.google.filter((e) => e.date === date) : [];
    return [...own, ...g].sort(by((e) => (e.allDay ? '' : timeKey(e.time))));
  },
  hasKind(k) { const t = today(); return [...S.events.values(), ...this.google].some((e) => e.date >= t && classifyEvent(e) === k); },
  async syncGoogle(interactive = false) {
    const mcp = await window.claude?.use?.('mcp').catch(() => null);
    if (!mcp) { this.gStatus = 'Google Calendar is available when you open Valet inside Claude.'; return false; }
    const start = addDays(weekStartOf(today(), S.profile.weekStartDow ?? 1), 0), end = addDays(start, 27);
    const all = []; let token; this.gStatus = 'Syncing…';
    try {
      for (let page = 0; page < 4; page++) {
        const input = { startTime: `${start}T00:00:00`, endTime: `${end}T23:59:00`, orderBy: 'startTime', pageSize: 250 }; if (token) input.pageToken = token;
        const r = await mcp.callTool('Google Calendar', 'list_events', input, { cache: false });
        const p = r.payload || {}; (p.events || []).forEach((e) => { const m = mapGoogleEvent(e); if (m) all.push(m); });
        token = p.nextPageToken; if (!token) break;
      }
      this.google = all; this.gUpdated = Date.now(); this.gState = 'on'; this.gStatus = '';
      lsSet('gcal', { t: this.gUpdated, events: all }); lsSet('gcalOn', true); return true;
    } catch (e) {
      this.gStatus = mcpErrorCopy(e, 'Google Calendar'); if (['not_in_manifest', 'server_not_connected', 'needs_reauth', 'blocked_by_policy'].includes(e?.code)) { this.gState = 'off'; this.google = []; }
      return false;
    }
  },
  disconnectGoogle() { this.gState = 'off'; this.google = []; lsSet('gcalOn', false); lsSet('gcal', { t: 0, events: [] }); },
  importICS(text) {
    const evs = parseICS(text); for (const e of [...S.events.values()]) if (e.src === 'ics') Store.del('events', e.id);
    // one doc per day keeps the store small
    evs.forEach((e) => Store.put('events', e)); S.profile.icsImported = today(); Store.saveProfile(); return evs.length;
  },
};
function timeKey(t) { if (!t) return '00:00'; const m = String(t).match(/(\d{1,2})(?::(\d{2}))?\s*([ap])/i); if (!m) return t; let h = +m[1] % 12; if (m[3].toLowerCase() === 'p') h += 12; return `${pad(h)}:${m[2] || '00'}`; }
function mapGoogleEvent(e) {
  if (!e || e.status === 'cancelled') return null;
  const s = e.start || {}; const allDay = !!s.date && !s.dateTime;
  const date = (s.dateTime || s.date || '').slice(0, 10); if (!date) return null;
  let time = ''; if (s.dateTime) { const m = s.dateTime.match(/T(\d{2}):(\d{2})/); if (m) time = fmtTime(+m[1], +m[2]); }
  const ev = { id: 'g' + (e.id || uid()), date, time, allDay, title: e.summary || '(busy)', location: e.location || '', desc: (e.description || '').slice(0, 300), src: 'google' };
  if (e.eventType === 'OUT_OF_OFFICE') ev.kind = 'casual';
  // multi-day all-day events (a trip) cover each day
  if (allDay && e.end?.date) { const n = daysBetween(date, e.end.date); if (n > 1) ev.span = n; }
  return ev;
}
function expandSpans(list) { const out = []; for (const e of list) { out.push(e); for (let i = 1; i < (e.span || 1); i++) out.push(Object.assign({}, e, { id: e.id + '_' + i, date: addDays(e.date, i) })); } return out; }
const _syncG = Cal.syncGoogle.bind(Cal); Cal.syncGoogle = async (x) => { const ok = await _syncG(x); if (ok) Cal.google = expandSpans(Cal.google); return ok; };
Cal.google = expandSpans(Cal.google);

function mcpErrorCopy(e, server) {
  switch (e?.code) {
    case 'needs_reauth': return `Reconnect ${server} in claude.ai Settings → Connectors, then try again.`;
    case 'server_not_connected': return `Add the ${server} connector in claude.ai Settings → Connectors to use this.`;
    case 'selection_required': return `Choose which ${server} account to use when Claude asks, then try again.`;
    case 'not_in_manifest': case 'approval_required': return `${server} access is off for Valet. Allow it from this page’s permissions to use it.`;
    case 'blocked_by_policy': return `Your organization doesn’t allow ${server} here.`;
    case 'server_unavailable': case 'rate_limited': return `${server} isn’t answering right now. Try again in a minute.`;
    case 'tool_error': return `${server} reported a problem: ${String(e.message || '').slice(0, 120)}`;
    default: return `Couldn’t reach ${server} (${e?.code || 'error'}).`;
  }
}

/* ---------- Gmail order emails (inside Claude) ---------- */
const Mail = {
  async find(retailerQ) {
    const mcp = await window.claude?.use?.('mcp').catch(() => null); if (!mcp) throw { code: 'unavailable' };
    const from = retailerQ || GMAIL_STORES;
    const q = `from:(${from}) (subject:(order OR confirmation OR receipt OR shipped OR purchase OR "your fix" OR checkout) OR category:purchases) newer_than:3y`;
    const out = []; let token;
    for (let page = 0; page < 3; page++) {
      const input = { query: q, pageSize: 50, view: 'THREAD_VIEW_SUMMARY' }; if (token) input.pageToken = token;
      const r = await mcp.callTool('Gmail', 'search_threads', input, { cache: false });
      const p = r.payload || {};
      (p.threads || []).forEach((t) => { const m = (t.messages || [])[0] || {}; out.push({ id: t.id, subject: m.subject || '(no subject)', from: m.addressDisplayNames?.[0]?.displayName || m.sender || '', date: (m.date || '').slice(0, 10), snippet: m.snippet || '' }); });
      token = p.nextPageToken; if (!token || out.length >= 120) break;
    }
    return out;
  },
  async read(threadId) {
    const mcp = await window.claude.use('mcp');
    const r = await mcp.callTool('Gmail', 'get_thread', { threadId, messageFormat: 'PLAIN_TEXT' }, { cache: false });
    const msgs = r.payload?.messages || [];
    const m = msgs.find((x) => x.plaintextBody) || msgs[0] || {};
    return { text: String(m.plaintextBody || m.snippet || '').slice(0, 14000), subject: m.subject || '', from: m.sender || '', date: (m.date || '').slice(0, 10) };
  },
};

/* ---------- Claude (sample) ---------- */
const AI = {
  s: null, images: false, on: false, denied: false,
  async init() {
    if (!IN_CLAUDE) return;
    this.s = await window.claude.use('sample').catch(() => null);
    if (this.s) { this.on = true; const lim = await this.s.limits().catch(() => null); this.images = !!lim?.images; }
  },
  async json(prompt, tier = 'default', images) {
    if (!this.on) throw { code: 'unavailable' };
    try { return await this.s.json(prompt, Object.assign({ modelTier: tier }, images ? { images } : {})); }
    catch (e) { if (e?.code === 'not_granted' || e?.code === 'sampling_disabled' || e?.code === 'not_declared') { this.on = false; this.denied = true; } throw e; }
  },
  errCopy(e) {
    switch (e?.code) {
      case 'not_granted': return 'Claude features are turned off for Valet. You can turn them on from this page’s permissions.';
      case 'rate_limited': return 'Claude is busy. Try again in a minute.';
      case 'image_rejected': return 'That photo couldn’t be read. Try a smaller JPEG or PNG.';
      case 'invalid_json': return 'Claude’s answer didn’t come back in a usable shape. Try again.';
      case 'session_expired': return 'Sign in to Claude again, then retry.';
      default: return 'Claude couldn’t finish that just now.';
    }
  },
  vocab() {
    return `Categories and subtypes: ${Object.entries(CATS).map(([k, c]) => `${k}: ${c.subs.join(' | ')}`).join('; ')}. Colour keys: ${Object.keys(COLORS).join(', ')}. Patterns: ${PATTERNS.join(', ')}. Materials: ${MATERIALS.join(', ')}.`;
  },
  async tagPhoto(blob) {
    return this.json(`You are tagging a photo of one clothing item or accessory for a wardrobe app. ${this.vocab()}
Reply with only JSON: {"name":"short descriptive name, e.g. Camel cable-knit sweater","cat":"category key","sub":"subtype from that category","colors":["1-2 colour keys, main first"],"pattern":"pattern","material":"material or empty","warmth":1-5,"formality":1-5,"seasons":["spring","summer","fall","winter" subset, empty if year-round]}
Warmth 1 = breezy summer piece, 5 = winter coat. Formality 1 = lounge, 2 = casual, 3 = smart casual, 4 = polished/business, 5 = formal.`, 'quick', [blob]);
  },
  async parseOrder(text, hint = '') {
    return this.json(`Extract the clothing, shoes, bags and accessories purchased in this order text. Skip anything that is not apparel (home goods, beauty, gift cards), skip returned or sent-back items, and skip totals, tax, shipping and fees. ${this.vocab()}
Reply with only a JSON array: [{"name":"product name","brand":"brand or empty","store":"retailer","price":number or null,"purchased":"YYYY-MM-DD or empty","size":"size or empty","cat":"category key","sub":"subtype","colors":["colour keys"],"pattern":"pattern","material":"material or empty"}]. Reply [] if there are none.
${hint ? 'Context: ' + hint + '\n' : ''}ORDER TEXT:\n${text.slice(0, 14000)}`, 'default');
  },
  async stylist(question, date) {
    const ctx = dayContext(date);
    const closet = activeItems().slice(0, 400).map((i) => `${i.id}|${i.name}|${i.sub}|${(i.colors || []).join('/')}|${i.pattern}|dress ${i.formality}|warmth ${i.warmth}|worn ${wearsOf(i)}x, last ${lastWorn(i) || 'never'}`).join('\n');
    const prof = S.profile;
    return this.json(`You are a personal stylist working only from the client's own closet below.
Client style words: ${(prof.styleWords || []).join(', ') || 'not given'}. Go-to formulas: ${(prof.formulas || []).map((k) => FORMULAS.find((f) => f.k === k)?.label).filter(Boolean).join('; ') || 'not given'}. Favourite looks: ${prof.favoriteLooks || 'not given'}. Avoid colours: ${(prof.avoidColors || []).join(', ') || 'none'}. Runs cold: ${prof.runsCold ? 'yes' : 'no'}. Wears heels: ${prof.heels ? 'yes' : 'no'}.
Date: ${fmtLong(date)}. Weather: high ${ctx.wx.hi}°F, low ${ctx.wx.lo}°F, ${ctx.wx.rain}% chance of rain (${Weather.srcLabel(ctx.wx.src)}). Calendar: ${ctx.events.map((e) => `${e.time} ${e.title}`).join('; ') || 'nothing scheduled'}.
CLOSET (id|name|type|colours|pattern|dress level 1-5|warmth 1-5|wear history):
${closet}

Question: ${question}
Reply with only JSON: {"looks":[{"title":"short name","items":["ids from the closet"],"why":"one or two sentences"}],"tip":"optional one-sentence tip, or empty"}. Give 1 to 3 looks, each a complete outfit with shoes. Use only ids that appear above.`, 'default');
  },
};

/* ---------- files out ---------- */
async function saveFile(filename, data, type = 'application/json') {
  if (IN_CLAUDE) {
    const dl = await window.claude.use('downloads').catch(() => null);
    if (!dl) { toast('Downloads aren’t available in this view.'); return false; }
    try { await dl.save({ filename, data: data instanceof Blob ? data : new Blob([data], { type }) }); return true; } catch (e) { if (e?.code !== 'cancelled' && e?.code !== 'declined') toast('The download didn’t go through.'); return false; }
  }
  const url = URL.createObjectURL(data instanceof Blob ? data : new Blob([data], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); return true;
}
