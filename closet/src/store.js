/* ───────────── state + persistence ─────────────
   One in-memory state, two homes:
   • local  — IndexedDB in this browser (the stand-alone app)
   • cloud  — the artifact's `db` store + `assets` for photos (inside Claude), synced across devices */

const COLLS = ['items', 'outfits', 'plans', 'events', 'trips', 'capsules', 'wishlist', 'log'];
const S = { profile: null, ready: false };
COLLS.forEach((c) => (S[c] = new Map()));

const DEFAULT_PROFILE = () => ({
  name: '', units: 'F', location: null, planDow: 0, weekStartDow: 1,
  workDays: [1, 2, 3, 4, 5], wfhDays: [], workKind: 'work',
  kindLevels: {}, formulas: [], formulaWeights: {}, styleWords: [], favColors: [], avoidColors: [],
  runsCold: false, runsHot: false, heels: true, repeatDays: 10, accessories: 2, favoriteLooks: '', notes: '',
  interviewDone: false, autoPlan: true, created: today(),
});

const Store = {
  mode: 'local', db: null, assets: null, readOnly: false, idb: null, photoCache: new Map(), onChange: null, status: '',

  async init(onChange) {
    this.onChange = onChange;
    const hasClaude = !!(window.claude && typeof window.claude.use === 'function');
    if (hasClaude) {
      const db = await window.claude.use('db').catch(() => null);
      if (db) { this.db = db; this.mode = 'cloud'; this.assets = await window.claude.use('assets').catch(() => null); return this.initCloud(); }
    }
    return this.initLocal();
  },

  /* ---------- local: IndexedDB ---------- */
  async initLocal() {
    try {
      this.idb = await new Promise((res, rej) => {
        const r = indexedDB.open('valet', 1);
        r.onupgradeneeded = () => { const d = r.result; COLLS.forEach((c) => d.createObjectStore(c, { keyPath: 'id' })); d.createObjectStore('meta'); d.createObjectStore('photos'); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
      for (const c of COLLS) { const all = await this.idbReq(c, 'readonly', (s) => s.getAll()); all.forEach((o) => S[c].set(o.id, o)); }
      S.profile = Object.assign(DEFAULT_PROFILE(), (await this.idbReq('meta', 'readonly', (s) => s.get('profile'))) || {});
    } catch (e) {
      this.idb = null; this.status = 'This browser is blocking storage, so changes last only until you close the page.';
      S.profile = DEFAULT_PROFILE();
    }
    S.ready = true;
  },
  idbReq(store, mode, fn) {
    return new Promise((res, rej) => { const t = this.idb.transaction(store, mode); const r = fn(t.objectStore(store)); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  },

  /* ---------- cloud: artifact db ---------- */
  initCloud() {
    return new Promise((resolve) => {
      let pending = COLLS.length + 1; let done = false;
      const finish = () => { if (done) return; done = true; S.profile = Object.assign(DEFAULT_PROFILE(), S.profile || {}); S.ready = true; resolve(); };
      const timer = setTimeout(() => { this.status = 'Your closet is taking a while to load. Showing what has arrived so far.'; finish(); }, 10000);
      const first = (snap) => { if (!snap.metadata?.fromCache && --pending <= 0) { clearTimeout(timer); this.status = ''; finish(); } };
      const onErr = (e) => { this.status = e?.code === 'revoked' ? 'Access to this closet changed. Reload to continue.' : 'Some closet data could not load.'; if (--pending <= 0) { clearTimeout(timer); finish(); } this.onChange?.(); };
      for (const c of COLLS) {
        let seen = false;
        this.db.collection(c).onSnapshot((snap) => {
          for (const ch of snap.docChanges()) {
            if (ch.type === 'removed') S[c].delete(ch.doc.id); else S[c].set(ch.doc.id, Object.assign(clone(ch.doc.data()), { id: ch.doc.id }));
          }
          if (!seen && !snap.metadata?.fromCache) { seen = true; first(snap); }
          if (done) this.onChange?.(c);
        }, onErr);
      }
      let pSeen = false;
      this.db.doc('meta/profile').onSnapshot((snap) => {
        if (snap.exists) S.profile = Object.assign(DEFAULT_PROFILE(), clone(snap.data()));
        if (!pSeen && !snap.metadata?.fromCache) { pSeen = true; first(snap); }
        if (done) this.onChange?.('profile');
      }, onErr);
    });
  },
  queues: new Map(), inflight: 0, waiting: [],
  slot() { if (this.inflight < 6) { this.inflight++; return Promise.resolve(); } return new Promise((r) => this.waiting.push(r)); },
  release() { const n = this.waiting.shift(); if (n) n(); else this.inflight--; },
  cloudWrite(path, body) {
    let q = this.queues.get(path); if (!q) { q = { busy: false, next: undefined }; this.queues.set(path, q); }
    q.next = body; if (!q.busy) this.pump(path, q);
  },
  async pump(path, q) {
    q.busy = true;
    while (q.next !== undefined) {
      const body = q.next; q.next = undefined;
      const run = async () => { await this.slot(); try { return await (body === null ? this.db.doc(path).delete() : this.db.doc(path).set(body)); } finally { this.release(); } };
      const later = (ms) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));
      try { await run(); } catch (e) {
        if (e?.code === 'unavailable' || e?.code === 'resource_exhausted') {
          let ok = false; for (let k = 1; k <= 3 && !ok; k++) { await later(700 * k); try { await run(); ok = true; } catch { /* next try */ } }
          if (!ok) toast('Couldn’t save just now. Your change will retry on the next edit.');
        }
        else if (e?.code === 'quota_exceeded') toast('Your closet storage is full. Remove photos or retired pieces to make room.');
        else if (e?.code === 'invalid_argument') { this.readOnly = true; toast('This copy of the closet is view-only for you.'); }
        else toast('Couldn’t save that change.');
      }
    }
    q.busy = false;
  },

  /* ---------- public API ---------- */
  put(coll, obj) {
    if (!obj.id) obj.id = uid(coll[0]);
    obj.updated = Date.now();
    S[coll].set(obj.id, obj);
    if (this.mode === 'cloud') { const body = clone(obj); delete body.id; this.cloudWrite(`${coll}/${obj.id}`, body); }
    else if (this.idb) this.idbReq(coll, 'readwrite', (s) => s.put(clone(obj))).catch(() => toast('Couldn’t save that change.'));
    return obj;
  },
  del(coll, id) {
    S[coll].delete(id);
    if (this.mode === 'cloud') this.cloudWrite(`${coll}/${id}`, null);
    else if (this.idb) this.idbReq(coll, 'readwrite', (s) => s.delete(id)).catch(() => {});
  },
  saveProfile(patch) {
    S.profile = Object.assign(S.profile || DEFAULT_PROFILE(), patch || {});
    if (this.mode === 'cloud') this.cloudWrite('meta/profile', clone(S.profile));
    else if (this.idb) this.idbReq('meta', 'readwrite', (s) => s.put(clone(S.profile), 'profile')).catch(() => {});
  },
  async getMeta(key) {
    if (this.mode === 'cloud') { try { const s = await this.db.doc('meta/' + key).get(); return s.exists ? clone(s.data()) : null; } catch { return null; } }
    if (this.idb) return this.idbReq('meta', 'readonly', (s) => s.get(key)).catch(() => null);
    return null;
  },
  setMeta(key, val) {
    if (this.mode === 'cloud') this.cloudWrite('meta/' + key, clone(val));
    else if (this.idb) this.idbReq('meta', 'readwrite', (s) => s.put(clone(val), key)).catch(() => {});
  },

  /* photos: {a,u} asset · {k} IndexedDB blob · {d} inline data URL · {r} remote URL */
  async savePhoto(blob) {
    if (this.mode === 'cloud' && this.assets) {
      try { const r = await this.assets.upload(blob); return { a: r.id, u: r.url }; } catch { /* fall through to inline */ }
    }
    if (this.mode === 'local' && this.idb) {
      const k = uid('p'); await this.idbReq('photos', 'readwrite', (s) => s.put(blob, k)); this.photoCache.set(k, URL.createObjectURL(blob)); return { k };
    }
    const img = await loadImage(await blobToDataURL(blob)); const small = await imageToBlob(img, 420, 0.72); return { d: await blobToDataURL(small) };
  },
  photoSrc(ref) {
    if (!ref) return null;
    if (ref.u) return ref.u; if (ref.a) return '/_blob/' + ref.a; if (ref.d) return ref.d; if (ref.r) return ref.r;
    if (ref.k) { if (this.photoCache.has(ref.k)) return this.photoCache.get(ref.k); this.loadPhoto(ref.k); return null; }
    return null;
  },
  loadingPhotos: new Set(),
  async loadPhoto(k) {
    if (this.loadingPhotos.has(k) || !this.idb) return; this.loadingPhotos.add(k);
    const b = await this.idbReq('photos', 'readonly', (s) => s.get(k)).catch(() => null);
    if (b) { this.photoCache.set(k, URL.createObjectURL(b)); $$(`img[data-pk="${k}"]`).forEach((im) => { im.src = this.photoCache.get(k); im.hidden = false; im.nextElementSibling?.remove?.(); }); }
  },
  async deletePhoto(ref) {
    if (!ref) return;
    if (ref.k && this.idb) this.idbReq('photos', 'readwrite', (s) => s.delete(ref.k)).catch(() => {});
    if (ref.a && this.assets) this.assets.delete(ref.a).catch(() => {});
  },
  async exportPhotoData(ref) {
    if (ref?.k && this.idb) { const b = await this.idbReq('photos', 'readonly', (s) => s.get(ref.k)).catch(() => null); if (b) return blobToDataURL(b); }
    return null;
  },

  async wipe() {
    for (const c of COLLS) for (const id of [...S[c].keys()]) this.del(c, id);
    if (this.mode === 'local' && this.idb) await this.idbReq('photos', 'readwrite', (s) => s.clear()).catch(() => {});
    S.profile = DEFAULT_PROFILE(); this.saveProfile();
  },
};

/* ---------- derived item facts ---------- */
const itemsArr = (filter) => [...S.items.values()].filter((i) => (filter ? filter(i) : true));
const activeItems = () => itemsArr((i) => (i.status || 'active') === 'active');
const wearsOf = (i) => (i.wears || []).length + (i.priorWears || 0);
const lastWorn = (i) => (i.wears && i.wears.length ? i.wears.reduce((a, b) => (a > b ? a : b)) : null);
const cpw = (i) => (i.price ? i.price / Math.max(1, wearsOf(i)) : null);
const slotOf = (i) => CATS[i.cat]?.slot || 'acc';
const subDefaults = (sub) => SUB[sub] || [3, 3, 'tee'];
const itemShape = (i) => subDefaults(i.sub)[2] || 'tee';
const primaryColor = (i) => COLORS[(i.colors || [])[0]] || COLORS.grey;

function newItem(p = {}) {
  const [w, f] = subDefaults(p.sub);
  return Object.assign({ id: uid('i'), name: '', cat: 'top', sub: CATS[p.cat || 'top']?.subs[0], colors: ['black'], pattern: 'Solid', material: '',
    warmth: w, formality: f, seasons: [], occasions: [], brand: '', store: '', price: null, purchased: '', size: '', notes: '',
    fav: false, status: 'active', photo: null, wears: [], created: today(), source: 'manual' }, p);
}

function logWear(itemIds, date = today(), meta = {}) {
  for (const id of itemIds) {
    const it = S.items.get(id); if (!it) continue;
    it.wears = it.wears || []; if (!it.wears.includes(date)) it.wears.push(date); it.wears.sort();
    Store.put('items', it);
  }
  const mk = date.slice(0, 7); const doc = S.log.get(mk) || { id: mk, entries: [] };
  doc.entries = doc.entries.filter((e) => !(e.d === date && e.key === meta.key));
  doc.entries.push(Object.assign({ d: date, items: itemIds }, meta));
  Store.put('log', doc);
}
function unlogWear(itemIds, date) {
  for (const id of itemIds) { const it = S.items.get(id); if (!it || !it.wears) continue; it.wears = it.wears.filter((d) => d !== date); Store.put('items', it); }
  const mk = date.slice(0, 7); const doc = S.log.get(mk);
  if (doc) { doc.entries = doc.entries.filter((e) => e.d !== date || !e.items.every((x) => itemIds.includes(x))); Store.put('log', doc); }
}
const logEntries = () => [...S.log.values()].flatMap((d) => d.entries || []);

function loadSampleCloset() {
  const t = today();
  SAMPLE_CLOSET.forEach(([name, cat, sub, colors, pattern, material, price, store, brand, monthsAgo, wearsN], idx) => {
    const purchased = addDays(t, -Math.round(monthsAgo * 30.4));
    const span = Math.max(7, daysBetween(purchased, t));
    const wears = new Set();
    // deterministic pseudo-random spread so the sample looks lived-in
    let seed = idx * 97 + 13;
    for (let n = 0; n < wearsN * 3 && wears.size < wearsN; n++) { seed = (seed * 9301 + 49297) % 233280; wears.add(addDays(t, -1 - Math.floor((seed / 233280) * Math.min(span, 360)))); }
    const [w, f] = subDefaults(sub);
    Store.put('items', newItem({ name, cat, sub, colors, pattern, material, price, store, brand, purchased, warmth: w, formality: f,
      seasons: material === 'Linen' ? ['spring', 'summer'] : (['Wool coat', 'Puffer', 'Tall boots'].includes(sub) || ['Cashmere', 'Wool'].includes(material) && cat === 'top') ? ['fall', 'winter'] : [],
      wears: [...wears].sort(), sample: true, source: 'sample', fav: wearsN > 30 }));
  });
}
function removeSampleCloset() {
  itemsArr((i) => i.sample).forEach((i) => Store.del('items', i.id));
  for (const [id, p] of S.plans) { if (p.sample) Store.del('plans', id); }
}
