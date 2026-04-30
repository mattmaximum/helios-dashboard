import { AlertTriangle, Shield, Wind, Zap } from 'lucide-react';
import type { StormLevel } from '@/data/solarData';

interface Props {
  stormLevel: StormLevel | null;
  currentKp: number | null;
  lastUpdated: number;
}

const stormIcons: Record<string, typeof AlertTriangle> = {
  quiet: Shield,
  minor: Wind,
  moderate: Wind,
  strong: Zap,
  severe: Zap,
  extreme: AlertTriangle,
};

const stormClasses: Record<string, string> = {
  G0: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  G1: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
  G2: 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]',
  G3: 'text-orange-400 drop-shadow-[0_0_12px_rgba(255,140,66,0.6)]',
  G4: 'text-red-400 drop-shadow-[0_0_16px_rgba(239,68,68,0.7)]',
  G5: 'text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-pulse',
};

const bgGradients: Record<string, string> = {
  G0: 'from-emerald-950/30 via-transparent to-transparent',
  G1: 'from-emerald-900/20 via-transparent to-transparent',
  G2: 'from-yellow-950/30 via-transparent to-orange-950/20',
  G3: 'from-orange-950/30 via-transparent to-red-950/20',
  G4: 'from-red-950/30 via-transparent to-red-900/20',
  G5: 'from-red-900/40 via-red-950/30 to-red-800/30',
};

const borderColors: Record<string, string> = {
  G0: 'border-emerald-500/30',
  G1: 'border-emerald-400/20',
  G2: 'border-yellow-400/30',
  G3: 'border-orange-400/40',
  G4: 'border-red-400/40',
  G5: 'border-red-500/50',
};

const glowColors: Record<string, string> = {
  G0: 'shadow-emerald-500/10',
  G1: 'shadow-emerald-400/10',
  G2: 'shadow-yellow-400/10',
  G3: 'shadow-orange-500/15',
  G4: 'shadow-red-500/20',
  G5: 'shadow-red-500/30',
};

export default function StormAlert({ stormLevel, currentKp, lastUpdated }: Props) {
  const iconKey = stormLevel
    ? stormLevel.code === 'G0'
      ? 'quiet'
      : stormLevel.code
        ? stormLevel.code.toLowerCase()
        : 'quiet'
    : 'quiet';
  const Icon = stormIcons[iconKey] || Shield;
  const code = stormLevel?.code || 'G0';
  const isSevere = code === 'G4' || code === 'G5';
  const isWarning = code === 'G3';

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border ${borderColors[code]} shadow-xl ${glowColors[code]} bg-gradient-to-br ${bgGradients[code]} backdrop-blur-xl`}
    >
      {/* Aurora bar at top */}
      <div
        className={`h-1 w-full bg-gradient-to-r transition-all duration-1000 ${
          code <= 'G1'
            ? 'from-transparent via-emerald-500 to-transparent'
            : code <= 'G2'
              ? 'from-transparent via-yellow-400 to-transparent'
              : code <= 'G3'
                ? 'from-transparent via-orange-500 to-transparent'
                : 'from-transparent via-red-500 to-red-400 via-transparent'
        }`}
      />

      <div className="relative px-6 py-8 md:px-12 md:py-12 lg:px-16 lg:py-14">
        {/* Grid overlay pattern */}
        <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FF6B35" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <div className="relative flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
          {/* Left: Kp gauge mini */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28 md:h-32 md:w-32">
              {/* Outer glow ring */}
              <div
                className={`absolute inset-0 rounded-full blur-sm ${
                  isSevere ? 'bg-red-500/30' : isWarning ? 'bg-orange-500/20' : 'bg-emerald-500/15'
                }`}
              />
              <div
                className={`relative flex h-24 w-24 items-center justify-center rounded-full border-2 sm:h-28 sm:w-28 md:h-32 md:w-32 ${
                  code <= 'G1' ? 'border-emerald-500/40 bg-emerald-950/20' : code <= 'G2' ? 'border-yellow-400/30 bg-yellow-950/10' : code <= 'G3' ? 'border-orange-400/30 bg-orange-900/10' : 'border-red-500/40 bg-red-900/20'
                }`}
              >
                {code === 'G0' && (
                  <Shield className={`h-10 w-10 sm:h-12 sm:w-12 ${stormClasses[code]}`} />
                )}
                {(code >= 'G1' && code <= 'G2') && (
                  <Wind className={`h-10 w-10 sm:h-12 sm:w-12 ${stormClasses[code]}`} />
                )}
                {(code === 'G3') && (
                  <Zap className={`h-10 w-10 sm:h-12 sm:w-12 ${stormClasses[code]}`} />
                )}
                {(code === 'G4' || code === 'G5') && (
                  <AlertTriangle className={`h-10 w-10 sm:h-12 sm:w-12 ${stormClasses[code]} ${isSevere ? 'animate-pulse' : ''}`} />
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className={`text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl tabular-nums text-white`}>
                  {currentKp ?? '—'}
                </span>
                <span className={`text-2xl font-semibold sm:text-3xl ${stormClasses[code]}`}>
                  / 9
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-bold sm:text-lg md:text-xl ${stormClasses[code]}`}>
                  {stormLevel?.label || 'Quiet'}
                </span>
                <span className={`rounded-lg border px-2 py-0.5 text-sm font-bold sm:text-base ${
                  code <= 'G1'
                    ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
                    : code <= 'G2'
                      ? 'border-yellow-400/30 bg-yellow-950/30 text-yellow-400'
                      : code <= 'G3'
                        ? 'border-orange-400/30 bg-orange-950/30 text-orange-400'
                        : 'border-red-400/30 bg-red-950/40 text-red-400'
                }`}>
                  {code}
                </span>
              </div>
            </div>
          </div>

          {/* Center: description */}
          <div className="max-w-md text-center md:text-left">
            <p className="text-sm font-medium uppercase tracking-widest text-gray-500">
              Geomagnetic Storm Status
            </p>
            <p className="mt-1 text-base text-gray-300 md:text-lg">
              {stormLevel?.description || 'Active geomagnetic monitoring'}
            </p>
          </div>

          {/* Right: refresh info */}
          <div className="flex flex-col items-end gap-1 text-right">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Last Updated
            </span>
            <span className="text-sm tabular-nums text-gray-400">
              {lastUpdated ? new Date(lastUpdated).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
            </span>
            <span className="text-xs text-gray-600">
              Project Helios
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
