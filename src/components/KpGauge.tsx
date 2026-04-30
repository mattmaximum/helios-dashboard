import { cn } from '@/lib/utils';

interface Props {
  currentKp: number | null;
  kpIndex: { timestamp: string; kp: number | null }[];
}

export default function KpGauge({ currentKp, kpIndex }: Props) {
  // Build arc segments for the gauge
  const segments: { start: number; end: number; color: string; label: string }[] = [
    { start: 0, end: 1.99, color: '#059669', label: 'Q' },
    { start: 2, end: 2.99, color: '#65a30d', label: 'G1' },
    { start: 3, end: 3.99, color: '#ca8a04', label: 'G1' },
    { start: 4, end: 4.99, color: '#eab308', label: 'G2' },
    { start: 5, end: 5.99, color: '#f97316', label: 'G3' },
    { start: 6, end: 6.99, color: '#ef4444', label: 'G4' },
    { start: 7, end: 7.99, color: '#dc2626', label: 'G5' },
    { start: 8, end: 9, color: '#991b1b', label: 'G5' },
  ];

  if (currentKp == null) {
    return (
      <div className="rounded-2xl border border-gray-800/50 bg-gray-950/50 p-6 text-center backdrop-blur-sm">
        <p className="text-gray-500">Awaiting data…</p>
      </div>
    );
  }

  // Draw arc segments
  const cx = 150;
  const cy = 150;
  const r = 110;
  const rTick = 130;
  const rInner = 85;

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  return (
    <div className="rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400">Kp Index Gauge</h3>
      <div className="relative flex justify-center">
        <svg width="300" height="300" viewBox="0 0 300 300" className="w-full max-w-[300px]">
          {/* Background track */}
          <path d={describeArc(cx, cy, r, 0, 270)} fill="none" stroke="#1a1f2e" strokeWidth="18" strokeLinecap="round" />

          {/* Colored segments */}
          {segments.map((seg, i) => (
            <path
              key={i}
              d={describeArc(cx, cy, r, seg.start * 30, seg.end * 30)}
              fill="none"
              stroke={seg.color}
              strokeWidth="18"
              strokeLinecap="round"
              opacity={0.8}
            />
          ))}

          {/* Tick marks for 0-9 */}
          {Array.from({ length: 10 }, (_, i) => {
            const angle = i * 30;
            const outer = polarToCartesian(cx, cy, rTick, angle);
            const inner = polarToCartesian(cx, cy, r + 12, angle);
            const isCurrent = i === Math.floor(currentKp);
            return (
              <line
                key={i}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={isCurrent ? '#FF6B35' : '#374151'}
                strokeWidth={isCurrent ? 3 : 1.5}
              />
            );
          })}

          {/* Needle */}
          {(() => {
            const needleAngle = currentKp * 30;
            const needleLen = r - 25;
            const tip = polarToCartesian(cx, cy, needleLen, needleAngle);
            const tail = polarToCartesian(cx, cy, 20, needleAngle);
            return (
              <line
                x1={tail.x}
                y1={tail.y}
                x2={tip.x}
                y2={tip.y}
                stroke="#FF6B35"
                strokeWidth="3"
                strokeLinecap="round"
                className="drop-shadow-[0_0_6px_rgba(255,107,53,0.8)]"
              />
            );
          })()}

          {/* Needle dot */}
          <circle cx={cx} cy={cy} r="6" fill="#FF6B35" className="drop-shadow-[0_0_8px_rgba(255,107,53,0.6)]" />

          {/* Labels */}
          {Array.from({ length: 10 }, (_, i) => {
            const angle = i * 30;
            const pos = polarToCartesian(cx, cy, rInner - 20, angle);
            const isCurrent = i === Math.floor(currentKp);
            return (
              <text
                key={i}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isCurrent ? '#FF6B35' : '#6b7280'}
                fontSize={isCurrent ? 14 : 11}
                fontWeight={isCurrent ? 700 : 400}
              >
                {i}
              </text>
            );
          })}

          {/* Center text */}
          <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize="48" fontWeight="800">
            {currentKp.toFixed(1)}
          </text>
          <text x={cx} y={cy + 20} textAnchor="middle" dominantBaseline="central" fill="#9ca3af" fontSize="11" fontWeight="500" letterSpacing="3">
            CURRENT
          </text>
        </svg>
      </div>

      {/* Scale legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {[
          { label: 'Quiet', color: '#059669' },
          { label: 'G1 Minor', color: '#65a30d' },
          { label: 'G2 Moderate', color: '#eab308' },
          { label: 'G3 Strong', color: '#f97316' },
          { label: 'G4 Severe', color: '#ef4444' },
          { label: 'G5 Extreme', color: '#dc2626' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div style={{ backgroundColor: color }} className="h-2.5 w-2.5 rounded-sm" />
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
