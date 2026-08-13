# Jezera pro dva — plánovač Salzkammergut & Dolomity (brief pro Claude Code)

Jednosouborový plánovač `index.html` (aktuálně **v9**).
NIKDY nepřepisuj bez zachování všech funkcí níže. Po každé změně pusť
`node test/geo.test.js`.

**Nasazení:** https://dovolena1.vercel.app — Vercel je napojený na
GitHub a staví z větve `main` při každém pushi. Žádný build krok,
statický soubor. Uložené plány visí na doméně (localStorage), takže
adresu neměň — jinak lidem zmizí rozpracované plány.

## Kontext

Interaktivní plánovač 1–5denní cesty starším VW California z Českých Budějovic
k jezerům Salzkammergutu a nově (v5) přes Korutany do Dolomit (Pustertal,
Braies, Misurina, Cortina). Primární uživatelka je Nikola — kuchařka, miluje
bio a lokální jídlo, nesnáší komerční přelidněná místa, chce klid. Je těhotná:
výlety max 10 km po rovině, žádný solný důl, žádné klettersteigy, pozor na
horko, dlouhé etapy a nadmořskou výšku (Tre Cime 2 320 m = jen rovinka
Auronzo→Lavaredo, pomalu). Druhý uživatel řídí a platí — rozpočet a kilometry
ho zajímají.

## Co v6–v9 přidalo (zachovat vše)

- **Mapa**: zoom a posun (pinch, tažení, kolečko, dvojklik, tlačítka),
  stav zvlášť pro každý pohled v `ZOOM`. Velikosti bodů a písma se
  zadávají v **pixelech obrazovky** — `zsc()` vrací poměr viewBoxu ke
  skutečné šířce, takže značky na mobilu nezdrobní a při zoomu nerostou.
  Popisky se ořezávají do `visRect()` a rozestrkávají proti kolizím.
  Každý úsek má popisek „25 km · 30 min"; výběr dne přepne pohled
  (`viewForDay`) a přiblíží (`fitToDay`). Filtry kategorií nad mapou
  (`mapCat`, `mapVisible`). Detail místa je **bublina u bodu**
  (`selectPlace`/`positionBubble`), ne panel pod mapou.
- **Koridory**: dlouhé přejezdy v přehledu vedou přes ověřená města na
  skutečné trase (`CORRIDORS`, `legGeom`), ne vzdušnou čarou.
- **Časy**: `S.start = {date, dep}`; `calcPlan()` počítá u každé zastávky
  `arrive`/`leave`, den má `date`, `dow` a `sun`. Otvíračky jsou
  v tabulce `HOURS` (přiřazují se do ITEMS při startu), kontroluje
  `openIssue()`. Slunce počítá `sunTimes()` (NOAA) s evropským letním
  časem (`euOffsetMin`). Nálada dne `dayMood()`, pásek `#tripbar`
  s odpočtem do odjezdu.
- **Zábava**: `surpriseDay(mood, anchorLL, rnd)` — náhoda jde zvenčí,
  aby šla testovat; `tripBadges()`; statistiky v `renderTripStats()`;
  karta cesty `tripCardSvg()` → PNG přes canvas a `navigator.share`.
- **Dnes**: šestá záložka, velké karty dne, odškrtávání do `S.done`,
  lišta „Jedeme →" na nejbližší nesplněnou zastávku, den se vybere
  podle data (`todayIndex`).
- **Exporty**: `buildICS()` (CRLF, escapování, převod na UTC podle
  letního času) a `buildGPX()`; přetahování zastávek za úchyt `.grip`
  přes pointer events (myš i prst).
- **PWA a počasí**: `manifest.webmanifest`, `icon.svg`, `sw.js` (síť
  napřed, při výpadku cache). Předpověď z Open-Meteo jedním dotazem pro
  všechny dny; bez sítě se tiše neukáže nic (`loadWeather`, `wmoText`).
- Soubory `sw.js`/`manifest.webmanifest`/`icon.svg` jsou **volitelné** —
  když chybí (jednosouborová distribuce), appka funguje dál.

## Co v5 umí (zachovat vše)

- 6 záložek: Objevuj (katalog **93 míst**, filtry kategorie/regionu/🌿 Pro
  Nikolu/♥), Mapa, Plán (dny 1–5), Dnes, Rozpočet, Sbalit (checklist).
