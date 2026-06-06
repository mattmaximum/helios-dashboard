import { SolarEvent, EventSeverity } from '@/data/solarData';
import InfoTip from './InfoTip';

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
  return `${Math.floor(hrs / 24)}d ago`;
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
  return (
    <div className="rounded-xl border border-gray-800/40 bg-gray-950/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-800/40">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          Solar Events
        </h3>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 uppercase tracking-wider">
          72h
        </span>
        <InfoTip content="Significant solar events from the past 72 hours. Includes M1.0+ solar flares (radio/satellite impact potential), G1+ geomagnetic storm onsets (Kp ≥ 5), and active CME watches issued by NOAA SWPC. Lower-level background activity is filtered out." />
      </div>

      {/* Scrollable event list */}
      <div className="overflow-y-auto max-h-64 divide-y divide-gray-800/30 scrollbar-thin">
        {events.length === 0 ? (
          <div className="flex items-center gap-2 px-4 py-4">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/70 shrink-0" />
            <p className="text-xs text-gray-600">No significant events in the past 72 hours</p>
          </div>
        ) : (
          events.map((event) => {
            const color = SEVERITY_COLOR[event.severity];
            return (
              <div key={event.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                {/* Severity dot */}
                <div
                  className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}88` }}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Type + badge */}
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
