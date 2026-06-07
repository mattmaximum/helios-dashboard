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

export interface KpForecastPoint {
  time: string;
  kp: number;
  observed: string; // 'observed' | 'estimated' | 'predicted'
  noaaScale: string; // 'None' | 'G1' .. 'G5'
}

export interface SpaceWeatherAlert {
  issueTime: string;
  message: string;
  gScale: string | null; // parsed G-scale if present
  summary: string;       // first substantive line
}

export type EventSeverity = 'minor' | 'moderate' | 'severe' | 'extreme';

export interface SolarEvent {
  id: string;
  time: string;        // ISO timestamp
  type: 'flare' | 'storm' | 'cme';
  title: string;
  detail: string;
  severity: EventSeverity;
  badge: string;       // "M2.3", "G2", "CME Watch", etc.
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
  f107: number | null;
  kpForecast: KpForecastPoint[];
  spaceWeatherAlerts: SpaceWeatherAlert[];
  solarEvents: SolarEvent[];
  lastUpdated: number;
}

// --- Storm Level Mapper ---
// NOAA G-scale: G1=Kp5, G2=Kp6, G3=Kp7, G4=Kp8, G5=Kp9
// ref: https://www.swpc.noaa.gov/noaa-scales-explanation
export function getStormLevel(kp: number): StormLevel {
  if (kp < 0) {
    return { code: 'G0', label: 'Quiet', color: '#10B981', description: 'Quiet geomagnetic conditions' };
  }
  if (kp < 5) return { code: 'G0', label: 'Quiet', color: '#10B981', description: 'No geomagnetic storm activity' };
  if (kp < 6) return { code: 'G1', label: 'Minor Storm', color: '#84CC16', description: 'Minor impact on satellite navigation, aurora visible at high latitudes' };
  if (kp < 7) return { code: 'G2', label: 'Moderate Storm', color: '#FBBF24', description: 'Possible minor impact on power systems and satellite operations' };
  if (kp < 8) return { code: 'G3', label: 'Strong Storm', color: '#FF8C42', description: 'Power grid problems possible, aurora visible at mid-latitudes' };
  if (kp < 9) return { code: 'G4', label: 'Severe Storm', color: '#EF4444', description: 'Widespread voltage control problems, aurora seen at low latitudes' };
  return { code: 'G5', label: 'Extreme Storm', color: '#DC2626', description: 'Severe space weather with extreme impacts on infrastructure' };
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
  xrayFlares: 'https://services.swpc.noaa.gov/json/goes/primary/xray-flares-7-day.json',
  f107: 'https://services.swpc.noaa.gov/products/solar-cycle/observed-solar-cycle-indices.json',
  kpForecast: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json',
  alerts: 'https://services.swpc.noaa.gov/products/alerts.json',
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

function getMockKpForecast(): KpForecastPoint[] {
  const now = new Date();
  const base = new Date(Math.ceil(now.getTime() / (3 * 3_600_000)) * 3 * 3_600_000);
  return Array.from({ length: 26 }, (_, i) => {
    const offset = i - 2; // -6hr context + 72hr ahead
    const t = new Date(base.getTime() + offset * 3 * 3_600_000);
    const kp = Math.max(0.3, Math.min(6, 2.5 + Math.sin(offset * 0.4) * 1.5 + (offset > 10 && offset < 14 ? 2 : 0)));
    const rounded = Math.round(kp * 3) / 3;
    const scale = rounded >= 6 ? 'G2' : rounded >= 5 ? 'G1' : 'None';
    return {
      time: t.toISOString(),
      kp: rounded,
      observed: offset < 0 ? 'observed' : 'predicted',
      noaaScale: scale,
    };
  });
}

function extractAlertSummary(message: string): { gScale: string | null; summary: string } {
  const gMatch = message.match(/\b(G[1-5])\b/);
  const gScale = gMatch ? gMatch[1] : null;
  const lines = message.split('\n').map(l => l.trim()).filter(Boolean);
  let summary = '';
  for (const line of lines) {
    if (
      line.length > 30 &&
      !line.startsWith('Space Weather Message') &&
      !line.startsWith('Serial Number') &&
      !line.startsWith('Issue Time') &&
      !line.startsWith('#') &&
      !/^\d{4} [A-Z]/.test(line)
    ) {
      summary = line.slice(0, 150);
      break;
    }
  }
  return { gScale, summary: summary || 'Space weather advisory issued.' };
}

function parseAlerts(raw: Record<string, unknown>[]): SpaceWeatherAlert[] {
  return raw
    .filter((item) => {
      const msg = String(item.message ?? '').toUpperCase();
      return (
        msg.includes('CME') ||
        msg.includes('CORONAL MASS') ||
        msg.includes('SOLAR ENERGETIC') ||
        (msg.includes('GEOMAGNETIC') && (msg.includes('WATCH') || msg.includes('WARNING') || msg.includes('ALERT'))) ||
        (msg.includes('STORM') && (msg.includes('WATCH') || msg.includes('WARNING')))
      );
    })
    .map((item) => {
      const message = String(item.message ?? '');
      const { gScale, summary } = extractAlertSummary(message);
      return {
        issueTime: String(item.issue_datetime ?? item.product_id ?? ''),
        message,
        gScale,
        summary,
      };
    })
    .slice(-8); // keep up to 8 most recent (CME watches often cluster)
}

function flareSeverity(classStr: string): EventSeverity {
  const upper = classStr.toUpperCase();
  if (upper.startsWith('X')) {
    const n = parseFloat(classStr.slice(1));
    return n >= 10 ? 'extreme' : 'severe';
  }
  if (upper.startsWith('M')) {
    const n = parseFloat(classStr.slice(1));
    return n >= 5 ? 'moderate' : 'minor';
  }
  return 'minor';
}

// Actual fields from /json/goes/primary/xray-flares-7-day.json:
// begin_time, begin_class, max_time, max_class, end_time, end_class, satellite
function parseFlares(rows: Record<string, unknown>[], since: number): SolarEvent[] {
  return rows
    .map((row, i) => {
      const classStr = String(row.max_class ?? row.begin_class ?? '').trim();
      const timeStr  = String(row.max_time  ?? row.begin_time  ?? '').trim();
      const satellite = row.satellite ? `GOES-${row.satellite}` : '';
      return { classStr, timeStr, satellite, i };
    })
    .filter(({ classStr, timeStr }) => {
      if (!classStr || !timeStr) return false;
      const upper = classStr.toUpperCase();
      if (!upper.startsWith('M') && !upper.startsWith('X')) return false;
      const t = new Date(timeStr).getTime();
      return !isNaN(t) && t >= since;
    })
    .map(({ classStr, timeStr, satellite, i }) => ({
      id: `flare-${timeStr}-${i}`,
      time: new Date(timeStr).toISOString(),
      type: 'flare' as const,
      title: `${classStr} Solar Flare`,
      detail: satellite || 'GOES satellite detection',
      severity: flareSeverity(classStr),
      badge: classStr,
    }));
}

function deriveStormOnsets(kpReadings: KpReading[], since: number): SolarEvent[] {
  const events: SolarEvent[] = [];
  let lastStormMs: number | null = null;
  const COOLDOWN = 6 * 60 * 60 * 1000;

  for (const reading of kpReadings) {
    const t = new Date(reading.timestamp).getTime();
    if (t < since || (reading.kp ?? 0) < 5) continue;
    if (lastStormMs !== null && t - lastStormMs <= COOLDOWN) {
      lastStormMs = t;
      continue;
    }
    const kp = reading.kp!;
    const level = getStormLevel(kp);
    const severity: EventSeverity = kp >= 8 ? 'extreme' : kp >= 7 ? 'severe' : kp >= 6 ? 'moderate' : 'minor';
    events.push({
      id: `storm-${t}`,
      time: reading.timestamp,
      type: 'storm',
      title: `${level.code} Geomagnetic Storm`,
      detail: `Kp ${kp.toFixed(1)} · ${level.label}`,
      severity,
      badge: level.code,
    });
    lastStormMs = t;
  }
  return events;
}

function alertsToEvents(alerts: SpaceWeatherAlert[], since: number): SolarEvent[] {
  return alerts
    .filter((a) => {
      const t = new Date(a.issueTime).getTime();
      return !isNaN(t) && t >= since;
    })
    .map((a, i) => {
      const severity: EventSeverity =
        a.gScale === 'G4' || a.gScale === 'G5' ? 'extreme'
        : a.gScale === 'G3' ? 'severe'
        : a.gScale === 'G2' ? 'moderate'
        : 'minor';
      return {
        id: `cme-${a.issueTime}-${i}`,
        time: new Date(a.issueTime).toISOString(),
        type: 'cme' as const,
        title: a.gScale ? `${a.gScale} Storm Watch` : 'Space Weather Advisory',
        detail: a.summary,
        severity,
        badge: a.gScale ?? 'Watch',
      };
    });
}

function getMockSolarEvents(): SolarEvent[] {
  const now = Date.now();
  return [
    {
      id: 'mock-flare-1',
      time: new Date(now - 8 * 3_600_000).toISOString(),
      type: 'flare',
      title: 'M2.1 Solar Flare',
      detail: 'Region 3456 · N12E25',
      severity: 'minor',
      badge: 'M2.1',
    },
    {
      id: 'mock-storm-1',
      time: new Date(now - 22 * 3_600_000).toISOString(),
      type: 'storm',
      title: 'G1 Geomagnetic Storm',
      detail: 'Kp 5.3 · Minor Storm',
      severity: 'minor',
      badge: 'G1',
    },
  ];
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

  // Fetch all APIs in parallel
  const [kpResult, plasmaResult, magResult, xrayResult, f107Result, kpForecastResult, alertsResult, flaresResult] = await Promise.allSettled([
    fetchJSON<Record<string, unknown>[]>(URLS.kpIndex),
    fetchProductCSV<Record<string, string>>(URLS.plasma),
    fetchProductCSV<Record<string, string>>(URLS.mag),
    fetchJSON<Record<string, unknown>[]>(URLS.xray),
    fetchJSON<Record<string, unknown>[]>(URLS.f107),
    fetchProductCSV<Record<string, string>>(URLS.kpForecast),
    fetchJSON<Record<string, unknown>[]>(URLS.alerts),
    fetchJSON<Record<string, unknown>[]>(URLS.xrayFlares),
  ]);

  // Kp index
  let kpIndex: KpReading[];
  if (kpResult.status === 'fulfilled') {
    kpIndex = parseKpJson(kpResult.value);
  } else {
    console.warn('[Helios] Kp-index API failed, using mock data:', kpResult.reason instanceof Error ? kpResult.reason.message : kpResult.reason);
    kpIndex = getMockKpData();
  }

  const currentKp = kpIndex.length > 0
    ? kpIndex[kpIndex.length - 1]?.kp ?? null
    : null;
  const currentStormLevel = currentKp != null ? getStormLevel(currentKp) : null;

  // Solar wind plasma + magnetic field
  let solarWind: SolarWindData[];
  let plasmaData: Record<string, string>[];
  let magData: Record<string, string>[];
  const plasmaOk = plasmaResult.status === 'fulfilled';
  const magOk = magResult.status === 'fulfilled';

  if (plasmaOk) {
    plasmaData = plasmaResult.value;
  } else {
    console.warn('[Helios] Plasma API failed:', plasmaResult.reason instanceof Error ? plasmaResult.reason.message : plasmaResult.reason);
    plasmaData = [];
  }

  if (magOk) {
    magData = magResult.value;
  } else {
    console.warn('[Helios] Magnetometer API failed:', magResult.reason instanceof Error ? magResult.reason.message : magResult.reason);
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

  // X-ray flux — use the parallel result
  let xrayFlux: XrayFluxPoint[];
  let xrayFlares: XrayFlareReading[];
  if (xrayResult.status === 'fulfilled') {
    const xrayData = xrayResult.value;
    // Pick satellite 18 (GOES-18, primary) to avoid duplicates
    const goes18 = xrayData.filter((d) => d.satellite === 18);
    // Use long channel (0.1-0.8nm) which is the standard for GOES flare classification
    const longChannel = goes18.filter((d: Record<string, unknown>) => d.energy === '0.1-0.8nm');
    xrayFlux = (longChannel.length > 0 ? longChannel : goes18).map((d: Record<string, unknown>) => {
      const flux = (d.flux ?? d.observed_flux ?? 0) as number;
      return {
        time: (d.time_tag as string) || new Date().toISOString(),
        flux,
        class: classifyFlux(flux),
      };
    });
    xrayFlares = [];
  } else {
    console.warn('[Helios] X-ray flux API failed, using mock data:', xrayResult.reason instanceof Error ? xrayResult.reason.message : xrayResult.reason);
    const mock = getMockXrayFlux();
    xrayFlux = mock.data;
    xrayFlares = mock.flares;
  }

  // Current X-ray class: find the most recent flux point
  const lastXray = xrayFlux.length > 0 ? xrayFlux[xrayFlux.length - 1] : null;
  const currentXrayClass = lastXray?.class || 'B0.0';

  // F10.7cm radio flux — monthly solar cycle index, last entry is most recent
  let f107: number | null = null;
  if (f107Result.status === 'fulfilled' && Array.isArray(f107Result.value) && f107Result.value.length > 0) {
    const last = f107Result.value[f107Result.value.length - 1] as Record<string, unknown>;
    const raw = last['f10.7'] ?? last['f107'] ?? last['flux'];
    f107 = typeof raw === 'number' ? raw : raw != null ? parseFloat(String(raw)) : null;
  } else {
    console.warn('[Helios] F10.7 API failed, using null');
  }

  // Solar event log — unified feed of M1.0+ flares, G1+ storm onsets, CME watches
  // Use 30-day window so the 1W/1M toggles in the UI have data to show
  const since30d = lastUpdated - 30 * 24 * 60 * 60 * 1000;
  // NOAA xray-flares-7-day.json covers at most 7 days — use that as ceiling
  const since7d = lastUpdated - 7 * 24 * 60 * 60 * 1000;
  let flareEvents: SolarEvent[] = [];
  if (flaresResult.status === 'fulfilled') {
    flareEvents = parseFlares(flaresResult.value, since7d);
  } else {
    console.warn('[Helios] xray-flares API failed:', flaresResult.reason instanceof Error ? flaresResult.reason.message : flaresResult.reason);
  }

  // Kp 3-day forecast (header+rows CSV-style product endpoint)
  let kpForecast: KpForecastPoint[];
  if (kpForecastResult.status === 'fulfilled') {
    kpForecast = kpForecastResult.value.map((row) => {
      const kpRaw = parseFloat(row.kp ?? row.Kp ?? '0');
      const scale = row.noaa_scale ?? row.noaaScale ?? 'None';
      return {
        time: row.time_tag ?? '',
        kp: isNaN(kpRaw) ? 0 : kpRaw,
        observed: row.observed ?? 'predicted',
        noaaScale: scale === '-' ? 'None' : scale,
      };
    }).filter((p) => p.time !== '');
  } else {
    console.warn('[Helios] Kp forecast API failed, using mock data');
    kpForecast = getMockKpForecast();
  }

  // Space weather alerts (CME watches/warnings)
  let spaceWeatherAlerts: SpaceWeatherAlert[];
  if (alertsResult.status === 'fulfilled') {
    spaceWeatherAlerts = parseAlerts(alertsResult.value);
  } else {
    console.warn('[Helios] Alerts API failed, using empty list');
    spaceWeatherAlerts = [];
  }

  // Combine observed event types only (no watches/advisories — those go in the forecast section)
  const stormEvents = deriveStormOnsets(kpIndex, since30d);
  const solarEvents: SolarEvent[] = [...flareEvents, ...stormEvents]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // Fall back to mock if every source failed
  const finalSolarEvents = solarEvents.length > 0 ? solarEvents : getMockSolarEvents();

  return {
    kpIndex,
    currentKp,
    currentKpLabel: kpIndex.length > 0 ? `${currentKp}` : 'N/A',
    currentStormLevel,
    solarWind,
    currentSolarWind: solarWind.length > 0
      ? (solarWind.slice().reverse().find((d) => d.speed != null && d.density != null) ?? solarWind[solarWind.length - 1])
      : null,
    xrayFlux,
    xrayFlares,
    currentXrayClass,
    f107,
    kpForecast,
    spaceWeatherAlerts,
    solarEvents: finalSolarEvents,
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
