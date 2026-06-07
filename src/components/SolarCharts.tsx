import { useState, useMemo } from 'react';
import InfoTip from './InfoTip';
import { useTime } from '@/context/TimeContext';
import type { TimeMode } from '@/context/TimeContext';
import type { XrayFluxPoint, SolarWindData } from '@/data/solarData';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

type TimeRange = '24h' | '72h' | '1w';

const TIME_RANGES: { key: TimeRange; label: string; ms: number }[] = [
  { key: '24h', label: '24 hours', ms: 24 * 60 * 60 * 1000 },
  { key: '72h', label: '72 hours', ms: 72 * 60 * 60 * 1000 },
  { key: '1w', label: '1 week', ms: 7 * 24 * 60 * 60 * 1000 },
];

// 15-minute bucket for 24h/72h, 2-hour bucket for 1w
const BUCKET_MS: Record<TimeRange, number> = {
  '24h': 15 * 60 * 1000,
  '72h': 30 * 60 * 1000,
  '1w': 2 * 60 * 60 * 1000,
};

// ChartTooltip is built inside the component via useMemo to close over timeMode
// without fighting Recharts' content-prop type system.

function filterByRange<T>(data: T[], rangeMs: number, getTime: (d: T) => string): T[] {
  const cutoff = Date.now() - rangeMs;
  return data.filter((d) => new Date(getTime(d)).getTime() >= cutoff);
}

function avg(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null && v > 0);
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

function avgAny(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null);
  return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

/** Average solar wind readings into fixed-width time buckets to remove noise and API gaps */
function downsampleWind(data: SolarWindData[], bucketMs: number): SolarWindData[] {
  if (data.length === 0) return data;
  const map = new Map<number, SolarWindData[]>();
  for (const item of data) {
    const t = new Date(item.timestamp).getTime();
    const key = Math.floor(t / bucketMs) * bucketMs;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([key, items]) => ({
      timestamp: new Date(key).toISOString(),
      speed: avg(items.map((d) => d.speed)),
      density: avg(items.map((d) => d.density)),
      temperature: avgAny(items.map((d) => d.temperature)),
      bz: avgAny(items.map((d) => d.bz)),
      bx: avgAny(items.map((d) => d.bx)),
      by: avgAny(items.map((d) => d.by)),
    }));
}

interface Props {
  kpIndex: { timestamp: string; kp: number | null }[];
  xrayFlux: XrayFluxPoint[];
  solarWind: SolarWindData[];
}

