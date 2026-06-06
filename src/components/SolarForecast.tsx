import InfoTip from './InfoTip';
import { KpForecastPoint, SpaceWeatherAlert } from '@/data/solarData';

// Same palette as KpGauge
const G_COLOR: Record<string, string> = {
  G0: '#059669',
  G1: '#84cc16',
  G2: '#eab308',
  G3: '#f97316',
  G4: '#ef4444',
  G5: '#7f1d1d',
};

const G_LABEL: Record<string, string> = {
  G0: 'Quiet', G1: 'Minor', G2: 'Moderate', G3: 'Strong', G4: 'Severe', G5: 'Extreme',
};

function kpToGScale(kp: number): string {
  if (kp < 5) return 'G0';
  if (kp < 6) return 'G1';
  if (kp < 7) return 'G2';
  if (kp < 8) return 'G3';
  if (kp < 9) return 'G4';
  return 'G5';
}

function alertColor(gScale: string | null): string {
  if (!gScale) return '#FBBF24';
  return G_COLOR[gScale] ?? '#FBBF24';
}

interface Props {
  kpForecast: KpForecastPoint[];
  spaceWeatherAlerts: SpaceWeatherAlert[];
}

export default function SolarForecast({ kpForecast, spaceWeatherAlerts }: Props) {
  const now = Date.now();

  // Window: last 6 hours → next 72 hours
  const windowStart = now - 6 * 60 * 60 * 1000;
  const windowEnd   = now + 72 * 60 * 60 * 1000;

  const strips = kpForecast.filter((p) => {
    const t = new Date(p.time).getTime();
    return t >= windowStart && t <= windowEnd;
  });

  if (strips.length === 0) return null;

  const activeAlerts = spaceWeatherAlerts.filter(
    (a) => now - new Date(a.issueTime).getTime() <= 72 * 60 * 60 * 1000
  );

  const startMs = new Date(strips[0].time).getTime();
  const endMs   = new Date(strips[strips.length - 1].time).getTime() + 3 * 60 * 60 * 1000;
  const span    = endMs - startMs;

  const nowPct = Math.max(0, Math.min(100, ((now - startMs) / span) * 100));

  // Day boundary markers (each midnight within the window)
  const dayMarkers: { pct: number; label: string }[] = [];
  const seen = new Set<string>();
  for (const p of strips) {
    const d = new Date(p.time);
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!seen.has(dayKey)) {
      seen.add(dayKey);
      const pct = ((new Date(p.time).getTime() - startMs) / span) * 100;
      const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      dayMarkers.push({ pct, label });
    }
  }

  return (
    <div className="rounded-xl border border-gray-800/40 bg-gray-950/50 p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">72-hr Kp Forecast</h3>
        <InfoTip content="NOAA SWPC 3-day Kp forecast, updated every 3 hours. Faded blocks = already observed. Bright blocks = predicted. Hover any block for the exact predicted Kp and G-scale. Colors match the gauge above." />
        <span className="ml-auto text-[10px] uppercase tracking-wider text-gray-700">NOAA SWPC</span>
      </div>

      {/* Segmented strip */}
      <div className="relative">
        {/* NOW label sits above the strip */}
        <div
          className="absolute -top-4 -translate-x-1/2 text-[9px] font-bold text-white/60 whitespace-nowrap pointer-events-none"
          style={{ left: `${nowPct}%` }}
        >
          NOW
        </div>

        {/* Strip */}
        <div className="relative flex rounded-md overflow-hidden h-7" style={{ gap: '1px' }}>
          {strips.map((point) => {
            const gScale   = kpToGScale(point.kp);
            const color    = G_COLOR[gScale];
            const isPast   = point.observed !== 'predicted';
            const timeStr  = new Date(point.time).toLocaleString(undefined, {
              weekday: 'short', hour: '2-digit', minute: '2-digit',
            });
            return (
              <div
                key={point.time}
                title={`${timeStr} — Kp ${point.kp.toFixed(1)} · ${gScale} ${G_LABEL[gScale]} · ${point.observed}`}
                className="flex-1 cursor-default"
                style={{ backgroundColor: color, opacity: isPast ? 0.35 : 0.85 }}
              />
            );
          })}

          {/* NOW line overlaid on the strip */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/70 pointer-events-none"
            style={{ left: `${nowPct}%` }}
          />
        </div>

        {/* Day labels below strip */}
        <div className="relative h-4 mt-1">
          {dayMarkers.map(({ pct, label }) => (
            <span
              key={label}
              className="absolute text-[9px] text-gray-600 -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${pct}%` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
        {Object.entries(G_COLOR).map(([scale, color]) => (
          <div key={scale} className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[9px] text-gray-500">{scale}</span>
          </div>
        ))}
        <span className="text-[9px] text-gray-700 ml-auto">faded = observed</span>
      </div>

      {/* Space Weather Watches / CME alerts */}
      <div className="mt-3 border-t border-gray-800/40 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Space Weather Watches</p>
          <InfoTip content="Active geomagnetic storm watches and CME arrival advisories issued by NOAA SWPC. A 'watch' means conditions are favorable for a storm; a 'warning' means onset is imminent. CME advisories include estimated arrival time when available." />
        </div>
        {activeAlerts.length === 0 ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/80 shrink-0" />
            <p className="text-xs text-gray-600">No active watches or advisories</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {activeAlerts.slice().reverse().slice(0, 3).map((alert, i) => {
              const color = alertColor(alert.gScale);
              const timeStr = alert.issueTime
                ? (() => {
                    const d = new Date(alert.issueTime);
                    return isNaN(d.getTime()) ? alert.issueTime : d.toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    });
                  })()
                : '';
              return (
                <div key={i} className="flex gap-2 items-start">
                  <div
                    className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}88` }}
                  />
                  <div>
                    {timeStr && (
                      <p className="text-[10px] text-gray-600 leading-none mb-0.5">{timeStr}</p>
                    )}
                    <p className="text-xs text-gray-300 leading-snug">{alert.summary}</p>
                    {alert.gScale && (
                      <span
                        className="mt-1 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
                      >
                        {alert.gScale} · {G_LABEL[alert.gScale]}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
