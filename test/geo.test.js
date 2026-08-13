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

const htmlPath = path.join(__dirname, '..', 'index.html');
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

/* --- vyhodnoť čistý blok #0 (vm kontext nemá host funkce — dodej btoa/atob jako v prohlížeči) --- */
const ctx = vm.createContext({
  console,
  btoa: s => Buffer.from(s, 'binary').toString('base64'),
  atob: s => Buffer.from(s, 'base64').toString('binary'),
});
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

/* --- sdílení plánu: roundtrip + odolnost --- */
const payload = { d: [['p1', 'k4'], [], ['v15']], f: ['g11'], v: 1, a: 1, i: { km: 1241, rate: 24.6 } };
const rt = A.decodePlanData(A.encodePlanData(payload));
if (!rt || rt.d[0][1] !== 'k4' || rt.d[2][0] !== 'v15' || rt.f[0] !== 'g11' || rt.i.km !== 1241) fail('encode/decodePlanData: roundtrip selhal');
if (/[+/=]/.test(A.encodePlanData(payload))) fail('encodePlanData: výstup není base64url (obsahuje +/=)');
if (A.decodePlanData('%%%nesmysl') !== null || A.decodePlanData(A.encodePlanData({ x: 1 })) !== null) fail('decodePlanData: nevrací null pro nevalidní vstup');
if (!fails) console.log('OK  sdílení: encode/decode roundtrip, base64url, odmítá nevalidní vstup');

/* --- čas: hodiny, letní čas, slunce, otvíračky --- */
const { fmtClock, euOffsetMin, parseISO, sunTimes, openIssue, DOW } = A;
if (fmtClock(0) !== '0:00' || fmtClock(495) !== '8:15' || fmtClock(1439) !== '23:59') fail('fmtClock: špatný formát');
if (fmtClock(1440 + 90) !== '1:30') fail('fmtClock: nepřetáčí přes půlnoc');
if (euOffsetMin(new Date(Date.UTC(2026, 7, 15))) !== 120) fail('euOffsetMin: v srpnu má být letní čas (+120)');
if (euOffsetMin(new Date(Date.UTC(2026, 0, 15))) !== 60) fail('euOffsetMin: v lednu má být zimní čas (+60)');
if (parseISO('2026-08-15').getUTCDate() !== 15 || parseISO('nesmysl') !== null) fail('parseISO: špatný převod');
/* Toblach 15. 8. 2026: východ kolem 6:10, západ kolem 20:25 SELČ */
const sun = sunTimes(46.7345, 12.2225, parseISO('2026-08-15'));
if (!sun) fail('sunTimes: nic nevrátilo');
else {
  if (Math.abs(sun.rise - 370) > 25) fail('sunTimes: východ mimo očekávání (' + fmtClock(sun.rise) + ')');
  if (Math.abs(sun.set - 1225) > 25) fail('sunTimes: západ mimo očekávání (' + fmtClock(sun.set) + ')');
}
/* v létě musí být den v Alpách delší než v prosinci */
const dec = sunTimes(46.7345, 12.2225, parseISO('2026-12-15'));
if (dec && (sun.set - sun.rise) <= (dec.set - dec.rise)) fail('sunTimes: srpnový den má být delší než prosincový');
const trh = ITEMS.find(i => i.id === 'g14'); /* trh v Brunecku — jen středa */
if (!trh.cd || !trh.oh) fail('otvíračky se nepropsaly do ITEMS');
if (openIssue(trh, 3, 9 * 60) !== null) fail('openIssue: ve středu dopoledne má být trh v pořádku');
if (!/zavřeno v čtvrtek/.test(openIssue(trh, 4, 9 * 60) || '')) fail('openIssue: ve čtvrtek má hlásit zavřeno');
if (!/otvírají/.test(openIssue(trh, 3, 6 * 60) || '')) fail('openIssue: v šest ráno má hlásit, že ještě nemají otevřeno');
if (!/zavřeno/.test(openIssue(trh, 3, 15 * 60) || '')) fail('openIssue: v tři odpoledne má hlásit, že už je zavřeno');
if (openIssue({ id: 'x' }, 3, 600) !== null) fail('openIssue: bez dat nesmí nic hlásit');
if (!fails) console.log('OK  čas: hodiny, letní čas, slunce nad Toblachem, otvíračky');

/* --- koridory tras --- */
const { corridorFor, ZONE, smoothPath } = A;
if (ZONE('dol') !== 'dol' || ZONE('cor') !== 'dol' || ZONE('mon') !== 'szk' || ZONE('jih') !== 'jih') fail('ZONE: špatné zařazení regionu');
if (corridorFor('szk', 'szk') !== null) fail('corridorFor: uvnitř regionu nemá koridor vracet');
const cor = corridorFor('dol', 'cb');
if (!cor || cor.length < 5) fail('corridorFor: chybí obrácený koridor Dolomity → domů');
if (cor && Math.abs(cor[0][0] - 46.75) > 0.2) fail('corridorFor: obrácený koridor nezačíná na jihu');
if (!/^M[\d.]+,[\d.]+ Q/.test(smoothPath([{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 9, y: 1 }]))) fail('smoothPath: nečekaný tvar');
if (!fails) console.log('OK  koridory: zóny, oba směry, plynulá čára');

