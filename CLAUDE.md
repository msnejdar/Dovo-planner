# Salzkammergut plánovač — projektový brief pro Claude Code

Ulož tento soubor jako `CLAUDE.md` do kořene projektu vedle `salzkammergut-planovac.html`
(aktuální funkční verze v4 — NIKDY ji nepřepisuj bez zachování všech funkcí níže).

## Kontext

Interaktivní plánovač 1–5denní cesty starším VW California z Českých Budějovic
k jezerům v Salzkammergutu. Primární uživatelka je Nikola — kuchařka, miluje bio
a lokální jídlo, nesnáší komerční přelidněná místa, chce klid. Je těhotná, takže:
výlety max 10 km po rovině, žádný solný důl (Salzwelten těhotné nepouští),
žádné klettersteigy (Drachenwand jen jako kulisa), pozor na horko a dlouhé etapy.
Druhý uživatel řídí a platí — rozpočet a kilometry ho zajímají.

## Co v4 už umí (zachovat vše)

- 5 záložek: Objevuj (katalog 51 míst, filtry kategorie/region/🌿 Pro Nikolu/♥),
  Mapa (vlastní vektorová mapa z reálných souřadnic), Plán (dny 1–5),
  Rozpočet, Sbalit (checklist).
- Kategorie: Koupání, Kempy & noclehy, Výlety, Farmy & nákup, Na oběd.
- Mapa: jezera jako polygony z lat/lng, ekvirektangulární projekce
  (KX=1428.4, KY=2124, LNG0=13.20, LATT=47.98, viewBox 1000×1045),
  body vytlačované z vody (point-in-polygon + posun od centroidu),
  rozhrnutí překryvů, ♥ markery pro vybraná místa v barvě kategorie,
  klik na bod → panel s hodnocením, odkazy a tlačítky Den 1–5,
  přepínač tras: Nic / Celá cesta / Den N (s číslovanými zastávkami).
- Chytré řazení: nové místo se vloží na pozici s nejmenším objezdem
  (kemp vždy poslední), 🪄 tlačítko = nearest-neighbour přerovnání všech dnů
  řetězově od ČB; kotva dne = poslední místo předchozího dne.
