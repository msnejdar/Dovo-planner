#!/usr/bin/env node
/* Geometrický a datový test plánovače.
 * Vytáhne první <script> (čistá data + geometrie, bez DOM) z salzkammergut-planovac.html,
 * vyhodnotí ho a ověří:
 *   1. každý bod je v rámu svého pohledu (szk, dol, all)
 *   2. žádný bod neleží ve vodě (jezerní polygony pohledu)
 *   3. v detailních pohledech (szk, dol) nejsou překryvy bodů < 9 px
 *   4. integritu dat: kategorie, regiony, FROM_CB, TPL odkazy, ll v rozumných mezích
 *   5. syntaxi obou <script> bloků (node --check)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const htmlPath = path.join(__dirname, '..', 'salzkammergut-planovac.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length < 2) { console.error('FAIL: čekám aspoň 2 <script> bloky, našel jsem ' + scripts.length); process.exit(1); }

/* --- node --check na oba bloky --- */
const os = require('os');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'geo-test-'));
scripts.forEach((src, i) => {
  const f = path.join(tmp, 'script' + i + '.js');
  fs.writeFileSync(f, src);
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    console.error('FAIL: syntax error ve <script> bloku #' + i + '\n' + e.stderr);
    process.exit(1);
  }
});
console.log('OK  syntax: ' + scripts.length + ' <script> bloků prošlo node --check');

/* --- vyhodnoť čistý blok #0 --- */
const ctx = vm.createContext({ console });
try {
  vm.runInContext(scripts[0], ctx, { filename: 'script0.js' });
} catch (e) {
  console.error('FAIL: čistý skript #0 nejde vyhodnotit bez DOM: ' + e.message);
  process.exit(1);
}
const A = ctx.APP_PURE;
if (!A) { console.error('FAIL: APP_PURE není exportováno ze skriptu #0'); process.exit(1); }

const { CATS, REGS, FROM_CB, ITEMS, TPL, VIEWS, VPOLYS, PROJ, viewOf, pip, gnavUrl } = A;
let fails = 0;
const fail = msg => { console.error('FAIL: ' + msg); fails++; };

/* --- 4. integrita dat --- */
const ids = new Set();
ITEMS.forEach(it => {
  if (ids.has(it.id)) fail('duplicitní id ' + it.id);
  ids.add(it.id);
  if (!CATS[it.cat]) fail(it.id + ': neznámá kategorie ' + it.cat);
  if (!REGS[it.reg]) fail(it.id + ': neznámý region ' + it.reg);
  if (!FROM_CB[it.reg]) fail(it.id + ': region ' + it.reg + ' chybí ve FROM_CB');
  if (!Array.isArray(it.ll) || it.ll.length !== 2) fail(it.id + ': chybí ll');
  else {
    const [lat, lng] = it.ll;
    if (lat < 46.3 || lat > 49.3 || lng < 11.5 || lng > 15.0) fail(it.id + ': ll mimo rozsah cesty: ' + it.ll);
  }
  if (!it.name) fail(it.id + ': chybí name');
  if (!it.desc) fail(it.id + ': chybí desc');
  if (typeof it.nik !== 'number' || it.nik < 1 || it.nik > 5) fail(it.id + ': nik mimo 1–5');
  if (it.cat !== 'kemp' && typeof it.dur !== 'number') fail(it.id + ': chybí dur');
});
Object.entries(TPL).forEach(([n, days]) => {
  days.flat().forEach(id => { if (!ids.has(id)) fail('TPL ' + n + ' odkazuje na neexistující id ' + id); });
  days.forEach((day, di) => {
    const kempIdx = day.findIndex(id => (ITEMS.find(i => i.id === id) || {}).cat === 'kemp');
    if (kempIdx !== -1 && kempIdx !== day.length - 1) fail('TPL ' + n + ' den ' + (di + 1) + ': kemp není poslední');
  });
});
console.log('OK  data: ' + ITEMS.length + ' míst, kategorie/regiony/FROM_CB/TPL sedí');

/* --- 1.–3. geometrie po pohledech --- */
Object.keys(VIEWS).forEach(view => {
  const V = VIEWS[view];
  const inView = view === 'all' ? ITEMS : ITEMS.filter(i => viewOf(i.reg) === view);
  const pts = inView.map(i => ({ id: i.id, p: PROJ[view][i.id] }));
  pts.forEach(({ id, p }) => {
    if (!p) { fail(view + '/' + id + ': chybí projekce'); return; }
    if (p.x < 0 || p.x > V.W || p.y < 0 || p.y > V.H) fail(view + '/' + id + ': mimo rám (' + p.x.toFixed(0) + ',' + p.y.toFixed(0) + ') rám ' + V.W + '×' + V.H);
    VPOLYS[view].forEach((L, li) => {
      if (pip(p.x, p.y, L.pts)) fail(view + '/' + id + ': bod leží ve vodě (jezero #' + li + ')');
    });
  });
  if (view !== 'all') {
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].p.x - pts[j].p.x, pts[i].p.y - pts[j].p.y);
      if (d < 9) fail(view + ': překryv ' + pts[i].id + ' × ' + pts[j].id + ' (' + d.toFixed(1) + ' px < 9)');
    }
  }
  console.log('OK  ' + view + ': ' + pts.length + ' bodů v rámu ' + V.W + '×' + V.H + ', mimo vodu' + (view !== 'all' ? ', bez překryvů <9 px' : ' (překryvy se v přehledu netestují)'));
});

/* --- navigační URL --- */
const u = gnavUrl([[48.9747, 14.4744], [47.9041, 13.3158], [46.6944, 12.0853]]);
if (!/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&origin=48\.97470,14\.47440&destination=46\.69440,12\.08530&waypoints=47\.90410%2C13\.31580&travelmode=driving$/.test(u)) {
  fail('gnavUrl má nečekaný tvar: ' + u);
}
const many = gnavUrl(Array.from({ length: 14 }, (_, i) => [47 + i * 0.01, 13 + i * 0.01]));
if ((many.match(/%2C/g) || []).length > 9) fail('gnavUrl nesmí poslat víc než 9 waypointů');
if (!fails) console.log('OK  gnavUrl: origin/waypoints/destination + strop 9 zastávek');

if (fails) { console.error('\n' + fails + ' chyb.'); process.exit(1); }
console.log('\nVŠE OK');
