import { ExternalLink, Waves } from 'lucide-react';

const MODES = [
  { freq: '7.83', label: 'Fundamental' },
  { freq: '14.3', label: '1st Overtone' },
  { freq: '20.8', label: '2nd Overtone' },
  { freq: '27.3', label: '3rd Overtone' },
];

export default function SchumannResonance() {
  return (
    <div className="rounded-2xl border border-gray-800/40 bg-gray-950/50 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Label */}
        <div className="flex items-center gap-2 shrink-0">
          <Waves className="h-4 w-4 text-emerald-500/60" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Schumann Resonance</p>
            <p className="text-[10px] text-gray-600">Earth-ionosphere reference baseline</p>
          </div>
        </div>

        {/* Harmonic frequencies */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 justify-end">
          {MODES.map((m) => (
            <div key={m.label} className="flex items-baseline gap-1">
              <span className="text-sm font-bold tabular-nums text-gray-300">{m.freq}</span>
              <span className="text-[10px] text-emerald-600">Hz</span>
              <span className="text-[10px] text-gray-600 ml-0.5">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <a
            href="https://en.wikipedia.org/wiki/Schumann_resonance"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Wikipedia <ExternalLink className="h-2.5 w-2.5" />
          </a>
          <a
            href="https://www.vlf.it/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            VLF.it <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
