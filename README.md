# Jezera pro dva

Plánovač 1–5denní cesty VW Californií z Českých Budějovic: jezera
Salzkammergutu a od 4 dnů i severní Itálie — Pustertal, Lago di Braies,
Misurina, Cortina.

Jednosouborová aplikace bez závislostí: otevři
**`index.html`** v prohlížeči a je to.

## Co umí

- **Objevuj** — 93 ověřených míst v 6 kategoriích (koupání, kempy, výlety,
  farmy & nákup, pekárny & kavárny, oběd), filtry podle regionu, rubrika
  🌿 Pro Nikolu.
- **Mapa** — vlastní vektorová mapa z reálných souřadnic, tři pohledy
  (celá cesta / Salzkammergut / Dolomity), trasy po dnech s číslovanými
  zastávkami a kilometry.
- **Navigace** — každý den i každé místo jde poslat jedním klikem do
  navigace Google Maps (trasa se zastávkami dne se generuje automaticky).
- **Plán** — hotové návrhy na 3/4/5 dní (4+5 vedou do Dolomit), chytré
  řazení zastávek, časy jízdy a program u každého dne.
- **Rozpočet** — noclehy a vstupy z plánu, nafta, dálniční známka i alpská
  mýta (ceníky 2026).
- **Sbalit** — checklist pro kempování v Californii.

Výběr, plán i checklist se ukládají samy přímo v prohlížeči (localStorage)
— nic se nezakládá, příště pokračuješ, kde jsi skončila. Tlačítko
**📤 Poslat plán** zabalí celý plán do odkazu a otevře sdílení na
telefonu; komu odkaz přijde, tomu se plán po otevření nabídne k načtení.

## Vývoj

Struktura souboru: první `<script>` jsou čistá data + geometrie (bez DOM,
testovatelné), druhý `<script>` je UI. Projektový brief pro AI asistenty
je v `CLAUDE.md`.

Test (syntax, integrita dat, geometrie mapy):

```bash
node test/geo.test.js
```

Fakta o místech (existence, souřadnice, hodnocení, otvíračky, ceny,
mýta) byla ověřována web searchem k 13. 8. 2026 — detaily a známé
korekce jsou v `CLAUDE.md`.
