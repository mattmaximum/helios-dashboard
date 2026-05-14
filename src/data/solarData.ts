// ============================================================
// Project Helios — Solar Data Layer
// Fetches from NOAA SWPC public APIs with graceful fallbacks
// ============================================================

// --- Types ---
export interface StormLevel {
  code: string;
  label: string;
  color: string;
  description: string;
}

export interface KpReading {
  timestamp: string;
  kp: number | null;
  aIndex: number | null;
}

export interface SolarWindData {
  timestamp: string;
  speed: number | null; // km/s
  density: number | null; // p/cm³
  temperature: number | null; // nK
  bz: number | null; // nT
  bx: number | null; // nT
  by: number | null; // nT
}

export interface XrayFlareReading {
  timestamp: string;
  class: string;
  peakTime: string;
  goClass: string;
  goPeakTime: string;
  sfxrFlux: number | null;
}

export interface XrayFluxPoint {
  time: string;
  flux: number | null; // photons/cm²/s
  class: string;
}

export interface SolarData {
  kpIndex: KpReading[];
  currentKp: number | null;
  currentKpLabel: string;
  currentStormLevel: StormLevel | null;
  solarWind: SolarWindData[];
  currentSolarWind: SolarWindData | null;
  xrayFlux: XrayFluxPoint[];
  xrayFlares: XrayFlareReading[];
  currentXrayClass: string;
  lastUpdated: number;
}

// --- Storm Level Mapper ---
export function getStormLevel(kp: number): StormLevel {
  if (kp == null || kp < 0) {
    return {
      code: 'G0',
      label: 'No Storm',
      color: '#10B981',
      description: 'Quiet geomagnetic conditions',
    };
  }
  if (kp < 1) return { code: 'G0', label: 'No Storm', color: '#10B981', description: 'No geomagnetic storm' };
  if (kp < 2.97) return { code: 'G1', label: 'Minor Storm', color: '#10B981', description: 'Weak fluctuations in the geomagnetic field' };
  if (kp < 4.97) return { code: 'G2', label: 'Moderate Storm', color: '#FBBF24', description: 'Possible minor impact on power systems' };
  if (kp < 5.97) return { code: 'G3', label: 'Strong Storm', color: '#FF8C42', description: 'Potential power grid problems, aurora visible at mid-latitudes' };
  if (kp < 7.97) return { code: 'G4', label: 'Severe Storm', color: '#EF4444', description: 'Widespread voltage control problems, aurora seen at low latitudes' };
  if (kp < 8.97) return { code: 'G5', label: 'Extreme Storm', color: '#DC2626', description: 'Severe space weather, extreme impacts on systems' };
  return { code: 'G5', label: 'Extreme Storm', color: '#DC2626', description: 'Severe space weather, extreme impacts on systems' };
}

export function getStormLevelNumeric(kp: number): number {
  const level = getStormLevel(kp);
  return parseInt(level.code.replace('G', ''));
}

// --- URL constants ---
const URLS = {
  kpIndex: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
  plasma: 'https://services.swpc.noaa.gov/products/solar-wind/plasma-7-day.json',
  mag: 'https://services.swpc.noaa.gov/products/solar-wind/mag-7-day.json',
  xray: 'https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json',
  xrayFlares: 'https://services.swpc.noaa.gov/products/flares/observed-flares.json',
} as const;

const WAVELENGTHS = {
  '171': { name: 'Corona', url: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0171.jpg' },
  '193': { name: 'Corona (Hot)', url: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0193.jpg' },
  '304': { name: 'Chromosphere', url: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_0304.jpg' },
  'hmi': { name: 'Magnetogram', url: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_1024_HMIB.jpg' },
} as const;

export type WavelengthKey = keyof typeof WAVELENGTHS;

// --- Kp parsing (from NOAA JSON: [{"time_tag": "...", "Kp": 1.33, "a_running": ...}]) ---
function parseKpJson(raw: Record<string, unknown>[]): KpReading[] {
  return raw.map((item) => ({
    timestamp: (item.time_tag as string) || new Date().toISOString(),
    kp: (item.Kp as number) ?? null,
    aIndex: (item.a_running as number) ?? null,
  }));
}

// --- Fetch helpers ---
async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(fetchErrorText(res.status));
  return res.json() as Promise<T>;
}

/** Fetches a header+rows CSV-like JSON endpoint (e.g. solar wind products) */
async function fetchProductCSV<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(fetchErrorText(res.status));
  const raw: unknown[][] = await res.json();
  const headers = raw[0] as string[];
  const rows = raw.slice(1);
  return rows.map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj as unknown as T;
  });
}

