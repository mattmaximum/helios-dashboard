import { useState } from 'react';
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

// Custom tooltip
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const timeStr = label ? new Date(label).toLocaleString() : '';
  return (
    <div className="rounded-lg border border-gray-700/60 bg-gray-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      {timeStr && <p className="mb-1 font-semibold text-gray-300">{timeStr}</p>}
      {payload.map((p: { name: string; value: number; color?: string }, i: number) => (
        <p key={i} style={{ color: p.color || '#fff' }}>
          {p.name}: {p.value?.toFixed?.(2) ?? p.value}
        </p>
      ))}
    </div>
  );
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

/** Filter data to only include points within the given time range from now */
function filterByRange<T>(data: T[], rangeMs: number, getTime: (d: T) => string): T[] {
  const cutoff = Date.now() - rangeMs;
  return data.filter((d) => new Date(getTime(d)).getTime() >= cutoff);
}

interface Props {
  kpIndex: { timestamp: string; kp: number | null }[];
  xrayFlux: XrayFluxPoint[];
  solarWind: SolarWindData[];
}

export default function SolarCharts({ kpIndex, xrayFlux, solarWind }: Props) {
  const [range, setRange] = useState<TimeRange>('24h');

  const activeRange = TIME_RANGES.find((r) => r.key === range)!;
  const rangeMs = activeRange.ms;
  const rangeLabel = activeRange.label;

  // Filter data by time range
  const filteredKp = filterByRange(kpIndex, rangeMs, (d) => d.timestamp);
  const filteredXray = filterByRange(xrayFlux, rangeMs, (d) => d.time);
  const filteredWind = filterByRange(solarWind, rangeMs, (d) => d.timestamp);

  // Decide which time formatter to use
  const timeFmt = range === '1w' ? formatDate : formatTime;

  // Prepare KP chart data
  const kpData = filteredKp.map((d) => ({
    time: timeFmt(d.timestamp),
    kp: d.kp ?? 0,
    fullTime: d.timestamp,
  }));

  // Prepare X-ray chart data
  const xrayData = filteredXray.map((d) => ({
    time: timeFmt(d.time),
    flux: d.flux ?? 0,
    class: d.class,
    isFlare: (d.flux ?? 0) > 1e-6,
    fullTime: d.time,
  }));

  // Prepare solar wind chart data
  const windData = filteredWind.map((d) => ({
    time: timeFmt(d.timestamp),
    speed: d.speed ?? 0,
    density: d.density ?? 0,
    fullTime: d.timestamp,
  }));

  // Bz chart data
  const bzData = filteredWind.map((d) => ({
    time: timeFmt(d.timestamp),
    bz: d.bz ?? 0,
    bx: d.bx ?? 0,
    by: d.by ?? 0,
    fullTime: d.timestamp,
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
      {/* Range toggle bar */}
      <div className="flex items-center justify-end">
        {rangeButtons}
      </div>

      {/* KP Index Chart */}
      <div className="chart-animate-in rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm" style={{ animationDelay: '0ms' }}>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-gray-400">
          Kp-index ({rangeLabel})
        </h3>
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
            <XAxis dataKey="time" stroke="#374151" tick={{ fontSize: 10 }} tickMargin={4} interval="preserveStartEnd" />
            <YAxis domain={[0, 9]} stroke="#374151" tick={{ fontSize: 10 }} label={{ value: 'Kp', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 11 } }} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={5} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'G2', fill: '#eab308', fontSize: 10 }} />
            <ReferenceLine y={7} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'G3', fill: '#ef4444', fontSize: 10 }} />
            <ReferenceLine y={8} stroke="#dc2626" strokeDasharray="4 4" label={{ value: 'G5', fill: '#dc2626', fontSize: 10 }} />
            <Area type="monotone" dataKey="kp" stroke="#FF6B35" strokeWidth={2} fill="url(#kpGrad)" name="Kp" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* X-ray Flux Chart */}
      <div className="chart-animate-in rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm" style={{ animationDelay: '120ms' }}>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-gray-400">
          X-ray Flux ({rangeLabel})
        </h3>
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
            <XAxis dataKey="time" stroke="#374151" tick={{ fontSize: 10 }} tickMargin={4} interval="preserveStartEnd" />
            <YAxis scale="log" domain={[1e-9, 1e-4]} tickFormatter={(v) => `${v.toExponential(0)}`} stroke="#374151" tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltip />} />
            {/* Flare class thresholds */}
            <ReferenceLine y={1e-6} stroke="#eab308" strokeDasharray="4 4" label={{ value: 'C-class', fill: '#eab308', fontSize: 10 }} />
            <ReferenceLine y={1e-5} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'M-class', fill: '#f97316', fontSize: 10 }} />
            <ReferenceLine y={1e-4} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'X-class', fill: '#ef4444', fontSize: 10 }} />
            <Area type="monotone" dataKey="flux" stroke="#FF6B35" strokeWidth={2} fill="url(#xrayGrad)" name="Flux" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Solar Wind Speed + Density */}
      <div className="chart-animate-in rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm" style={{ animationDelay: '240ms' }}>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-gray-400">
          Solar Wind Speed &amp; Density ({rangeLabel})
        </h3>
        <p className="mb-4 text-xs text-gray-600">Speed (km/s, solid) and Density (p/cm³, dashed)</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={windData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
            <XAxis dataKey="time" stroke="#374151" tick={{ fontSize: 10 }} tickMargin={4} interval="preserveStartEnd" />
            <YAxis yAxisId="left" domain={[0, 700]} stroke="#374151" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 20]} stroke="#374151" tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltip />} />
            <Area yAxisId="left" type="monotone" dataKey="speed" stroke="#00FF94" strokeWidth={2} fill="#00FF94" fillOpacity={0.05} name="Speed km/s" />
            <Area yAxisId="right" type="monotone" dataKey="density" stroke="#00D4AA" strokeWidth={2} strokeDasharray="5 5" fill="#00D4AA" fillOpacity={0.05} name="Density p/cm³" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bz Component */}
      <div className="chart-animate-in rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm" style={{ animationDelay: '360ms' }}>
        <h3 className="mb-1 text-sm font-semibold uppercase tracking-widest text-gray-400">
          Interplanetary Magnetic Field ({rangeLabel})
        </h3>
        <p className="mb-4 text-xs text-gray-600">Southward Bz drives geomagnetic storms (red = negative)</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={bzData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />
            <XAxis dataKey="time" stroke="#374151" tick={{ fontSize: 10 }} tickMargin={4} interval="preserveStartEnd" />
            <YAxis domain={[-15, 15]} stroke="#374151" tick={{ fontSize: 10 }} />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine y={0} stroke="#4a4f5e" strokeWidth={1} />
            <Area type="monotone" dataKey="bz" name="Bz" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={1.5} />
            <Area type="monotone" dataKey="bx" name="Bx" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.05} strokeWidth={1} />
            <Area type="monotone" dataKey="by" name="By" stroke="#a855f7" fill="#a855f7" fillOpacity={0.05} strokeWidth={1} />
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
