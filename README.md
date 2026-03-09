https://migration-atlas.vercel.app

# Migration Atlas

An interactive visualization of European bird migration flyways. Watch five species flow across ancient routes — north in spring, south in autumn — with real geographic context including coastlines, country labels, migration bottlenecks, and major cities.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Features

- **Seasonal animation** — scrub through the full year or watch it play
- **Species filtering** — click legend items to isolate individual species
- **Hover tooltips** — inspect individual flocks for position and status
- **Geographic context** — TopoJSON coastlines, country/sea labels, lat/lon grid, city markers
- **Migration bottlenecks** — Strait of Gibraltar, Bosphorus, Messina, Falsterbo marked
- **Playback controls** — 0.5×, 1×, 2×, 4× speed

## Species

| Species | Route |
|---|---|
| Barn Swallow | Sub-Saharan Africa → Europe via 3 flyways |
| White Stork | Western (Gibraltar) and Eastern (Bosphorus) routes |
| Arctic Tern | Atlantic coast, longest migration of any bird |
| European Bee-eater | Africa → Southern Europe via 3 corridors |
| Common Crane | Iberia/Turkey → Scandinavia |

## Data

Currently uses simulated flock positions along real flyway corridors. The natural next step is integrating actual observation data from [eBird](https://ebird.org/) or GPS tracking from [Movebank](https://www.movebank.org/).

## Stack

- React 18
- Vite
- Canvas 2D (no dependencies beyond React)
- [world-atlas](https://github.com/topojson/world-atlas) TopoJSON (loaded from CDN at runtime)

## Build

```bash
npm run build
```

Output goes to `dist/`. Deploy anywhere that serves static files.
