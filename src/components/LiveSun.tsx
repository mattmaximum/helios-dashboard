import { useState } from 'react';
import { Sun, Eye, EyeOff } from 'lucide-react';
import { getSunImageUrl, getWavelengthOptions, WavelengthKey } from '@/data/solarData';

export default function LiveSun() {
  const [wavelength, setWavelength] = useState<WavelengthKey>('193');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const options = getWavelengthOptions();
  const current = options.find((o) => o.key === wavelength)!;
  const imageUrl = getSunImageUrl(wavelength);

  const wavelengthColors: Record<WavelengthKey, string> = {
    '171': '#fbbf24',
    '193': '#22d3ee',
    '304': '#f97316',
    hmi: '#94a3b8',
  };

  return (
    <div className="rounded-2xl border border-gray-800/40 bg-gray-950/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800/30 px-6 py-4">
        <div className="flex items-center gap-3">
          <Sun className="h-5 w-5 text-orange-400" />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-300">
            Live Solar Imagery — SDO
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          </span>
          <span className="text-xs font-semibold text-red-400">LIVE</span>
        </div>
      </div>

      {/* Image area */}
      <div className="relative aspect-square w-full bg-gray-950">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-400/30 border-t-orange-400" />
              <p className="text-xs text-gray-500">Loading solar imagery…</p>
            </div>
          </div>
        )}
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <EyeOff className="h-10 w-10 text-red-400/50" />
              <p className="text-sm text-gray-400">Image unavailable — showing placeholder</p>
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-400 hover:underline"
              >
                Open directly from NASA SDO
              </a>
            </div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={`Sun in ${current.name}`}
          className={`${imageLoaded ? 'block' : 'hidden'} h-full w-full object-cover transition-opacity duration-500`}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          crossOrigin="anonymous"
        />

        {/* Overlay text */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 backdrop-blur-sm">
          <img
            src={getSunImageUrl(wavelength)}
            alt=""
            className="h-0 w-0"
            onLoad={(e) => !imageLoaded && setImageLoaded(true)}
          />
          <span className="text-xs text-gray-300" title={current.name}>
            {imageUrl.split('/').pop()?.replace('.jpg', 'Å') || current.name}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-t border-gray-800/30 px-4 py-3">
        <div className="flex overflow-x-auto gap-2 pb-1">
          {options.map((opt) => {
            const isActive = opt.key === wavelength;
            const color = wavelengthColors[opt.key];
            return (
              <button
                key={opt.key}
                onClick={() => { setImageLoaded(false); setImageError(false); setWavelength(opt.key); }}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'border-gray-600 bg-gray-800/80 text-white'
                    : 'border-gray-800/40 bg-gray-950/40 text-gray-500 hover:text-gray-300 hover:bg-gray-900/60'
                }`}
              >
                {isActive && (
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                )}
                {opt.name} ({opt.key}Å)
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800/30 px-6 py-3 text-center">
        <a
          href="https://sdo.gsfc.nasa.gov/assess/monitoring/realtime.php"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-600 hover:text-gray-400"
        >
          Source: NASA SDO via SWPC &mdash; Click for most recent imagery
        </a>
      </div>
    </div>
  );
}