- **6 kategorií**: Koupání, Kempy & noclehy, Výlety, Farmy & nákup,
  **Pekárny & kavárny** (v5, klíč `pek`, barva `#8A5A33`), Na oběd.
- **13 regionů**: 10× Salzkammergut (v5 přibyl `goi` Bad Goisern) +
  `jih` (Cesta na jih: Lienz, Millstätter See, Weissensee, Loacker),
  `dol` (Pustertal & Braies), `cor` (Cortina & Misurina).
- **Mapa se třemi pohledy** (v5): `all` Celá cesta (ČB → jezera → Dolomity,
  rámečky regionů jsou klikací a přepnou detail, km popisky na dlouhých
  přejezdech, 🏠 ČB), `szk` Salzkammergut (rám v4 — neměnit), `dol` Dolomity.
  Vše čistá ekvirektangulární projekce z reálných souřadnic (engine
  `mkView`/`fitView` v prvním `<script>`), body vytlačované z vody
  (point-in-polygon), rozhrnutí překryvů v detailních pohledech, ♥ markery,
  klik na bod → panel s hodnocením, odkazy a Den 1–5; trasy: Nic / Celá
  cesta / Den N s číslovanými zastávkami a 🚐 na startu; legy jsou jemné
  Bézierovy křivky, přejezdové čárkované a animované (respektuje
  `prefers-reduced-motion`); leg do jiného pohledu vede k okraji rámu
  (EXITPT).
- **Navigace Google (v5)**: každé místo má 🧭 Navigovat
  (`navUrl` — directions z aktuální polohy); každý den má 🧭 v Plánu
  i v liště pod mapou (`gnavUrl` — origin = domov/včerejší kemp,
  waypoints = zastávky (max 9, pak se ořízne), destination = poslední
  místo / domů). Lišta `#routeInfo` ukazuje čas/km/program vybraného dne.
- Chytré řazení: vložení s nejmenším objezdem (kemp vždy poslední),
  🪄 nearest-neighbour přes všechny dny, kotva dne = poslední místo
  předchozího dne.
- Časy: `dur` na místě; přejezdy haversine ×1,6 (nad 100 km vzdušně ×1,8 —
  alpská oklikovost) s rychlostí 34/50/62/72 km/h dle délky; ČB legy z
  `FROM_CB` (v5 ověřeno OSRM: Toblach 462 km/5:57 přes Felbertauern);
  ranní přejezd mezi dny + návrat 🏠; souhrn dne, přes 10 h = „nabitý den!".
  Sdílený výpočet `calcPlan()` používá plán, mapa i rozpočet.
- Data u míst: `ll` (ověřené souřadnice — Nominatim/oficiální zdroje),
  `t` obec, `gr` [★ Google, počet] kde se podařilo ověřit (jinak vynecháno
  — UI pak ukáže jen odkaz), `nik` 1–5 + `nn`, `price`, `night` €/noc pro
  dva, `pp` vstup €/os (u poplatků za auto je pp = polovina, protože
  rozpočet násobí ×2 — viz Braies, Tre Cime, Plätzwiese), `web`, `q`,
  `walk`, `desc`. Odkazy: Google Maps (query; Itálie dostává „Italien"
  dle regionu — `CNTRY`), Mapy.cz, 📍 mini-mapa (v5: lokální projekce
  se středem v místě, funguje všude vč. Freistadtu).
- Přednastavené itineráře TPL 3/4/5: 3 dny = jezera; **4 a 5 dní jedou
  přes Millstätter See do Dolomit** (Braies brzy ráno kvůli rezervacím,
  pekárna na start dne, kemp poslední). Načtení s **inline potvrzením**
  (žádný `confirm()` — v Claude appce se dialogy neukážou) a auto-syncem
  km do rozpočtu + zapnutím alpského mýta.
- Rozpočet: noclehy/vstupy z plánu, nafta, jídlo, známka 12,80 € (2026),
  **alpské mýto 28,50 €** tam i zpět (Felbertauern 13,50 € + A10 Tauern
  15 €, ceníky 2026), rezerva, kurz.
- Persistence: klíč `salzkammergut-planner-v1`, kaskáda window.storage →
  localStorage → paměť. NEROZBIJ uložený stav — při změně schématu migrace.
  (v5 přidal jen `S.alp`; merguje se bez migrace.)
