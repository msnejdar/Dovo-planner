# Jezera pro dva

**Živě: https://dovolena1.vercel.app**

Plánovač 1–5denní cesty VW Californií z Českých Budějovic: jezera
Salzkammergutu a od 4 dnů i severní Itálie — Pustertal, Lago di Braies,
Misurina, Cortina.

Jednosouborová aplikace bez závislostí — `index.html` a nic víc. Vercel
ji nasazuje z větve `main` při každé změně; lokálně stačí ten soubor
otevřít v prohlížeči.

## Co umí

- **Objevuj** — 93 ověřených míst v 6 kategoriích (koupání, kempy, výlety,
  farmy & nákup, pekárny & kavárny, oběd), filtry podle regionu, rubrika
  🌿 Pro Nikolu.
- **Mapa** — vlastní vektorová mapa z reálných souřadnic. Tři pohledy
  (celá cesta / Salzkammergut / Dolomity), přibližování prstem i kolečkem,
  u každého úseku km a čas jízdy, klik na bod otevře bublinu s detailem.
  Vyber den a mapa se sama přepne do správného regionu a přiblíží na něj.
  Dlouhé přejezdy vedou přes skutečná města na trase, ne vzdušnou čarou.
- **Plán** — hotové návrhy na 3/4/5 dní (4 a 5 vedou do Dolomit), chytré
  řazení zastávek, přetahování prstem, časy jízdy a program u každého dne.
- **Časy a otvíračky** — zadáš datum a hodinu odjezdu a u každé zastávky
  uvidíš, v kolik tam budeš. Když má podnik zrovna zavřeno nebo dorazíš
  mimo otvírací dobu, appka to napíše. K tomu východ a západ slunce,
  nálada dne a předpověď počasí.
- **Navigace** — každý den i každé místo jde poslat jedním klikem do
  Google Maps; trasa dne se zastávkami se poskládá sama.
- **Dnes** — režim na cestu: velké karty aktuálního dne, odškrtávání
  a lišta, která navádí na nejbližší nesplněnou zastávku.
- **Zábava** — tlačítko *Překvap mě* poskládá den podle nálady, k tomu
  statistiky, odznaky za dobře postavený plán a karta cesty jako obrázek
  na poslání do rodiny.
- **Rozpočet** — noclehy a vstupy z plánu, nafta, dálniční známka
  i alpská mýta (ceníky 2026).
- **Sbalit** — checklist pro kempování v Californii.

Výběr, plán i checklist se ukládají samy přímo v prohlížeči (localStorage)
— nic se nezakládá, příště pokračuješ, kde jsi skončila. Tlačítko
**📤 Poslat plán** zabalí celý plán do odkazu a otevře sdílení na
telefonu; komu odkaz přijde, tomu se plán po otevření nabídne k načtení.
Appku jde přidat na plochu telefonu a funguje i bez signálu.

Plán jde vyexportovat do kalendáře (`.ics`), do navigace (`.gpx`) nebo
vytisknout.

## Vývoj

Struktura souboru: první `<script>` jsou čistá data + geometrie + logika
(bez DOM, testovatelné), druhý `<script>` je UI. Projektový brief pro AI
asistenty je v `CLAUDE.md`.

```bash
node test/geo.test.js    # data, geometrie mapy, časy, exporty, generátor dnů
node test/smoke.test.js  # oba skripty se vyhodnotí nad stubem DOM
```

Fakta o místech (existence, souřadnice, hodnocení, otvíračky, ceny,
mýta) byla ověřována web searchem k 13. 8. 2026 — detaily a známé
korekce jsou v `CLAUDE.md`.
