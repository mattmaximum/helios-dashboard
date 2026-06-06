import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { StormLevel } from '@/data/solarData';
import InfoTip from './InfoTip';

interface Props {
  stormLevel: StormLevel | null;
  currentKp: number | null;
  lastUpdated: number;
}

const STATUS_CONFIG: Record<string, {
  textClass: string;
  borderClass: string;
  gradientClass: string;
  badgeClass: string;
  barClass: string;
}> = {
  G0: { textClass: 'text-emerald-400', borderClass: 'border-emerald-500/20', gradientClass: 'from-emerald-950/20 to-transparent', badgeClass: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400', barClass: 'from-transparent via-emerald-500 to-transparent' },
  G1: { textClass: 'text-emerald-400', borderClass: 'border-emerald-400/20', gradientClass: 'from-emerald-950/15 to-transparent', badgeClass: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400', barClass: 'from-transparent via-emerald-400 to-transparent' },
  G2: { textClass: 'text-yellow-400', borderClass: 'border-yellow-400/30', gradientClass: 'from-yellow-950/20 to-transparent', badgeClass: 'border-yellow-400/30 bg-yellow-950/30 text-yellow-400', barClass: 'from-transparent via-yellow-400 to-transparent' },
  G3: { textClass: 'text-orange-400', borderClass: 'border-orange-400/40', gradientClass: 'from-orange-950/20 to-transparent', badgeClass: 'border-orange-400/30 bg-orange-950/30 text-orange-400', barClass: 'from-transparent via-orange-500 to-transparent' },
  G4: { textClass: 'text-red-400', borderClass: 'border-red-400/40', gradientClass: 'from-red-950/25 to-transparent', badgeClass: 'border-red-400/30 bg-red-950/40 text-red-400', barClass: 'from-transparent via-red-500 to-transparent' },
  G5: { textClass: 'text-red-500', borderClass: 'border-red-500/50', gradientClass: 'from-red-950/30 to-transparent', badgeClass: 'border-red-400/30 bg-red-950/40 text-red-400', barClass: 'from-transparent via-red-500 to-red-400 via-transparent' },
};

export default function StormStatus({ stormLevel, currentKp, lastUpdated }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState(false);

  const code = stormLevel?.code || 'G0';
  const cfg = STATUS_CONFIG[code] ?? STATUS_CONFIG.G0;

  const handleShare = async () => {
    if (!cardRef.current) return;
    setCapturing(true);
    setCaptureError(false);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const kpStr = currentKp != null ? currentKp.toFixed(1) : '0.0';
      const dataUrl = await toPng(cardRef.current, { backgroundColor: '#030712', pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `helios-${code}-Kp${kpStr}-${dateStr}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setCaptureError(true);
      setTimeout(() => setCaptureError(false), 3000);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden rounded-xl border ${cfg.borderClass} bg-gradient-to-r ${cfg.gradientClass} backdrop-blur-sm`}
    >
      {/* Accent bar */}
      <div className={`h-px w-full bg-gradient-to-r ${cfg.barClass}`} />

      <div className="flex items-center justify-between gap-4 px-5 py-4">
        {/* Kp reading */}
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular-nums text-white">{currentKp ?? '—'}</span>
              <span className={`text-base font-semibold ${cfg.textClass}`}>/ 9</span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 mt-0.5">Kp Index</p>
          </div>
          <span className={`rounded-md border px-2 py-1 text-sm font-bold ${cfg.badgeClass}`}>{code}</span>
        </div>

        {/* Status text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className={`text-sm font-semibold ${cfg.textClass}`}>{stormLevel?.label || 'Quiet'}</p>
            <InfoTip content="NOAA's G-scale rates geomagnetic storm severity from G1 (minor) to G5 (extreme). G2+ causes measurable satellite drag and power grid fluctuations. G3+ means auroras can be seen as far south as Oregon and Illinois. G5 events can damage transformers and knock out GPS globally." />
          </div>
          <p className="text-xs text-gray-500 truncate">{stormLevel?.description || 'Quiet geomagnetic conditions'}</p>
        </div>

        {/* Share + timestamp */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <button
            onClick={handleShare}
            disabled={capturing}
            title="Capture as PNG"
            className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition-all ${
              captureError
                ? 'border-red-500/40 bg-red-950/40 text-red-400'
                : capturing
                  ? 'border-gray-700 bg-gray-800 text-gray-500 cursor-wait'
                  : 'border-gray-700/50 bg-gray-900/60 text-gray-500 hover:text-gray-300'
            }`}
          >
            <Camera className="h-3 w-3" />
            {captureError ? 'Failed' : capturing ? 'Saving…' : 'Share'}
          </button>
          <span className="text-[10px] tabular-nums text-gray-600">
            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString(undefined, { timeStyle: 'short' }) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
