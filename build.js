#!/usr/bin/env node
/* Build pro Vercel: vloží klíč k mapám z proměnné prostředí do stránky.
 *
 * Stránka je statická, takže se k serverové proměnné jinak nedostane.
 * V repozitáři zůstává jen zástupný text __GMAPS_KEY__ — klíč se nikdy
 * necommituje. Když proměnná chybí (běh lokálně), zástupný text zůstane
 * a plánovač se sám přepne na kreslenou mapu.
 *
 * Klíč skončí ve zdroji stránky, což je u Map Google normální a jinak to
 * ani nejde — chrání se omezením na doménu v Google Cloud Console.
 */
const fs = require('fs');
const path = require('path');

const KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || '';
const file = path.join(__dirname, 'planovac', 'index.html');

let html = fs.readFileSync(file, 'utf8');
const before = (html.match(/__GMAPS_KEY__/g) || []).length;

if (!KEY) {
  console.log('build: klíč k mapám není nastavený — nechávám kreslenou mapu (' + before + ' zástupných textů beze změny)');
  process.exit(0);
}
if (!before) {
  console.log('build: v souboru není zástupný text __GMAPS_KEY__, nic neměním');
  process.exit(0);
}
if (!/^[A-Za-z0-9_\-]{20,}$/.test(KEY)) {
  console.error('build: klíč nevypadá jako klíč Google (délka ' + KEY.length + ') — nevkládám ho');
  process.exit(1);
}

html = html.split('__GMAPS_KEY__').join(KEY);
fs.writeFileSync(file, html);
console.log('build: klíč k mapám vložen na ' + before + ' místech');
