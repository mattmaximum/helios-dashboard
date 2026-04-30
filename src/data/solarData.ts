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
  if (kp < 1) return { code: 'G0', label: 'No Storm', color: '#10B981', description: 'Quiet geomagnetic conditions' };
  if (kp < 2.97) return { code: 'G1', label: 'Minor Storm', color: '#10B981', description: 'Weak fluctuations in the geomagnetic field' };
  if (kp < 4.97) return { code: 'G1', label: 'Minor Storm', color: '#FBBF24', description: 'Weak fluctuations in the geomagnetic field' };
  if (kp < 5.97) return { code: 'G2', label: 'Moderate Storm', color: '#FBBF24', description: 'Possible minor impact on power systems' };
  if (kp < 6.97) return { code: 'G3', label: 'Strong Storm', color: '#FF8C42', description: 'Potential power grid problems, aurora visible at mid-latitudes' };
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
  geoIndex: 'https://services.swpc.noaa.gov/text/aggregate-geomagnetic-index.txt',
  geoIndexJson: 'https://services.swpc.noaa.gov/json/aggregate-geomagnetic-index.json',
  plasma: 'https://services.swpc.noaa.gov/json/plasma_7-day.json',
  xray: 'https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json',
  sunImagery: 'https://services.swpc.noaa.gov/rest/sun-earth-imagery/latest',
} as const;

const WAVELENGTHS = {
  '171': { name: 'Corona', url: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_720_0171.jpg' },
  '193': { name: 'Corona (Hot)', url: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_720_0193.jpg' },
  '304': { name: 'Chromosphere', url: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_720_0304.jpg' },
  'hmi': { name: 'Magnetogram', url: 'https://sdo.gsfc.nasa.gov/assets/img/latest/latest_000659.jpg' },
} as const;

export type WavelengthKey = keyof typeof WAVELENGTHS;

// --- Kp parsing: "2024 003 2345  Kp=4.00  A= 97" ---
function parseKpLine(text: string, idx: number): KpReading | null {
  const line = text.split('\n').find((_, i) => i === idx);
  if (!line) return null;
  const parts = line.trim().split(/\s+/);
  if (parts.length < 8) return null;
  const dayOfYear = parseInt(parts[1], 10);
  const hours = parseInt(parts[2], 10);
  const minutes = parseInt(parts[3], 10);
  const date = new Date(Date.UTC(2025, 0, 1));
  date.setUTCDate(dayOfYear);
  const kp = parts[5] === 'Kp' ? parseFloat(parts[6]) : null;
  const aIdx = parts[8] === 'A' ? parseInt(parts[9], 10) : null;
  return {
    timestamp: date.toISOString(),
    kp,
    aIndex: isNaN(aIdx) ? null : aIdx,
  };
}

function parseKpText(text: string): KpReading[] {
  const readings: KpReading[] = [];
  let lastValid: KpReading | null = null;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#') || lines[i].trim() === '') continue;
    const r = parseKpLine(text, i);
    if (r) {
      readings.push(r);
      lastValid = r;
    }
  }
  if (readings.length === 0 && lastValid) {
    // Use last valid reading for current time
    return [lastValid];
  }
  return readings;
}

// --- Fetch helpers ---
async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(fetchErrorText(res.status));
  return res.json() as Promise<T>;
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
    // Simulate moderate geomagnetic activity
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
    // Inject a few fake flares
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

// --- Main fetch function ---
export async function fetchSolarData(): Promise<SolarData> {
  const lastUpdated = Date.now();

  // Fetch Kp index
  let kpIndex: KpReading[] = [];
  let kpError: string | null = null;
  try {
    const text = await fetch(URLS.geoIndex).then((r) => r.text());
    kpIndex = parseKpText(text);
  } catch (e: any) {
    console.warn('[Helios] Kp-index API failed, using mock data:', e?.message);
    kpError = e?.message;
    kpIndex = getMockKpData();
  }

  const currentKp = kpIndex.length > 0
    ? kpIndex[kpIndex.length - 1]?.kp ?? null
    : null;
  const currentStormLevel = currentKp != null ? getStormLevel(currentKp) : null;

  // Fetch solar wind
  let solarWind: SolarWindData[] = [];
  try {
    const plasma = await fetchJSON<any[]>(URLS.plasma);
    solarWind = plasma.map((item: any) => ({
      timestamp: item.created || new Date().toISOString(),
      speed: item.speed ?? null,
      density: item.density ?? null,
      temperature: item.temperature ?? null,
      bz: item.bz ?? null,
      bx: item.bx ?? null,
      by: item.by ?? null,
    }));
    // Reverse to have oldest first
    solarWind.reverse();
  } catch (e: any) {
    console.warn('[Helios] Solar wind API failed, using mock data:', e?.message);
    solarWind = getMockSolarWind();
  }

  // Fetch X-ray flux
  let xrayFlux: XrayFluxPoint[] = [];
  let xrayFlares: XrayFlareReading[] = [];
  try {
    const xrayData = await fetchJSON<any>(URLS.xray);
    xrayFlux = xrayData.data.map((item: any) => ({
      time: item.time || new Date().toISOString(),
      flux: item.flux ?? null,
      class: item.class || 'UNKNOWN',
    }));
    xrayFlares = xrayData.flares || [];
  } catch (e: any) {
    console.warn('[Helios] X-ray flux API failed, using mock data:', e?.message);
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