- **Sdílení plánu (v5.1)**: 📤 Poslat plán v záložce Plán — celý stav
  (dny, ♥, mýta, vstupy rozpočtu) se zabalí do base64url v `#p=` a pošle
  nativním share sheetem (`navigator.share`), fallback schránka → ruční
  kopie. Příjemci se po otevření ukáže inline banner `#incoming`
  s tlačítky Načíst/Nechat (žádný confirm). Kodek `encodePlanData`/
  `decodePlanData` je čistý (script #1, kryto testem); příchozí data se
  filtrují přes `byId`, ať neznámá id nespadnou.
- Design „barevná Kodaň", vynucený světlý režim, tisk = jen plán + rozpočet.
- Struktura souboru: **první `<script>` je čistý** (data + geometrie, bez
  DOM, exportuje `APP_PURE`) — testovatelný v Node; druhý `<script>` = UI.

## Co v10 přidalo

- **Přidávání na jeden klik**: v Objevuj je lepivý pásek „Přidávám do"
  s dny 1–5 (`S.addDay`, `activeDay()`); každá karta má jedno velké
  tlačítko `data-quick`, které místo do toho dne přidá nebo zase vyndá.
  `⋯` otevře výběr jiného dne. Stejné tlačítko je i v bublině na mapě.
- **Řazení katalogu** (`SORTS`, `fSort`): 🌿 můj tip · ★ hodnocení ·
  📍 nejblíž vybranému dni (od poslední zastávky, `dayAnchorTail`) ·
  A→Z · ⏱ nejkratší. Výchozí je 🌿.
- **Přesun mezi dny**: v plánu tlačítko „den" u zastávky (`data-moveopen`
  / `data-moveto`), vloží se přes `insertSmart`, tedy zase na rozumné
  místo. Na telefonu (≤560 px) se skryjí šipky ↑↓ — nahrazuje je úchyt
  na přetažení a tohle tlačítko.
- **Odkazy ke čtení**: tabulka `WEBS` doplňuje `web` u míst bez vlastní
  stránky (oficiální stránka obce, provozovatele nebo článek
  turistického portálu). Odkazy na Mapy.cz jsou pryč, zůstal Google.
- Opravy z auditu: `pruneDone()` čistí odškrtnutí u míst, která už
  v plánu nejsou; `syncAlp()` zapne alpské mýto podle italských zastávek
  v plánu, ne jen podle šablony; počasí se dotáhne i po dodatečném
  vyplnění data; lišta pod mapou hlásí, kolik zastávek se nevejde do
  devítimístného limitu Google navigace.

- **Nápověda (v11)**: tabulka `HELP` (klíč → [nadpis, HTML text]) a
  `q('klic')` vloží kolečko `?`. Jeden sdílený popover se drží u tlačítka
  (`position:fixed`, ořezaný do okna), zavírá ho křížek, klik vedle,
  Esc nebo scroll. Texty vysvětlují hlavně to, co jinak není vidět —
  odkud se čísla berou a co je ověřené a co odhad. **Když přidáš prvek,
  který počítá nebo hádá číslo, přidej k němu i otazník.**

## Tvrdé zásady

1. **Žádná vymyšlená místa ani čísla.** Každé nové místo ověř web searchem:
   existence, souřadnice, Google hodnocení + počet, otvíračka, cena.
   Když něco neověříš, popiš to obecně a označ „ověř". Google počty recenzí
   z agregátorů ber jako spodní odhad; kde nešly ověřit, `gr` vynech.
2. **Čeština bez vaty.** Popisky 1–2 věty, konkrétní, žádná infantilní
   přirovnání. Drž tón stávajících karet.
3. **Uvnitř Claude appky nefungují externí obrázky ani dlaždice.**
   Vektorová mapa je základ a musí zůstat plně funkční.
4. Jedno-souborová distribuce musí jít vždy vygenerovat (teď = ten soubor).
5. Po každé změně pusť **oba** testy — žádné dialogy `confirm()`/`alert()`:
   - `node test/geo.test.js` — syntax obou skriptů, integrita dat,
     body v rámu / mimo vodu / bez překryvů, gnavUrl, sdílení, časy,
     otvíračky, slunce, koridory, generátor dnů, odznaky, ICS/GPX, počasí.
   - `node test/smoke.test.js` — oba skripty se vyhodnotí nad stubem DOM
     (chytá překlepy a ReferenceError, které v prohlížeči končí bílou
     stránkou).

