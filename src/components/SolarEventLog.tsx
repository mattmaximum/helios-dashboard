import { useState } from 'react';
import { SolarEvent, EventSeverity } from '@/data/solarData';
import InfoTip from './InfoTip';

type TimeRange = '24h' | '72h' | '1w';

const RANGE_MS: Record<TimeRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '72h': 72 * 60 * 60 * 1000,
  '1w':  7  * 24 * 60 * 60 * 1000,
};

const RANGE_LABEL: Record<TimeRange, string> = {
  '24h': '24H',
  '72h': '72H',
  '1w':  '1W',
};

const SEVERITY_COLOR: Record<EventSeverity, string> = {
  minor:    '#84cc16',
  moderate: '#eab308',
  severe:   '#f97316',
  extreme:  '#ef4444',
};

const TYPE_LABEL: Record<SolarEvent['type'], string> = {
  flare: 'Flare',
  storm: 'Storm',
  cme:   'Watch',
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 5)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(diffMs / 3_600_000);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function absTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  events: SolarEvent[];
}

export default function SolarEventLog({ events }: Props) {
  const [range, setRange] = useState<TimeRange>('72h');

  const cutoff = Date.now() - RANGE_MS[range];
  const visible = events.filter((e) => new Date(e.time).getTime() >= cutoff);

  return (
    <div className="rounded-xl border border-gray-800/40 bg-gray-950/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-800/40">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          Solar Event History
        </h3>
        <InfoTip content="Significant solar events filtered by the selected time window. Includes M1.0+ solar flares (radio/satellite impact potential), G1+ geomagnetic storm onsets (Kp ≥ 5), and CME watches issued by NOAA SWPC. Lower-level background activity is filtered out." />

        {/* Time range toggle */}
        <div className="ml-auto flex items-center gap-0.5 rounded-lg border border-gray-800/60 bg-gray-900/60 p-0.5">
          {(['24h', '72h', '1w'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all ${
                range === r
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable event list */}
      <div className="overflow-y-auto max-h-64 divide-y divide-gray-800/30">
        {visible.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-4">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/70 shrink-0" />
            <p className="text-xs text-gray-600">
              No significant events in the past {{ '24h': '24 hours', '72h': '72 hours', '1w': 'week' }[range]}
            </p>
          </div>
        ) : (
          visible.map((event) => {
            const color = SEVERITY_COLOR[event.severity];
            return (
              <div
                key={event.id}
                className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                {/* Severity dot */}
                <div
                  className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}88` }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                      style={{
                        backgroundColor: `${color}18`,
                        color,
                        border: `1px solid ${color}33`,
                      }}
                    >
                      {TYPE_LABEL[event.type]} · {event.badge}
                    </span>
                    <span className="text-xs font-semibold text-gray-300 truncate">
                      {event.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-snug truncate">
                    {event.detail}
                  </p>
                </div>

                {/* Time */}
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-gray-500 whitespace-nowrap">{relativeTime(event.time)}</p>
                  <p className="text-[9px] text-gray-700 whitespace-nowrap">{absTime(event.time)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
