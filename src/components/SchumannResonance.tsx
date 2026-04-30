import { Activity, Globe, Waves, ExternalLink } from 'lucide-react';

export default function SchumannResonance() {
  // Schumann resonance frequencies (approximate)
  const modes = [
    { harmonic: 1, freq: '7.83', band: 'Hz', label: 'Fundamental' },
    { harmonic: 2, freq: '14.3', band: 'Hz', label: '1st Overtone' },
    { harmonic: 3, freq: '20.8', band: 'Hz', label: '2nd Overtone' },
    { harmonic: 4, freq: '27.3', band: 'Hz', label: '3rd Overtone' },
    { harmonic: 5, freq: '33.8', band: 'Hz', label: '4th Overtone' },
    { harmonic: 6, freq: '40.3', band: 'Hz', label: '5th Overtone' },
  ];

  return (
    <div className="rounded-2xl border border-gray-800/40 bg-gray-950/50 p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800/40 bg-gray-900/60">
          <Activity className="h-4 w-4 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-300">
            Schumann Resonance
          </h3>
          <p className="text-xs text-gray-600">Earth-ionosphere cavity resonance</p>
        </div>
      </div>

      {/* Main frequency display */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-950/30 to-gray-950/50 border border-emerald-900/20 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 mb-2">
          Global Baseline — Earth-ionosphere resonance
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-5xl font-bold text-emerald-400 tabular-nums">7.83</span>
          <span className="text-xl text-emerald-600 font-medium">Hz</span>
        </div>
        {(() => {
          // Visualize the sine wave
          const bars = 60;
          const points: { x: number; y: number }[] = [];
          for (let i = 0; i <= bars; i++) {
            const x = (i / bars) * 100;
            const y = Math.sin((i / bars) * Math.PI * 2) * 30;
            points.push({ x, y });
          }
          return (
            <svg className="mt-4 opacity-50" viewBox={`0 0 ${bars} 60`} preserveAspectRatio="none">
              <polyline
                points={points.map((p) => `${p.x},${30 + p.y}`).join(' ')}
                fill="none"
                stroke="#00FF94"
                strokeWidth="1"
                strokeLinecap="round"
                className="drop-shadow-[0_0_4px_rgba(0,255,148,0.3)]"
              />
            </svg>
          );
        })()}
      </div>

      {/* Harmonic modes */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {modes.slice(0, 4).map((mode) => (
          <div
            key={mode.harmonic}
            className="rounded-xl border border-gray-800/30 bg-gray-950/40 p-3 text-center hover:border-emerald-800/30 hover:bg-emerald-950/10 transition-all"
          >
            <span className="text-lg font-bold text-gray-300 tabular-nums tracking-tight">{mode.freq}</span>
            <span className="text-xs text-emerald-600"> Hz</span>
            <p className="text-xs text-gray-600 mt-1">{mode.label}</p>
          </div>
        ))}
      </div>

      {/* External links */}
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href="https://www.heartmath.org/research/schumann-resonance/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-gray-800/40 bg-gray-900/40 px-3 py-2 text-xs text-gray-400 hover:text-emerald-400 hover:border-emerald-800/30 transition-all"
        >
          HeartMath Research
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href="https://www.vlf.it/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-gray-800/40 bg-gray-900/40 px-3 py-2 text-xs text-gray-400 hover:text-emerald-400 hover:border-emerald-800/30 transition-all"
        >
          VLF.it Network
          <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href="https://en.wikipedia.org/wiki/Schumann_resonance"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-gray-800/40 bg-gray-900/40 px-3 py-2 text-xs text-gray-400 hover:text-emerald-400 hover:border-emerald-800/30 transition-all"
        >
          Wikipedia
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Note */}
      <div className="mt-4 rounded-lg border border-amber-900/20 bg-amber-950/10 p-3">
        <p className="text-xs text-amber-400/70">
          <Waves className="inline h-3 w-3 mr-1 -mt-0.5" />
          Schumann resonance frequencies are theoretical baselines. Real-time monitoring requires dedicated VLF receivers.
          Data will be connected in a future phase.
        </p>
      </div>
    </div>
  );
}