export default function SolarCharts({ kpIndex, xrayFlux, solarWind }: Props) {
  const [range, setRange] = useState<TimeRange>('24h');
  const { mode: timeMode } = useTime();

  const activeRange = TIME_RANGES.find((r) => r.key === range)!;
  const rangeMs = activeRange.ms;
  const rangeLabel = activeRange.label;
  const bucketMs = BUCKET_MS[range];

  const filteredKp = filterByRange(kpIndex, rangeMs, (d) => d.timestamp);
  const filteredXray = filterByRange(xrayFlux, rangeMs, (d) => d.time);
  const filteredWind = downsampleWind(
    filterByRange(solarWind, rangeMs, (d) => d.timestamp),
    bucketMs
  );

  // Memoized tooltip that closes over timeMode — avoids Recharts content-prop type fights
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipContent = useMemo(() => function TooltipContent({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const tz = timeMode === 'utc' ? 'UTC' : undefined;
    const sfx = timeMode === 'utc' ? ' UTC' : '';
    const timeStr = label != null ? new Date(label).toLocaleString(undefined, { timeZone: tz }) + sfx : '';
    return (
      <div className="rounded-lg border border-gray-700/60 bg-gray-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
        {timeStr && <p className="mb-1 font-semibold text-gray-300">{timeStr}</p>}
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || '#fff' }}>
            {p.name}: {p.value?.toFixed?.(2) ?? p.value}
          </p>
        ))}
      </div>
    );
  }, [timeMode]);

  const tickFormatter = (ms: number) => {
    const d = new Date(ms);
    if (range === '1w') {
      return timeMode === 'utc'
        ? `${d.getUTCMonth() + 1}/${d.getUTCDate()}`
        : `${d.getMonth() + 1}/${d.getDate()}`;
    }
    return timeMode === 'utc'
      ? `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`
      : `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const kpData = filteredKp.map((d) => ({
    ts: new Date(d.timestamp).getTime(),
    kp: d.kp ?? null,
  }));

  const xrayData = filteredXray.map((d) => ({
    ts: new Date(d.time).getTime(),
    flux: d.flux ?? null,
    class: d.class,
  }));

  const windData = filteredWind.map((d) => ({
    ts: new Date(d.timestamp).getTime(),
    speed: d.speed,
    density: d.density,
  }));

  const bzData = filteredWind.map((d) => ({
    ts: new Date(d.timestamp).getTime(),
    bz: d.bz,
    bx: d.bx,
    by: d.by,
  }));

  const rangeButtons = (
    <div className="flex items-center gap-2">
      {TIME_RANGES.map((r) => (
        <button
          key={r.key}
          onClick={() => setRange(r.key)}
          className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-all duration-200 ${
            range === r.key
              ? 'border-plasma-orange/60 bg-plasma-orange/15 text-plasma-orange'
              : 'border-gray-700/40 bg-gray-800/40 text-gray-500 hover:border-gray-600/50 hover:text-gray-300'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        {rangeButtons}
      </div>

      {/* KP Index Chart */}
      <div className="chart-animate-in rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm" style={{ animationDelay: '0ms' }}>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Kp-index ({rangeLabel})</h3>
          <InfoTip content="Historical Kp readings over the selected window. The orange reference lines mark G2 (Kp 5) and G3 (Kp 7) thresholds. A sustained run above Kp 5 is a geomagnetic storm in progress." />
        </div>
        <p className="mb-4 text-xs text-gray-600">Geomagnetic activity over the last {rangeLabel.toLowerCase()}</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={kpData}>
            <defs>
              <linearGradient id="kpGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
            <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFormatter} stroke="#374151" tick={{ fontSize: 10 }} tickMargin={4} interval="preserveStartEnd" />
            <YAxis domain={[0, 9]} stroke="#374151" tick={{ fontSize: 10 }} label={{ value: 'Kp', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 11 } }} />
            <Tooltip content={tooltipContent} />
            <ReferenceLine y={5} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'G2', fill: '#eab308', fontSize: 10 }} />
            <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'G3', fill: '#ef4444', fontSize: 10 }} />
            <ReferenceLine y={8} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'G5', fill: '#dc2626', fontSize: 10 }} />
            <Area type="monotone" dataKey="kp" stroke="#FF6B35" strokeWidth={2} fill="url(#kpGrad)" name="Kp" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* X-ray Flux Chart */}
      <div className="chart-animate-in rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm" style={{ animationDelay: '120ms' }}>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">X-ray Flux ({rangeLabel})</h3>
          <InfoTip content="Solar X-ray output measured by GOES satellites. The scale is logarithmic — each letter class is 10× stronger than the previous. B is background noise, C is minor, M can cause regional radio blackouts, X can cause global HF radio outages. The spike shape indicates a flare event." />
        </div>
        <p className="mb-4 text-xs text-gray-600">X-class &gt; M-class &gt; C-class &gt; B-class</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={xrayData}>
            <defs>
              <linearGradient id="xrayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
            <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFormatter} stroke="#374151" tick={{ fontSize: 10 }} tickMargin={4} interval="preserveStartEnd" />
            <YAxis scale="log" domain={[1e-9, 1e-4]} tickFormatter={(v) => `${v.toExponential(0)}`} stroke="#374151" tick={{ fontSize: 10 }} />
            <Tooltip content={tooltipContent} />
            <ReferenceLine y={1e-6} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'C-class', fill: '#eab308', fontSize: 10 }} />
            <ReferenceLine y={1e-5} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'M-class', fill: '#f97316', fontSize: 10 }} />
            <ReferenceLine y={1e-4} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'X-class', fill: '#ef4444', fontSize: 10 }} />
            <Area type="monotone" dataKey="flux" stroke="#FF6B35" strokeWidth={2} fill="url(#xrayGrad)" name="Flux" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Solar Wind Speed + Density */}
      <div className="chart-animate-in rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm" style={{ animationDelay: '240ms' }}>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Solar Wind Speed &amp; Density ({rangeLabel})</h3>
          <InfoTip content="Speed (green, left axis) shows how fast the solar wind is moving. Density (teal dashed, right axis) shows how packed it is. A fast AND dense wind is the most geoeffective combination. Values averaged into 15-minute windows to remove sensor noise." />
        </div>
        <p className="mb-4 text-xs text-gray-600">Speed (km/s, solid) and Density (p/cm³, dashed) — 15-min averages</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={windData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
            <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFormatter} stroke="#374151" tick={{ fontSize: 10 }} tickMargin={4} interval="preserveStartEnd" />
            <YAxis yAxisId="left" domain={[200, 800]} stroke="#374151" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 20]} stroke="#374151" tick={{ fontSize: 10 }} />
            <Tooltip content={tooltipContent} />
            <Area yAxisId="left" type="monotone" dataKey="speed" stroke="#00FF94" strokeWidth={2} fill="#00FF94" fillOpacity={0.06} name="Speed km/s" connectNulls={false} />
            <Area yAxisId="right" type="monotone" dataKey="density" stroke="#00D4AA" strokeWidth={1.5} strokeDasharray="5 5" fill="none" name="Density p/cm³" connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bz Component */}
      <div className="chart-animate-in rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm" style={{ animationDelay: '360ms' }}>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Interplanetary Magnetic Field ({rangeLabel})</h3>
          <InfoTip content="Bz (red) is the most important line — when it goes negative (below zero), Earth's magnetic shield opens up to solar energy. Bx and By show the field's east-west and dawn-dusk tilt. Averaged into 15-minute windows." />
        </div>
        <p className="mb-4 text-xs text-gray-600">Southward Bz drives geomagnetic storms — 15-min averages</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={bzData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
            <XAxis dataKey="ts" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={tickFormatter} stroke="#374151" tick={{ fontSize: 10 }} tickMargin={4} interval="preserveStartEnd" />
            <YAxis domain={[-20, 20]} stroke="#374151" tick={{ fontSize: 10 }} />
            <Tooltip content={tooltipContent} />
            <ReferenceLine y={0} stroke="#4a4f5e" strokeWidth={1} />
            <Area type="basis" dataKey="bz" name="Bz" stroke="#ef4444" fill="#ef4444" fillOpacity={0.12} strokeWidth={1.5} connectNulls={false} />
            <Area type="basis" dataKey="bx" name="Bx" stroke="#22d3ee" fill="none" strokeWidth={1} connectNulls={false} />
            <Area type="basis" dataKey="by" name="By" stroke="#a855f7" fill="none" strokeWidth={1} connectNulls={false} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-red-500" />
            <span className="text-xs text-gray-500">Bz (nT)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-cyan-400" />
            <span className="text-xs text-gray-500">Bx (nT)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-purple-500" />
            <span className="text-xs text-gray-500">By (nT)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
