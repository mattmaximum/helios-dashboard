import InfoTip from './InfoTip';

type Score = 0 | 1 | 2;

const SCORE_COLOR: Record<Score, string> = {
  0: '#10B981',
  1: '#FBBF24',
  2: '#EF4444',
};

const RATING_CONFIG = {
  0: { label: 'Normal',             bg: 'bg-emerald-950/20', border: 'border-emerald-500/20', text: 'text-emerald-400', bar: 'from-transparent via-emerald-500/50 to-transparent' },
  1: { label: 'Slightly Irregular', bg: 'bg-yellow-950/20',  border: 'border-yellow-400/30',  text: 'text-yellow-400',  bar: 'from-transparent via-yellow-400/50 to-transparent' },
  2: { label: 'Highly Irregular',   bg: 'bg-red-950/20',     border: 'border-red-500/30',     text: 'text-red-400',     bar: 'from-transparent via-red-500/50 to-transparent' },
} as const;

function scoreKp(kp: number): Score {
  if (kp < 4) return 0;
  if (kp < 6) return 1;
  return 2;
}

function scoreWindSpeed(speed: number | null): Score {
  if (!speed || speed < 400) return 0;
  if (speed < 600) return 1;
  return 2;
}

function scoreXray(xrayClass: string): Score {
  const c = xrayClass[0]?.toUpperCase();
  if (c === 'X') return 2;
  if (c === 'M') return 1;
  return 0;
}

function scoreF107(f107: number | null): Score {
  if (!f107 || f107 < 100) return 0;
  if (f107 < 150) return 1;
  return 2;
}

// Weighted: Kp=40%, Wind=30%, X-Ray=20%, F10.7=10%
// Scale: 0=normal, 1=slightly irregular, 2=highly irregular
// Composite thresholds: <0.5 Normal, 0.5–1.2 Slightly Irregular, ≥1.2 Highly Irregular
function compositeScore(kpScore: Score, windScore: Score, xrayScore: Score, f107Score: Score): Score {
  const weighted = kpScore * 0.4 + windScore * 0.3 + xrayScore * 0.2 + f107Score * 0.1;
  if (weighted < 0.5) return 0;
  if (weighted < 1.2) return 1;
  return 2;
}

interface Props {
  currentKp: number;
  windSpeed: number | null;
  xrayClass: string;
  f107: number | null;
}

interface Factor {
  label: string;
  detail: string;
  score: Score;
  tooltip: string;
}

export default function SolarRating({ currentKp, windSpeed, xrayClass, f107 }: Props) {
  const kpScore   = scoreKp(currentKp);
  const windScore = scoreWindSpeed(windSpeed);
  const xrayScore = scoreXray(xrayClass);
  const f107Score = scoreF107(f107);
  const rating    = compositeScore(kpScore, windScore, xrayScore, f107Score);
  const cfg       = RATING_CONFIG[rating];

  const factors: Factor[] = [
    {
      label: 'Kp Index',
      detail: currentKp.toFixed(1),
      score: kpScore,
      tooltip: 'Kp 0–3 = Normal · 4–5 = Slightly Irregular · 6+ = Highly Irregular. Weight: 40% of composite.',
    },
    {
      label: 'Solar Wind',
      detail: windSpeed != null ? `${windSpeed} km/s` : '—',
      score: windScore,
      tooltip: 'Under 400 km/s = Normal · 400–600 = Slightly Irregular · >600 = Highly Irregular. Weight: 30% of composite.',
    },
    {
      label: 'X-Ray',
      detail: xrayClass,
      score: xrayScore,
      tooltip: 'A/B/C class = Normal · M-class = Slightly Irregular · X-class = Highly Irregular. Weight: 20% of composite.',
    },
    {
      label: 'F10.7',
      detail: f107 != null ? `${f107.toFixed(0)} sfu` : '—',
      score: f107Score,
      tooltip: 'F10.7cm radio flux — a proxy for solar UV output and sunspot activity. Under 100 sfu = Normal · 100–150 = Slightly Irregular · >150 = Highly Irregular. Weight: 10% of composite.',
    },
  ];

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cfg.border} ${cfg.bg} backdrop-blur-sm`}>
      <div className={`h-px w-full bg-gradient-to-r ${cfg.bar}`} />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3.5">

        {/* Composite rating */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: SCORE_COLOR[rating], boxShadow: `0 0 8px ${SCORE_COLOR[rating]}99` }}
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 leading-none mb-0.5">
              Current Solar Activity
            </p>
            <p className={`text-base font-bold leading-none ${cfg.text}`}>{cfg.label}</p>
          </div>
          <InfoTip content="Composite rating weighted across four inputs: Kp Index (40%), Solar Wind Speed (30%), X-Ray Flux (20%), and F10.7 Radio Flux (10%). Normal = no significant space weather. Slightly Irregular = elevated activity worth watching. Highly Irregular = active space weather with potential real-world impacts." />
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-7 w-px bg-gray-800/60 shrink-0" />

        {/* Factor chips */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {factors.map((f) => (
            <div key={f.label} className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">{f.label}</span>
              <span className="text-xs font-semibold text-gray-300 tabular-nums">{f.detail}</span>
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: SCORE_COLOR[f.score], boxShadow: `0 0 5px ${SCORE_COLOR[f.score]}88` }}
                title={f.tooltip}
              />
              <InfoTip content={f.tooltip} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