## Ověřená fakta 2026 (nech v datech)

- **Braies**: 1.7.–15.9. vjezd 9–16 h jen s rezervací (prags.bz); online
  rezervace parkoviště P4 u jezera jen pro vozidla do 2 m — California se
  zvednutou střechou tam neprojde (fyzická závora), obytňák = P1 ~49 €
  nebo přijet před 9:00. Koupání zakázáno. Loďky 20 €/os./45 min.
- **Hallstatt Skywalk a Salzwelten**: po roční přestavbě Salzbergbahn
  otevírají až **1. 9. 2026** — v srpnu se nahoru nedostanete (v datech
  jako `warn` u `v8`, vstupné odebráno).
- **Tre Cime**: od 2026 povinná online rezervace na SPZ (auronzo.info);
  auto 40 €, kemper 60 €; Auronzo→Lavaredo ~2 km rovina ve 2 320 m.
- **Camping Residence Corones (Rasen) UŽ NEEXISTUJE** — dnes jen apartmány
  (Nancy's). Nezařazovat.
- Camping Rocchetta (Cortina): nebere rezervace, min. 3 noci.
- Camping Toblacher See: příjezdová silnice denně 12–15 h zavřená.
- Camping Brunner (Döbriach): psi zakázáni, v sezóně příjezd jen pá–ne.
- Trh Bruneck = STŘEDA dopoledne (Rathausplatz). Trh Bad Ischl = PÁTEK
  7–12 na **Auböckplatz** (ne Kreuzplatz!).
- Pekárna Gandl (St. Wolfgang) zanikla → dnes **Bäckerei Nahmer** (denně
  od 6:30). Lewandofsky není v Gmundenu (to je Bad Aussee) — na esplanádě
  je **Baumgartner** (čt+pá zavřeno!). Gmundner Molkerei kiosk jen
  po–pá 8–12.
- **Steegwirt je u SEVERNÍHO konce Hallstättersee** (Steeg), ne jižního.
- Mýta 2026: Felbertauern 13,50 € jednosměrně; A10 Tauern+Katschberg
  15,00 €; známka 10 dní 12,80 €. SS49/Pustertal zdarma, v Itálii se
  známka neřeší.
- Winkelkeller (Toblach) 4,5★; Oberraut čt zavřeno, rezervace nutná;
  El Brite de Larieto — rezervace telefonem, jídlo jen do ~18 h.
- Starší opravy v4: Klausner-Höll 2,7★, Schafbergbahn ~61 €/os.,
  Stöllinger ~6 €/os., Weslhof víkendy zavřeno, Gasthof Drachenwand
  zavřeno po–st, Braucommune v neděli zavřeno, Rindbach parkovné až
  12 €/den, Camping park am See jen hotovost + noční klid.

## Backlog (v pořadí priorit)

### P1 — co dává smysl dál
- Doplnit `HOURS` u zbylých podniků (teď jich je 35 z 93) — vždy až po
  ověření, nikdy odhadem.
- Reálné časy jízdy přes OSRM s cache a fallbackem na současný odhad
  (`est()` je odhad z ptačí perspektivy × 1,6–1,8).
- Vylepšený tisk: trasa dne jako mini-mapa vedle rozpisu.
- Rozpočet: pole „ostatní výdaje", přepočet vinětou za den.

### P2 — hezké mít
- Progressive enhancement: Leaflet + OSM dlaždice s fallbackem na vektor.
- Accessibility: aria-live pro změny plánu, focus management v bublině.
- Doplnit `gr` tam, kde je zatím vynecháno (až půjde ověřit přímo z Googlu).
- Fotky: NIKDY nehotlinkovat z Google (ToS).

## Rubrika 🌿 Pro Nikolu (drž konzistenci)
- 5 = bio farma / tichá příroda / zdarma nebo symbolicky, žádné davy
- 4 = klidné, lokální, snese víkendový provoz
- 3 = fajn, ale komerční nebo rodinné rušno
- 2 = davy, fronty, suvenýry, drahé atrakce (Hallstatt poledne, Tre Cime)
- 1 = nepoužívat (rovnou nezařazuj)
Poznámka `nn` = 3–8 slov, proč. Body dolů: vstupné za podívanou, hluk
silnice, autobusové zájezdy. Body nahoru: samoobsluha na důvěru, senné
mléko, ticho.
