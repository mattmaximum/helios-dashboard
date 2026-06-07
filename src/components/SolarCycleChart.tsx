import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import InfoTip from './InfoTip';
import { useTime } from '@/context/TimeContext';
import type { SolarCyclePoint } from '@/data/solarData';

// Officially announced by NOAA/ISES: Cycle 25 began December 2019
const CYCLE25_MIN_TS = new Date('2019-12-01T00:00:00Z').getTime();

interface Props {
  solarCycle: SolarCyclePoint[];
}

export default function SolarCycleChart({ solarCycle }: Props) {
  const { mode: timeMode } = useTime();
  const now = Date.now();

  const tickFormatter = (ms: number) => {
    const d = new Date(ms);
    return String(timeMode === 'utc' ? d.getUTCFullYear() : d.getFullYear());
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tooltipContent = useMemo(() => function TooltipContent({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    const tz = timeMode === 'utc' ? 'UTC' : undefined;
    const sfx = timeMode === 'utc' ? ' UTC' : '';
    const timeStr = label != null
      ? new Date(label).toLocaleDateString(undefined, { year: 'numeric', month: 'short', timeZone: tz }) + sfx
      : '';
    // Filter out the invisible stacking helpers
    const visible = payload.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.value != null && p.value !== 0 && p.dataKey !== 'bandBase'
    );
    if (!visible.length) return null;
    return (
      <div className="rounded-lg border border-gray-700/60 bg-gray-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
        {timeStr && <p className="mb-1 font-semibold text-gray-300">{timeStr}</p>}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {visible.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || '#fff' }}>
            {p.name}: {typeof p.value?.toFixed === 'function' ? p.value.toFixed(1) : p.value}
          </p>
        ))}
      </div>
    );
  }, [timeMode]);

  if (solarCycle.length === 0) return null;

  return (
    <div
      className="chart-animate-in rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm"
      style={{ animationDelay: '480ms' }}
    >
      <div className="mb-1 flex items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          Solar Cycle Progress
        </h3>
        <InfoTip content="Monthly sunspot number (SSN) tracks where we are in the ~11-year solar cycle. Cycle 25 began at solar minimum in December 2019. Higher SSN = more sunspots = more solar flares, CMEs, and geomagnetic storm risk. We are past the Cycle 25 peak and entering the declining phase toward the next minimum (~2030). The yellow dashed line shows NOAA's predicted decline; the shaded band is the confidence range." />
        <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-700">NOAA SWPC / SILSO</span>
      </div>
      <p className="mb-4 text-xs text-gray-600">
        Sunspot number — observed (orange) · smoothed trend (bold) · predicted decline (dashed yellow)
      </p>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={solarCycle} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="ssnGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#FF6B35" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1a1f2e" />

          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={tickFormatter}
            stroke="#374151"
            tick={{ fontSize: 10 }}
            tickMargin={4}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 220]}
            stroke="#374151"
            tick={{ fontSize: 10 }}
            tickMargin={4}
            label={{ value: 'SSN', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 11 } }}
          />

          <Tooltip content={tooltipContent} />

          {/* Raw monthly SSN — faint background noise layer */}
          <Area
            type="monotone"
            dataKey="ssn"
            name="Monthly SSN"
            stroke="#6b7280"
            strokeWidth={0.5}
            fill="url(#ssnGrad)"
            connectNulls={false}
            dot={false}
            activeDot={false}
          />

          {/* Smoothed observed SSN — bold trend */}
          <Area
            type="monotone"
            dataKey="smoothed"
            name="Smoothed SSN"
            stroke="#FF6B35"
            strokeWidth={2.5}
            fill="none"
            connectNulls={false}
            dot={false}
          />

          {/* Confidence band: invisible base (low bound) + colored band range stacked on top */}
          <Area
            type="monotone"
            dataKey="bandBase"
            stackId="cb"
            stroke="none"
            fill="none"
            connectNulls
            dot={false}
            activeDot={false}
            legendType="none"
          />
          <Area
            type="monotone"
            dataKey="bandTop"
            stackId="cb"
            name="Confidence range"
            stroke="none"
            fill="#eab308"
            fillOpacity={0.13}
            connectNulls
            dot={false}
            activeDot={false}
          />

          {/* Predicted SSN — dashed yellow line */}
          <Area
            type="monotone"
            dataKey="predicted"
            name="Predicted SSN"
            stroke="#eab308"
            strokeWidth={2}
            strokeDasharray="5 3"
            fill="none"
            connectNulls
            dot={false}
          />

          {/* Cycle 25 minimum reference */}
          <ReferenceLine
            x={CYCLE25_MIN_TS}
            stroke="#4b5563"
            strokeDasharray="4 3"
            label={{ value: 'Cycle 25 Min', fill: '#6b7280', fontSize: 9, position: 'insideTopRight' }}
          />

          {/* NOW line */}
          <ReferenceLine
            x={now}
            stroke="#ffffff"
            strokeOpacity={0.25}
            strokeWidth={1.5}
            label={{ value: 'NOW', fill: '#9ca3af', fontSize: 9, position: 'insideTopLeft' }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-5 rounded bg-gray-500/60" />
          <span className="text-[10px] text-gray-600">Monthly SSN</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-5 rounded" style={{ background: '#FF6B35' }} />
          <span className="text-[10px] text-gray-500">Smoothed trend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-0.5 w-5 border-b-2 border-dashed border-yellow-400/70" />
          <span className="text-[10px] text-gray-500">Predicted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm border border-yellow-400/30 bg-yellow-400/10" />
          <span className="text-[10px] text-gray-500">Confidence range</span>
        </div>
        <span className="ml-auto text-[9px] text-gray-700">Cycle 25 started Dec 2019 · next min ~2030</span>
      </div>
    </div>
  );
}
