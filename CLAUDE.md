# Jezera pro dva — plánovač Salzkammergut & Dolomity (brief pro Claude Code)

Jednosouborový plánovač `salzkammergut-planovac.html` (aktuálně **v5**).
NIKDY nepřepisuj bez zachování všech funkcí níže. Po každé změně pusť
`node test/geo.test.js`.

## Kontext

Interaktivní plánovač 1–5denní cesty starším VW California z Českých Budějovic
k jezerům Salzkammergutu a nově (v5) přes Korutany do Dolomit (Pustertal,
Braies, Misurina, Cortina). Primární uživatelka je Nikola — kuchařka, miluje
bio a lokální jídlo, nesnáší komerční přelidněná místa, chce klid. Je těhotná:
výlety max 10 km po rovině, žádný solný důl, žádné klettersteigy, pozor na
horko, dlouhé etapy a nadmořskou výšku (Tre Cime 2 320 m = jen rovinka
Auronzo→Lavaredo, pomalu). Druhý uživatel řídí a platí — rozpočet a kilometry
ho zajímají.

## Co v5 umí (zachovat vše)

- 5 záložek: Objevuj (katalog **93 míst**, filtry kategorie/regionu/🌿 Pro
  Nikolu/♥), Mapa, Plán (dny 1–5), Rozpočet, Sbalit (checklist).
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
- Design „barevná Kodaň", vynucený světlý režim, tisk = jen plán + rozpočet.
- Struktura souboru: **první `<script>` je čistý** (data + geometrie, bez
  DOM, exportuje `APP_PURE`) — testovatelný v Node; druhý `<script>` = UI.

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
5. Po každé změně: `node test/geo.test.js` (syntax obou skriptů, integrita
   dat, všechny body v rámu / mimo vodu / bez překryvů < 9 px v detailních
   pohledech, tvar gnavUrl). Žádné dialogy `confirm()`/`alert()`.

## Ověřená fakta 2026 (nech v datech)

- **Braies**: 1.7.–15.9. vjezd 9–16 h jen s rezervací (prags.bz); online
  rezervace parkoviště P4 u jezera jen pro vozidla do 2 m — California se
  zvednutou střechou tam neprojde (fyzická závora), obytňák = P1 ~49 €
  nebo přijet před 9:00. Koupání zakázáno. Loďky 20 €/os./45 min.
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

### P1 — UX
- Drag & drop řazení v plánu (touch-friendly, ponech i šipky).
- Sdílení stavu: serializace plánu do URL hashe (načtení s dotazem).
- Export: GPX trasy dne/celé cesty, .ics událostí dnů, vylepšený tisk
  (trasa dne jako mini-mapa).
- „Dnes" režim: velké karty zastávek, odškrtávání, Navigovat na další
  zastávku (základ — gnavUrl — už existuje).
- Otvíračky strojově: badge „dnes otevřeno" (data v `price` už často jsou).

### P2 — Nasazená verze (mimo Claude app)
- Progressive enhancement: Leaflet + OSM dlaždice s fallbackem na vektor.
- Reálné časy jízdy přes OSRM s cache a fallbackem na současný odhad.
- Počasí: Open-Meteo (bez klíče); teplotu vody neuvádět z API.
- PWA: manifest + service worker (offline u jezer).
- Fotky: NIKDY nehotlinkovat z Google (ToS).
- Deploy na Vercel (uživatel má účet).

### P3 — Detaily
- Rozpočet: pole „ostatní výdaje", přepočet vinětou za den.
- Accessibility: aria-live pro změny plánu, focus management v panelu mapy.
- Doplnit `gr` tam, kde je zatím vynecháno (až půjde ověřit přímo z Googlu).

## Rubrika 🌿 Pro Nikolu (drž konzistenci)
- 5 = bio farma / tichá příroda / zdarma nebo symbolicky, žádné davy
- 4 = klidné, lokální, snese víkendový provoz
- 3 = fajn, ale komerční nebo rodinné rušno
- 2 = davy, fronty, suvenýry, drahé atrakce (Hallstatt poledne, Tre Cime)
- 1 = nepoužívat (rovnou nezařazuj)
Poznámka `nn` = 3–8 slov, proč. Body dolů: vstupné za podívanou, hluk
silnice, autobusové zájezdy. Body nahoru: samoobsluha na důvěru, senné
mléko, ticho.