- Časy: každé místo má `dur` (min na místě); přejezdy = haversine × 1,6
  s rychlostí dle délky (34/50/62 km/h); ČB legs z tabulky FROM_CB;
  ranní přejezd mezi dny + návrat 🏠 do ČB; souhrn dne (🚐 čas · km · ⏱ program,
  přes 10 h = „nabitý den!"); km z plánu → tlačítko „použít" v rozpočtu.
- Data u míst: `ll` (ověřené souřadnice), `t` obec, `gr` [★ Google, počet
  hodnocení — reálná data z 13. 8. 2026], `nik` 1–5 + `nn` poznámka,
  `price`, `night` €/noc pro dva, `pp` vstup €/os, `web`, `q` (Google query),
  `walk`, `desc`. Odkazy: Google Maps (query), Mapy.cz
  (`/fnc/v1/showmap?mapset=outdoor&center=lng,lat&zoom=16&marker=true`),
  📍 mini-mapa (výřez vektorové mapy + 1km měřítko).
- Přednastavené itineráře TPL 3/4/5 dní laděné pro Nikolu (farmy, malé kempy,
  Hallstatt jen ráno) — editovatelné, načítají se s potvrzením.
- Persistence: klíč `salzkammergut-planner-v1`, kaskáda
  window.storage (Claude app) → localStorage (běžný prohlížeč) → paměť.
  NEROZBIJ uložený stav — při změně schématu napiš migraci.
- Design „barevná Kodaň": papír #F6F0E1, inkoust #201D17, panel #FFFDF6,
  kategorie #1D7A99 / #2F7D4F / #DFA320 / #D95A34 / #C2497F, fonty
  Fraunces (display) + Karla, vynucený světlý režim (meta color-scheme,
  html/body !important, .bgfix vrstva) — Claude app jinak stránku ztmaví.
- Tisk: @media print ukáže jen plán + rozpočet.

## Tvrdé zásady

1. **Žádná vymyšlená místa ani čísla.** Každé nové místo ověř web searchem:
   existence, souřadnice, Google hodnocení + počet, otvíračka, cena.
   Když něco neověříš, popiš to obecně a označ „ověř".
2. **Češtině bez vaty.** Popisky 1–2 věty, konkrétní, žádná infantilní
   přirovnání, minimum ukazovacích zájmen. Drž tón stávajících karet.
3. **Uvnitř Claude appky nefungují externí obrázky ani mapové dlaždice.**
   Vektorová mapa je proto základ a musí zůstat plně funkční fallback.
4. Jedno-souborová distribuce pro Claude app musí jít vždy vygenerovat.
5. Po každé změně: `node --check` na extrahovaný JS + geometrický test
   (všech N bodů: v rámu, mimo vodu, bez překryvů < 9 px) — vytvoř
   `test/geo.test.js` podle logiky v souboru a pouštěj ho.

## Backlog (v pořadí priorit)

### P0 — Víc míst (cíl ~75–85 celkem)
Kandidáti k ověření a doplnění (NEJDŘÍV každý ověř — existence, ll, ★, hodiny):
- Koupání: Fürberg (St. Gilgen), Strandbad Weyregg, Seebad Litzlberg,
  Strandbad Unterach, Nussensee (Bad Ischl), Offensee, Almsee (Grünau —
  koupání zakázáno? ověř, případně jen výlet), Hinterer Langbathsee.
- Výlety ≤10 km po rovině: Traunkirchen + Johannesberg, Almsee okruh,
  Offensee okruh, Chorinskyklause od Bad Goisern, Ewige Wand (jen vyhlídková
  cesta autem?), Katrin Seilbahn (Bad Ischl), Zwölferhorn (St. Gilgen),
  Pötschenpass vyhlídka, promenáda Seewalchen–Kammer (Gustav Klimt stezka).
- Farmy & nákup: Bauernmarkt Bad Ischl (Kreuzplatz — den konání ověř!),
  Gmundner Milch prodejna, uzená ryba na Attersee (Fischerei — najdi konkrétní),
  Hand.Werk.Haus Bad Goisern, další samoobslužné Hofladeny z gohofladen.at
  v regionu, sýrárny kolem Wolfgangsee.
- Na oběd: Steegwirt (Bad Goisern), Gasthof Fürberg, Jausenstation
  u Langbathsee, Langbathseestüberl?, něco slušného v Gmunden a Unterach.
- U všeho doplň `nik` podle rubriky níže + `dur` + zařazení do regionu
  (případně přidej region `goisern`, pokud přibude víc míst u Bad Goisern).

### P1 — UX
- Nahraď `confirm()` inline potvrzením (v Claude app se dialogy někdy neukážou).
- Drag & drop řazení v plánu (touch-friendly, ponech i šipky).
- Sdílení stavu: serializace plánu do URL hashe (načtení s dotazem).
- Export: GPX trasy dne/celé cesty (pro navigaci), .ics událostí dnů,
  vylepšený tisk (trasa dne jako mini-mapa).
- „Dnes" režim: vyber aktivní den → velké karty zastávek, odškrtávání,
  tlačítko Navigovat (geo: URI / Google Maps directions na další zastávku).

### P2 — Nasazená verze (mimo Claude app)
- Progressive enhancement: zkus Leaflet + OSM dlaždice (detekce tileload
  s timeoutem jako dřív) → když projdou, skutečná mapa; jinak vektor.
  Marker = L.circleMarker/SVG divIcon, žádné externí PNG.
- Reálné časy jízdy přes OSRM (router.project-osrm.org, bez klíče) s cache
  a fallbackem na současný odhad; přepočítej FROM_CB i mezietapy.
- Počasí: Open-Meteo (bez klíče) — teplota vzduchu + předpověď pro každé
  jezero, teplotu vody neuváděj z API (není), nech textové odhady.
- PWA: manifest + service worker (offline u jezer bez signálu).
- Fotky: NIKDY nehotlinkovat z Google (ToS). Volitelně Google Places API
  s vlastním klíčem (Place Photos), jinak nech odkazy.
- Deploy na Vercel (uživatel má účet), doména dle domluvy.

### P3 — Detaily
- Křivky tras (kvadratické Béziery) místo úseček, ať nekříží jezera natvrdo.
- Otvíračky u míst, kde jsou ověřené, + badge „dnes otevřeno".
- Mini-mapa pro Freistadt (bod je v rámu jen sponou) — udělej speciální výřez.
- Rozpočet: pole „ostatní výdaje", volitelný přepočet vinětou za den.
- Accessibility: aria-live pro změny plánu, focus management v panelu mapy.

## Rubrika 🌿 Pro Nikolu (drž konzistenci)
- 5 = bio farma / tichá příroda / zdarma nebo symbolicky, žádné davy
- 4 = klidné, lokální, snese víkendový provoz
- 3 = fajn, ale komerční nebo rodinné rušno
- 2 = davy, fronty, suvenýry, drahé atrakce (Hallstatt poledne, Schafbergbahn)
- 1 = nepoužívat (rovnou nezařazuj)
Poznámka `nn` = 3–8 slov, proč. Body dolů: vstupné za podívanou, hluk silnice,
autobusové zájezdy. Body nahoru: samoobsluha na důvěru, senné mléko, ticho.

## Známé opravy z ověřování (nech v datech)
Klausner-Höll 2,7★ (hrubá recepce — v popisu narovinu), Schafbergbahn ~61 €/os,
Badeplatz Stöllinger (Fuschl) soukromý ~6 €/os, Weslhof víkendy zavřeno,
Gasthof Drachenwand zavřeno po–st, Braucommune v neděli zavřeno,
Rindbach parkovné až 12 €/den, Camping park am See jen hotovost + noční klid.

## První úkol

1. Načti `salzkammergut-planovac.html`, zmapuj strukturu, vytvoř
   `test/geo.test.js` a rozběhni ho.
2. Navrhni strukturu projektu (doporučeno: `places.json` + build skript,
   který generuje jednosouborovou verzi pro Claude app i nasazenou verzi).
3. Pak jeď backlog po prioritách; po každém bloku commit + krátké shrnutí
   co je ověřené a co zbývá.
