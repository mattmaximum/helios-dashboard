import { getStormLevel, getStormLevelNumeric } from '@/data/solarData';
import InfoTip from './InfoTip';

interface Props {
  currentKp: number | null;
}

// flex values sum to 9 — each unit = 1 Kp, so arrow position maps linearly
const SEGMENTS = [
  { label: 'Quiet',   sublabel: 'Kp < 5',  color: '#059669', flex: 5 },
  { label: 'G1',      sublabel: 'Minor',    color: '#84cc16', flex: 1 },
  { label: 'G2',      sublabel: 'Moderate', color: '#eab308', flex: 1 },
  { label: 'G3',      sublabel: 'Strong',   color: '#f97316', flex: 1 },
  { label: 'G4',      sublabel: 'Severe',   color: '#ef4444', flex: 0.7 },
  { label: 'G5',      sublabel: 'Extreme',  color: '#7f1d1d', flex: 0.3 },
];
const TOTAL_FLEX = SEGMENTS.reduce((s, seg) => s + seg.flex, 0); // = 9

function glowPulseClass(level: number): string {
  if (level >= 4) return 'kp-glow-pulse-g4';
  if (level === 3) return 'kp-glow-pulse-g3';
  if (level === 2) return 'kp-glow-pulse-g2';
  return '';
}

export default function KpGauge({ currentKp }: Props) {
  if (currentKp == null) {
    return (
      <div className="rounded-2xl border border-gray-800/50 bg-gray-950/50 p-6 flex items-center justify-center backdrop-blur-sm">
        <p className="text-gray-500 text-sm">Awaiting data…</p>
      </div>
    );
  }

  const level = getStormLevelNumeric(currentKp);
  const stormLevel = getStormLevel(currentKp);
  const clampedKp = Math.min(Math.max(currentKp, 0), 9);
  // Arrow position as % of bar width (linear: 0 = left edge, 9 = right edge)
  const arrowPct = (clampedKp / TOTAL_FLEX) * 100;

  return (
    <div className="rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-400">Kp Index</h3>
        <InfoTip content="The planetary K-index (Kp) measures global geomagnetic disturbance on a 0–9 scale, updated every 15 minutes. Kp 0–4 is quiet. Kp 5 starts a G1 minor storm. Kp 6+ (G2) is when real-world impacts begin — satellite drag, power grid fluctuations, and auroras visible in the northern US." />
      </div>

      {/* Current Kp display */}
      <div className="flex items-end gap-3 mb-6">
        <span
          className="text-5xl font-bold tabular-nums leading-none"
          style={{ color: stormLevel.color }}
        >
          {clampedKp.toFixed(1)}
        </span>
        <p className="mb-1 text-sm font-semibold" style={{ color: stormLevel.color }}>
          {stormLevel.label}
        </p>
      </div>

      {/* Bar + arrow — flex-1 so it fills remaining space, content centered */}
      <div className={`flex flex-col ${glowPulseClass(level)}`}>
        {/* Arrow row */}
        <div className="relative h-4 mb-1">
          <div
            className="absolute top-0 -translate-x-1/2 transition-all duration-700 ease-out"
            style={{ left: `${arrowPct}%` }}
          >
            {/* Downward-pointing triangle */}
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderTop: `9px solid ${stormLevel.color}`,
                filter: `drop-shadow(0 0 4px ${stormLevel.color}88)`,
              }}
            />
          </div>
        </div>

        {/* Colored bar */}
        <div className="flex rounded-lg overflow-hidden h-5" style={{ gap: '1px' }}>
          {SEGMENTS.map((seg) => (
            <div
              key={seg.label}
              style={{ flex: seg.flex, backgroundColor: seg.color }}
              className="opacity-80"
            />
          ))}
        </div>

        {/* Segment labels */}
        <div className="flex mt-2">
          {SEGMENTS.map((seg) => (
            <div
              key={seg.label}
              style={{ flex: seg.flex }}
              className="flex flex-col items-center"
            >
              <span className="text-[10px] font-bold text-gray-400 leading-tight">{seg.label}</span>
              <span className="text-[9px] text-gray-600 leading-tight hidden sm:block">{seg.sublabel}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
