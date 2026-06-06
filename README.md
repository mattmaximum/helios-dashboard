# Project Helios — Solar Weather Dashboard

A real-time solar weather monitoring dashboard that transforms when geomagnetic storms hit. Built with React 19, TypeScript, and Tailwind CSS v4, pulling live data from NOAA SWPC's public APIs.

**Live:** [mattmaximum.github.io/helios-dashboard](https://mattmaximum.github.io/helios-dashboard/)
**Repository:** [github.com/mattmaximum/helios-dashboard](https://github.com/mattmaximum/helios-dashboard)

---

## What it does

When a G2+ geomagnetic storm arrives (Kp ≥ 6), the entire interface shifts — the background transitions from cool blue-black to a deep crimson temperature over 3 seconds, the header border changes, and the Kp gauge ring pulses faster with each escalating G-scale. Below G2, everything is calm and data-focused.

The idea is that the dashboard should *feel* like space weather, not just display it.

### Features

- **Cinematic storm alert mode** — full app shell transforms at G2+ (Kp ≥ 6), with 3-second background transition
- **KpGauge with pulse animation** — outer glow ring pulses at G2=2s, G3=1.2s, G4/G5=0.6s; needle is always static for readability
- **Live solar wind accent** — Solar Wind MetricCard accent color shifts from teal (<400km/s) to amber (400–600) to orange-red (>600km/s)
- **Share button** — captures the StormAlert card as a PNG (`helios-G3-Kp7.2-2026-06-06.png`) using html-to-image, which correctly renders backdrop-blur and SVG drop-shadows that html2canvas cannot
- **Staggered chart animate-in** — SolarCharts panels cascade into view on load with 120ms stagger
- **Historical charts** — 24h / 72h / 1-week views for Kp, X-ray flux, solar wind speed/density, and IMF (Bz/Bx/By)
- **Auto-refresh** — polls NOAA every 5 minutes via `setInterval`; silent background refresh (no loading spinner interruption)
- **Graceful API fallbacks** — each of the 4 parallel API calls degrades independently to mock data via `Promise.allSettled`, so a failed X-ray endpoint doesn't blank the Kp chart
- **Live NASA SDO imagery** — 171Å, 193Å, 304Å, and magnetogram wavelength selector
- **Accessibility** — all animations respect `prefers-reduced-motion`, G4/G5 degrade to static glow

---

## Data sources

| Data | Source | Update cadence |
|---|---|---|
| Geomagnetic Kp-index | NOAA SWPC planetary K-index | Every 15 min |
| Solar wind plasma (speed, density, temp) | NOAA SWPC 7-day plasma | ~1 min |
| Interplanetary magnetic field (Bx, By, Bz) | NOAA SWPC 7-day magnetometer | ~1 min |
| X-ray flux (GOES-18, 0.1–0.8nm) | NOAA SWPC 6-hour X-ray | 1 min |
| Solar imagery | NASA SDO | ~15 min |

All API calls use `cache: 'no-store'` and are made in parallel with `Promise.allSettled`.

---

## Architecture

```
NOAA SWPC APIs (4 parallel fetches)
  ├── Kp-index  →  getStormLevel(kp)  →  G-scale code, label, color
  ├── Plasma    ┐
  ├── Mag       ├─ merged by timestamp  →  SolarWindData[]
  └── X-ray     →  classifyFlux()  →  GOES class string

fetchSolarData()  →  SolarData
  └─  useSolarData hook (auto-refresh, loading, error state)
       └─  App.tsx  →  isAlert, windAccent  →  components
```

**Storm level state machine:**
```
Kp < 5  →  G0 Quiet
Kp 5–6  →  G1 Minor
Kp 6–7  →  G2 Moderate  ← isAlert activates here
Kp 7–8  →  G3 Strong
Kp 8–9  →  G4 Severe
Kp ≥ 9  →  G5 Extreme
```

`isAlert = getStormLevelNumeric(currentKp) >= 2`

The G-scale thresholds are covered by 28 Vitest unit tests specifically targeting boundary values (4.99/5.0, 5.99/6.0, etc.) — a wrong threshold causes false alarms or missed storms, which are the highest-consequence bugs in this codebase.

---

## Getting started

```bash
git clone https://github.com/mattmaximum/helios-dashboard.git
cd helios-dashboard
npm install

npm run dev      # development server with HMR at localhost:5173
npm run build    # type-check + Vite production build → dist/
npm run preview  # preview the dist/ build locally
npm run test     # run Vitest unit tests
```

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript 6 | Concurrent features, strong type safety |
| Build | Vite 8 | Sub-second HMR, fast production builds |
| Styling | Tailwind CSS v4 | `@theme` directive, no config file needed |
| Charts | Recharts | Composable, SVG-based, works with Tailwind |
| Icons | Lucide React | Tree-shakeable, consistent stroke weight |
| Animations | Pure CSS keyframes | Zero runtime cost, single `prefers-reduced-motion` block |
| Image capture | html-to-image | Correctly renders backdrop-blur + SVG drop-shadows (html2canvas cannot) |
| Tests | Vitest + jsdom | Fast, Vite-native, no separate babel config |
| Deploy | GitHub Actions → GitHub Pages | Builds to `dist/`, artifact upload via `upload-pages-artifact` |

---

## Deployment

GitHub Actions workflow at [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) runs on push to `main`:

1. `npm ci`
2. `npm run build` (TypeScript → Vite → `dist/`)
3. `actions/upload-pages-artifact` → `actions/deploy-pages`

No server required — the app is entirely client-side with direct NOAA API calls from the browser.

---

## Design decisions

Full rationale for architectural and visual choices is in [docs/DESIGN.md](docs/DESIGN.md), including:

- Why G2 (not G3) was chosen as the alert threshold
- Why Approach C+A was chosen over tooltip-only alerts
- Why html-to-image instead of html2canvas
- Why CSS animations instead of Framer Motion
- The data merging strategy for plasma + magnetometer feeds