function fetchErrorText(status: number): string {
  const msgs: Record<number, string> = {
    404: 'Service not found',
    500: 'Internal server error',
    503: 'Service unavailable',
    504: 'Gateway timeout',
  };
  return msgs[status] || `HTTP ${status}`;
}

// --- Mock data ---
function getMockKpData(): KpReading[] {
  const now = new Date();
  const readings: KpReading[] = [];
  for (let i = 0; i < 25; i++) {
    const t = new Date(now.getTime() - (24 - i) * 3_600_000);
    const base = 3.0 + Math.sin(i * 0.5) * 2.0;
    readings.push({
      timestamp: t.toISOString(),
      kp: Math.min(9, Math.max(0, Math.round(base * 10) / 10)),
      aIndex: Math.round(base * 24.4),
    });
  }
  return readings;
}

function getMockSolarWind(): SolarWindData[] {
  const now = new Date();
  const readings: SolarWindData[] = [];
  for (let i = 0; i < 25; i++) {
    const t = new Date(now.getTime() - (24 - i) * 3_600_000);
    readings.push({
      timestamp: t.toISOString(),
      speed: Math.round(400 + Math.sin(i * 0.3) * 100),
      density: Math.round((5.4 + Math.sin(i * 0.7) * 3.2) * 10) / 10,
      temperature: Math.round((1.5 + Math.sin(i * 0.5) * 0.5) * 1_000_000),
      bz: Math.round((-3.2 + Math.sin(i * 0.4) * 5.0) * 10) / 10,
      bx: Math.round((1.5 + Math.sin(i * 0.6) * 2.0) * 10) / 10,
      by: Math.round((-2.1 + Math.sin(i * 0.5) * 3.0) * 10) / 10,
    });
  }
  return readings;
}

function getMockXrayFlux(): { data: XrayFluxPoint[]; flares: XrayFlareReading[] } {
  const now = new Date();
  const flux: XrayFluxPoint[] = [];
  const flares: XrayFlareReading[] = [];
  for (let i = 0; i < 25; i++) {
    const t = new Date(now.getTime() - (24 - i) * 21_600_000);
    const base = 1e-7;
    const val = base * (1.2 + Math.sin(i * 0.6) * 0.8);
    if (i === 5 || i === 18) {
      const peak = new Date(t.getTime() + 21_000_000);
      flares.push({
        timestamp: t.toISOString(),
        class: i === 5 ? 'M2.3' : 'C5.1',
        peakTime: peak.toISOString(),
        goClass: i === 5 ? 'M2.3' : 'C5.1',
        goPeakTime: peak.toISOString(),
        sfxrFlux: i === 5 ? 2.3e-5 : 5.1e-6,
      });
      flux.push({
        time: peak.toISOString(),
        flux: i === 5 ? 2.3e-5 : 5.1e-6,
        class: i === 5 ? 'M2.3' : 'C5.1',
      });
    }
    flux.push({
      time: t.toISOString(),
      flux: val,
      class: val > 1e-6 ? (val > 1e-5 ? 'M' : 'C') : 'B',
    });
  }
  return { data: flux, flares };
}

/** Classify X-ray flux value into GOES class string */
function classifyFlux(flux: number): string {
  if (flux >= 1e-4) return `X${(flux / 1e-4).toFixed(1)}`;
  if (flux >= 1e-5) return `M${(flux / 1e-5).toFixed(1)}`;
  if (flux >= 1e-6) return `C${(flux / 1e-6).toFixed(1)}`;
  return `B${(flux / 1e-7).toFixed(1)}`;
}

