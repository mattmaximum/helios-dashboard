# Project Helios — Design Decisions

> Source of truth for architecture, visual, and UX decisions made during development.
> Repository: [https://github.com/mattmaximum/helios-dashboard](https://github.com/mattmaximum/helios-dashboard)

---

## Purpose

Helios is a real-time solar weather dashboard. It pulls live data from NOAA SWPC's public APIs and renders it as a focused, readable interface for anyone curious about space weather — amateur astronomers, aurora chasers, ham radio operators, or just people who wanted to know why their GPS was acting strange.

This doc captures *why* things were built the way they were, not just *what* they are.

---

## Feature: Cinematic Alert Mode (Approach C+A)

### The problem it solves

When a G2+ geomagnetic storm hits, the dashboard previously looked the same as it does during quiet conditions. There was nothing that made you *feel* it. The data was correct, but the UI had no sense of urgency.

### What we built

**Approach C** — Full app shell transformation when Kp ≥ 6 (G2+):
- Root div switches from `aurora-bg` to `aurora-alert-mode`, shifting the background from cool blue-black to a deep crimson temperature — `#030712` → `#0d0305`/`#170810`
- Header border transitions from `border-gray-800/40` to `border-red-900/50`
- Both transitions run over 3 seconds ease-in-out so the change feels like weather arriving, not a toggle flip

**Approach A** — Baseline CSS animations throughout:
- **Solar wind MetricCard**: `accentColor` computed live from wind speed (`<400km/s` = teal, `400–600` = amber, `>600km/s` = orange-red)
- **KpGauge**: outer glow ring pulses at a rate keyed to storm level — G2 = 2s, G3 = 1.2s, G4/G5 = 0.6s. The needle itself is never animated — precision over drama
- **SolarCharts**: staggered fade-in (0ms, 120ms, 240ms, 360ms) so the charts cascade into view on load

### Why "C+A" and not just one?

Approach B (tooltip-only alerts) was too subtle — a user already looking at the Kp gauge doesn't need a tooltip. Approach C alone transforms the shell but leaves the individual widgets flat. Combining them means the shell reacts to the storm *and* the individual data components carry the severity with them.

---

## Key Technical Decisions

### CSS animations over Framer Motion

**Decision:** Pure CSS keyframes for all animations.

**Why:** Framer Motion adds ~30KB to the bundle, requires a React context provider, and introduces a learning surface. For this use case — a handful of pulse keyframes and a single fade-in — CSS does everything needed at zero cost. The animations are also simpler to audit for `prefers-reduced-motion` compliance since they're all in one place in `index.css`.

### html-to-image over html2canvas for the Share button

**Decision:** `html-to-image` (~9KB) for the PNG capture in StormAlert.

**Why:** html2canvas fails silently on `backdrop-filter: blur()`, CSS gradients, and SVG `drop-shadow`. The StormAlert card uses all three heavily. html-to-image renders these correctly because it uses the browser's own rendering pipeline via SVG `foreignObject`. The `filter` callback lets us exclude `.live-sun-panel` (the SDO imagery panel) which has CORS restrictions.

**Filename convention:** `helios-G3-Kp7.2-2026-06-06.png` — encodes storm code, exact Kp, and date so shared images are self-documenting.

### STORM_CONFIG consolidation

**Decision:** Five parallel `Record<string, string>` maps in StormAlert replaced with a single `STORM_CONFIG: Record<string, {...}>`.

**Why:** Adding a new G-scale property previously required editing five separate places and it was easy to miss one. A single record means a new property is one key per entry — impossible to add it to G2 and forget G4.

### isAlert threshold at G2 (Kp ≥ 6)

**Decision:** Alert mode activates at G2, not G3 or higher.

**Why:** G2 is the threshold where real-world impacts start — power grid fluctuations, satellite drag, HF radio degradation at high latitudes. G1 is "aurora at 60°N" which is normal for anyone in Scandinavia. G2 is the first level where someone in the continental US might care. Setting the threshold here avoids alert fatigue (triggering too often) while still being early enough to matter.

### Auto-refresh kept at 5 minutes

**Decision:** Data refreshes automatically every 5 minutes via `setInterval` in `useSolarData`.

**Why:** NOAA SWPC's Kp and plasma APIs update every 1–15 minutes depending on the feed. Refreshing more frequently would hammer the API for no benefit. Refreshing less frequently means the data could be stale during a fast-moving storm. 5 minutes is the sweet spot.

### Vitest for threshold boundary tests

**Decision:** Vitest + jsdom for unit tests scoped to `solarData.ts`.

**Why:** The G-scale thresholds in `getStormLevel()` are the single most consequential function in the entire codebase. A wrong threshold triggers false alarms (community trust damage) or misses real storms (the product fails its core purpose). Tests specifically cover the boundary values (4.99, 5.0, 5.99, 6.0 etc.) where off-by-one errors would occur.

---

## Data Architecture

```
NOAA SWPC APIs (4 parallel fetches via Promise.allSettled)
  ├── Kp-index        → getStormLevel() → currentStormLevel, isAlert
  ├── Plasma (solar wind speed/density/temp)  ┐
  ├── Magnetometer (Bx, By, Bz)              ├─ merged by timestamp → solarWind[]
  └── X-ray flux (GOES-18, 0.1-0.8nm)        → currentXrayClass

fetchSolarData() → SolarData → useSolarData hook → App.tsx → components
```

Every API call uses `Promise.allSettled` so a single failed endpoint degrades gracefully to mock data rather than crashing the whole dashboard.

---

## Accessibility

- All CSS animations respect `prefers-reduced-motion: reduce` — animations are disabled, and high-severity storm states fall back to a static box-shadow glow
- The Kp gauge needle is never animated — it must remain readable at a glance
- The Share button includes a loading state (`Saving…`) and a failure state (`Capture failed` inline on the button, auto-clears after 3 seconds) with no modal or toast dependency

---

## What was considered but deferred

**Approach B v2 (persistent tooltip badge):** A small "G2 STORM ACTIVE" badge pinned to the header that persists across scroll. Could be useful on mobile where the StormAlert hero scrolls out of view quickly. Deferred — implement as a sticky notification bar if mobile usage warrants it.

**SolarCharts range expansion:** The 1-week range currently shows sparse data because the NOAA APIs only return 7 days and the mock data covers 24h. Filling the 1-week range properly would require requesting historical data from a different endpoint. Deferred.

**DESIGN.md visual mockups:** The design review was done via text spec due to missing OpenAI API key for the design binary. The text spec was sufficient for implementation; visual mockups can be generated separately with `design setup`.