/* --- překvap mě: deterministicky se seedovanou náhodou --- */
const { surpriseDay, MOODS, tripBadges } = A;
let seed = 7;
const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
Object.keys(MOODS).forEach(mood => {
  const ids = surpriseDay(mood, [47.85, 13.35], rnd);
  if (ids.length < 2) { fail('surpriseDay ' + mood + ': vrátil jen ' + ids.length + ' míst'); return; }
  const its = ids.map(id => ITEMS.find(x => x.id === id));
  if (its.some(i => !i)) fail('surpriseDay ' + mood + ': neznámé id');
  if (new Set(ids).size !== ids.length) fail('surpriseDay ' + mood + ': místo se opakuje');
  if (its.some(i => i.nik < 4)) fail('surpriseDay ' + mood + ': nabídl místo pod 🌿 4');
  const kempIdx = its.findIndex(i => i.cat === 'kemp');
  if (kempIdx !== -1 && kempIdx !== its.length - 1) fail('surpriseDay ' + mood + ': kemp není poslední');
  /* den nesmí být rozházený po celé republice */
  for (let i = 1; i < its.length; i++) {
    if (A.hav(its[0].ll, its[i].ll) > 60) fail('surpriseDay ' + mood + ': zastávka je ' + Math.round(A.hav(its[0].ll, its[i].ll)) + ' km od první');
  }
});
if (surpriseDay('neexistuje', null, rnd).length !== 0) fail('surpriseDay: neznámá nálada má vrátit prázdno');
if (!fails) console.log('OK  překvap mě: tři nálady, 🌿 4+, kemp poslední, drží pohromadě');

/* --- odznaky --- */
const fakeP = { days: [{ rows: [{ it: ITEMS.find(i => i.id === 'v15'), arrive: 8 * 60 }], drive: 120, dur: 150 }] };
const badges = tripBadges(fakeP, ['v15', 'b1', 'b3', 'b6']);
if (!badges.some(b => /Braies před devátou/.test(b.t))) fail('tripBadges: chybí odznak za ranní Braies');
if (!badges.some(b => /pekáren/.test(b.t))) fail('tripBadges: chybí odznak za pekárny');
if (tripBadges({ days: [] }, []).length !== 0) fail('tripBadges: prázdný plán nemá dávat odznaky');
if (!fails) console.log('OK  odznaky: počítají se z plánu, prázdný plán nic nedostane');

/* --- exporty --- */
const { buildICS, buildGPX, icsEscape } = A;
const t0 = Date.UTC(2026, 7, 13, 6, 45);
const ics = buildICS([{ start: t0, end: t0 + 45 * 60000, title: 'Braucommune; Freistadt', desc: 'pivo\nod 1777', loc: 'Freistadt' }], t0);
if (!/^BEGIN:VCALENDAR\r\n/.test(ics) || !/END:VCALENDAR\r\n$/.test(ics)) fail('buildICS: chybí obálka kalendáře');
if (!ics.includes('DTSTART:20260813T064500Z') || !ics.includes('DTEND:20260813T073000Z')) fail('buildICS: špatná časová razítka');
if (!ics.includes('SUMMARY:Braucommune\\; Freistadt')) fail('buildICS: středník se nezaescapoval');
if (!ics.includes('DESCRIPTION:pivo\\nod 1777')) fail('buildICS: nový řádek se nezaescapoval');
if (ics.split('\r\n').some(l => l.length && !/^[A-Z]/.test(l) && !l.startsWith(' '))) fail('buildICS: řádek nezačíná klíčem');
if (icsEscape('a,b;c\\d') !== 'a\\,b\\;c\\\\d') fail('icsEscape: špatné escapování');
const gpx = buildGPX([{ name: 'Den 1 & 2', pts: [{ lat: 48.51, lng: 14.5012, name: 'Freistadt <test>' }] }]);
if (!/^<\?xml/.test(gpx) || !gpx.includes('</gpx>')) fail('buildGPX: chybí obálka');
if (!gpx.includes('<wpt lat="48.51000" lon="14.50120">')) fail('buildGPX: chybí waypoint');
if (!gpx.includes('<trk><name>Den 1 &amp; 2</name>')) fail('buildGPX: název trasy se nezaescapoval');
if (!gpx.includes('Freistadt &lt;test&gt;')) fail('buildGPX: název bodu se nezaescapoval');
if (buildGPX([]).includes('<trk>')) fail('buildGPX: prázdný vstup nemá dělat trasu');
if (!fails) console.log('OK  exporty: ICS s CRLF a escapováním, GPX s body i trasou');

if (fails) { console.error('\n' + fails + ' chyb.'); process.exit(1); }
console.log('\nVŠE OK');