// --- Main fetch function ---
export async function fetchSolarData(): Promise<SolarData> {
  const lastUpdated = Date.now();

  // Fetch Kp index from noaa-planetary-k-index.json
  let kpIndex: KpReading[];
  try {
    const raw = await fetchJSON<Record<string, unknown>[]>(URLS.kpIndex);
    kpIndex = parseKpJson(raw);
  } catch (e: unknown) {
    console.warn('[Helios] Kp-index API failed, using mock data:', e instanceof Error ? e.message : e);
    kpIndex = getMockKpData();
  }

  const currentKp = kpIndex.length > 0
    ? kpIndex[kpIndex.length - 1]?.kp ?? null
    : null;
  const currentStormLevel = currentKp != null ? getStormLevel(currentKp) : null;

  // Fetch solar wind plasma (speed, density, temperature)
  // + magnetic field (bz, bx, by) — both are header+rows CSV-style JSON
  let solarWind: SolarWindData[];
  let plasmaData: Record<string, string>[];
  let magData: Record<string, string>[];
  let plasmaOk = false;
  let magOk = false;

  try {
    plasmaData = await fetchProductCSV<Record<string, string>>(URLS.plasma);
    plasmaOk = true;
  } catch (e: unknown) {
    console.warn('[Helios] Plasma API failed:', e instanceof Error ? e.message : e);
    plasmaData = [];
  }

  try {
    magData = await fetchProductCSV<Record<string, string>>(URLS.mag);
    magOk = true;
  } catch (e: unknown) {
    console.warn('[Helios] Magnetometer API failed:', e instanceof Error ? e.message : e);
    magData = [];
  }

  if (plasmaOk || magOk) {
    // Merge plasma + mag by timestamp
    const plasmaMap = new Map<string, Record<string, string>>();
    for (const p of plasmaData) {
      plasmaMap.set(p.time_tag, p);
    }
    const magMap = new Map<string, Record<string, string>>();
    for (const m of magData) {
      magMap.set(m.time_tag, m);
    }

    // Collect all unique timestamps
    const allTimestamps = new Set<string>();
    for (const p of plasmaData) allTimestamps.add(p.time_tag);
    for (const m of magData) allTimestamps.add(m.time_tag);

    const sorted = Array.from(allTimestamps).sort();
    solarWind = sorted.map((ts) => {
      const p = plasmaMap.get(ts);
      const m = magMap.get(ts);
      return {
        timestamp: ts,
        speed: p?.speed ? parseFloat(p.speed) : null,
        density: p?.density ? parseFloat(p.density) : null,
        temperature: p?.temperature ? parseInt(p.temperature, 10) : null,
        bz: m?.bz_gsm ? parseFloat(m.bz_gsm) : null,
        bx: m?.bx_gsm ? parseFloat(m.bx_gsm) : null,
        by: m?.by_gsm ? parseFloat(m.by_gsm) : null,
      };
    });
  } else {
    console.warn('[Helios] Both plasma and mag APIs failed, using mock solar wind');
    solarWind = getMockSolarWind();
  }

  // Fetch X-ray flux — flat array of objects with time_tag + flux
  let xrayFlux: XrayFluxPoint[];
  let xrayFlares: XrayFlareReading[];
  try {
    const xrayData = await fetchJSON<Record<string, unknown>[]>(URLS.xray);
    // The endpoint returns per-satellite data; pick satellite 18 (GOES-18, primary)
    // Filter to one satellite to avoid duplicates, then simplify
    const goes18 = xrayData.filter((d) => d.satellite === 18);
    // There are two channels: 0.05-0.4nm (short) and 0.1-0.8nm (long)
    // Use the long channel (higher flux values) for flare classification
    const longChannel = goes18.filter((d: Record<string, unknown>) => (d.flux as number) > 1e-7);
    xrayFlux = (longChannel.length > 50 ? longChannel : goes18).map((d: Record<string, unknown>) => {
      const flux = (d.flux ?? d.observed_flux ?? 0) as number;
      return {
        time: (d.time_tag as string) || new Date().toISOString(),
        flux,
        class: classifyFlux(flux),
      };
    });
    xrayFlares = [];
  } catch (e: unknown) {
    console.warn('[Helios] X-ray flux API failed, using mock data:', e instanceof Error ? e.message : e);
    const mock = getMockXrayFlux();
    xrayFlux = mock.data;
    xrayFlares = mock.flares;
  }

  // Current X-ray class: find the most recent flux point
  const lastXray = xrayFlux.length > 0 ? xrayFlux[xrayFlux.length - 1] : null;
  const currentXrayClass = lastXray?.class || 'B0.0';

  return {
    kpIndex,
    currentKp,
    currentKpLabel: kpIndex.length > 0 ? `${currentKp}` : 'N/A',
    currentStormLevel,
    solarWind,
    currentSolarWind: solarWind.length > 0 ? solarWind[solarWind.length - 1] : null,
    xrayFlux,
    xrayFlares,
    currentXrayClass,
    lastUpdated,
  };
}

// --- Sun imagery URLs ---
export function getSunImageUrl(wavelength: WavelengthKey): string {
  return WAVELENGTHS[wavelength].url;
}

export function getWavelengthOptions(): { key: WavelengthKey; name: string; url: string }[] {
  return (Object.keys(WAVELENGTHS) as WavelengthKey[]).map((key) => ({
    key,
    name: WAVELENGTHS[key].name,
    url: WAVELENGTHS[key].url,
  }));
}
