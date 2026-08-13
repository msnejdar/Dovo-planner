#!/usr/bin/env node
/* Běhový smoke test: vyhodnotí OBA <script> bloky z index.html nad prostým
 * stubem DOM. Nechytá vzhled, ale spolehlivě chytí překlepy, chybějící
 * funkce a ReferenceError — tedy přesně to, co v prohlížeči skončí bílou
 * stránkou. Doplňuje test/geo.test.js, který ověřuje data a geometrii.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length < 2) { console.error('FAIL: čekám aspoň 2 <script> bloky'); process.exit(1); }

/* Každý uzel je proxy, která na cokoli odpoví dalším uzlem — kód tak projde
   celou inicializací, aniž bych musel modelovat celý DOM. */
function node() {
  const store = {};
  return new Proxy(function () {}, {
    get(t, k) {
      if (k in store) return store[k];
      if (k === 'innerHTML' || k === 'textContent' || k === 'value' || k === 'style') return k === 'style' ? node() : '';
      if (k === 'checked' || k === 'hidden' || k === 'disabled') return false;
      if (k === 'offsetWidth' || k === 'offsetHeight') return 200;
      if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
      if (k === 'dataset') return {};
      if (k === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 800, height: 800 });
      if (k === 'addEventListener' || k === 'removeEventListener' || k === 'setPointerCapture') return () => {};
      if (k === 'getAttribute') return () => '';
      if (k === 'setAttribute' || k === 'appendChild' || k === 'remove' || k === 'focus' || k === 'scrollIntoView') return () => {};
      if (k === 'parentElement' || k === 'closest' || k === 'querySelector') return typeof k === 'string' && k === 'closest' ? (() => null) : node();
      if (k === 'querySelectorAll' || k === 'children') return [];
      if (k === 'length') return 0;
      if (k === Symbol.toPrimitive || k === 'toString') return () => '';
      if (k === 'forEach' || k === 'map' || k === 'filter') return Array.prototype[k].bind([]);
      return node();
    },
    set(t, k, v) { store[k] = v; return true; },
    apply() { return node(); },
  });
}

const document = new Proxy({}, {
  get(t, k) {
    if (k === 'getElementById' || k === 'querySelector' || k === 'createElement') return () => node();
    if (k === 'querySelectorAll') return () => [];
    if (k === 'addEventListener') return () => {};
    if (k === 'body' || k === 'documentElement') return node();
    return node();
  },
});

const ctx = vm.createContext({
  console, document,
  window: { addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) },
  navigator: { share: undefined, clipboard: undefined, userAgent: 'node' },
  location: { hash: '', pathname: '/', origin: 'https://example.test', search: '' },
  history: { replaceState() {} },
  localStorage: { getItem: () => null, setItem() {} },
  setTimeout: (f) => { try { f(); } catch (e) { throw e; } return 0; },
  clearTimeout: () => {},
  requestAnimationFrame: (f) => { f(); return 0; },
  fetch: () => Promise.reject(new Error('offline v testu')),
  btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
  atob: (s) => Buffer.from(s, 'base64').toString('binary'),
  Buffer, URL, Blob: function () {}, Date, Math, JSON,
});

let fail = 0;
scripts.forEach((src, i) => {
  try {
    vm.runInContext(src, ctx, { filename: 'script' + i + '.js' });
    console.log('OK  script' + i + ' se vyhodnotil bez chyby');
  } catch (e) {
    console.error('FAIL script' + i + ': ' + String(e.stack || e).split('\n').slice(0, 5).join('\n'));
    fail = 1;
  }
});

/* Ověř, že klíčové funkce po inicializaci opravdu existují a dají se zavolat. */
const need = ['renderPlan', 'renderCatalog', 'renderBudget', 'drawDots', 'drawRoutes', 'buildMap',
  'selectPlace', 'applyZoom', 'fitToDay', 'sharePlan', 'legGeom', 'calcPlan'];
need.forEach(n => {
  if (typeof ctx[n] !== 'function') { console.error('FAIL: chybí funkce ' + n); fail = 1; }
});
if (!fail) console.log('OK  všech ' + need.length + ' klíčových funkcí je definovaných');

process.exit(fail);
