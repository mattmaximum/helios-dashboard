# Project Helios — Solar Weather Dashboard

A real-time solar weather monitoring dashboard built with React, TypeScript, and Vite. Displays live geomagnetic storm data, Kp-index, solar wind, X-ray flux, and NASA SDO solar imagery.

## Features

- **Geomagnetic Storm Status** — Real-time G-scale storm level with Kp index gauge
- **Live Solar Wind Metrics** — Speed, density, Bz component, and temperature from NOAA SWPC
- **X-Ray Flux Monitoring** — GOES-classification with flare detection thresholds
- **Kp-Index Gauge** — Arc-style gauge with color-coded storm severity scale
- **Live Solar Imagery** — NASA SDO imagery at 171Å, 193Å, 304Å, and magnetogram
- **Historical Trends** — Kp, X-ray flux, solar wind, and IMF (Bz/Bx/By) charts with 24h / 72h / 1-week range selector
- **Auto-Refresh** — Automatically polls NOAA data every 5 minutes; manual refresh button in header
- **Graceful Fallbacks** — Mock data when APIs are unavailable (no blank screens)
- **Schumann Resonance** — Earth-ionosphere cavity resonance reference display

## Data Sources

| Data | Source | Endpoint |
|---|---|---|
| Geomagnetic Kp-index | NOAA SWPC | `services.swpc.noaa.gov/products/noaa-planetary-k-index.json` |
| Solar Wind Plasma | NOAA SWPC | `services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json` |
| Interplanetary Magnetic Field | NOAA SWPC | `services.swpc.noaa.gov/products/solar-wind/mag-7-day.json` |
| X-Ray Flux (GOES-18) | NOAA SWPC | `services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json` |
| Solar Imagery | NASA SDO | `sdo.gsfc.nasa.gov/assets/img/latest/` |

G-scale storm levels follow the [NOAA official classification](https://www.swpc.noaa.gov/noaa-scales-explanation): G1 = Kp5, G2 = Kp6, G3 = Kp7, G4 = Kp8, G5 = Kp9.

## Getting Started

```bash
npm install
npm run dev      # Development server with HMR
npm run build    # Type-check + production build to dist/
npm run preview  # Preview the production build
```

The app is deployed at [mattmaximum.github.io/helios-dashboard](https://mattmaximum.github.io/helios-dashboard/).

## Tech Stack

- **React 19** + **TypeScript 6**
- **Vite 8** — Fast HMR and builds
- **Tailwind CSS v4** — Utility-first styling
- **Recharts** — Interactive charts
- **Lucide React** — Icon set
- **GitHub Actions** — CI/CD to GitHub Pages
