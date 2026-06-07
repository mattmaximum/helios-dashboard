import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Wind, ThermometerSun, RefreshCw, Zap, Sun, Activity } from 'lucide-react';
import { fetchSolarData, SolarData } from '@/data/solarData';
import StormStatus from './components/StormStatus';
import KpGauge from './components/KpGauge';
import MetricCard from './components/MetricCard';
import LiveSun from './components/LiveSun';
import SolarCharts from './components/SolarCharts';
import SchumannResonance from './components/SchumannResonance';
import SolarRating from './components/SolarRating';
import SolarForecast from './components/SolarForecast';
import SolarEventLog from './components/SolarEventLog';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function useSolarData() {
  const [data, setData] = useState<SolarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (isAuto: boolean) => {
    if (!isAuto) setLoading(true);
    try {
      const result = await fetchSolarData();
      setData(result);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch solar data';
      setError(message);
    } finally {
      if (!isAuto) setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData(false);
  }, [loadData]);

  // Auto-refresh every REFRESH_INTERVAL
  useEffect(() => {
    const id = setInterval(() => loadData(true), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [loadData]);

  return { data, loading, error, refresh: () => loadData(true) };
}

export default function App() {
  const { data, loading, error, refresh } = useSolarData();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center aurora-bg">
        <div className="text-center">
          <div className="relative h-16 w-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-2 border-plasma-orange/20 animate-ping" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sun className="h-8 w-8 text-plasma-orange animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white/80 mb-2">Helios Dashboard</h1>
          <p className="text-sm text-gray-500">Initializing solar weather data stream…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center max-w-md px-6">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Connection Error</h1>
          <p className="text-gray-500 mb-6">{error || 'Failed to load solar data'}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-2 rounded-lg bg-plasma-orange/20 border border-plasma-orange/30 text-plasma-orange text-sm font-semibold hover:bg-plasma-orange/30 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentKpNum = data.currentKp ?? 0;
  const stormLevel = data.currentStormLevel || {
    code: 'G0',
    label: 'Quiet',
    color: '#10B981',
    description: 'Quiet geomagnetic conditions',
  };

  const stormLevelNum = parseInt((stormLevel.code || 'G0').replace('G', ''));
  const isAlert = stormLevelNum >= 2;

  const windSpeed = data.currentSolarWind?.speed ?? 0;
  const windAccent =
    windSpeed > 600 ? '#FF6B35' :
    windSpeed > 400 ? '#FBBF24' :
    '#00FF94';

  const lastUpdatedMs = data.currentSolarWind?.timestamp
    ? new Date(data.currentSolarWind.timestamp).getTime()
    : data.lastUpdated;
  const lastUpdatedFormatted = data.currentSolarWind
    ? new Date(data.currentSolarWind.timestamp).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date(data.lastUpdated).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className={`min-h-screen aurora-bg${isAlert ? ' aurora-alert-mode' : ''}`}>
      {/* Header bar */}
      <header className={`sticky top-0 z-50 border-b bg-black/80 backdrop-blur-lg transition-colors duration-[3000ms] ${isAlert ? 'border-red-900/50' : 'border-gray-800/40'}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-plasma-orange/80 to-orange-600/40 shadow-lg shadow-orange-500/10">
              <Zap className="h-5 w-5 text-white" />
              <span className="absolute -inset-1 rounded-xl bg-plasma-orange/10 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Project <span className="text-plasma-orange">Helios</span>
              </h1>
              <p className="-mt-1 text-[10px] font-medium uppercase tracking-widest text-gray-500">
                Solar Weather Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-gray-600 sm:inline">
              {lastUpdatedFormatted}
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                refreshing
                  ? 'border-gray-700 bg-gray-800 text-gray-400'
                  : 'border-gray-700/60 bg-gray-800/60 text-gray-300 hover:bg-gray-700/60 hover:text-white'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* === Row: [SolarForecast + KpGauge + MetricCards + StormStatus] | [SolarRating + LiveSun] === */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
          <div className="flex flex-col gap-3">
            <SolarRating
              currentKp={currentKpNum}
              windSpeed={data.currentSolarWind?.speed ?? null}
              xrayClass={data.currentXrayClass}
              f107={data.f107}
            />
            <KpGauge currentKp={currentKpNum} />
            <SolarForecast
              kpForecast={data.kpForecast}
              spaceWeatherAlerts={data.spaceWeatherAlerts}
            />
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                title="Solar Wind Speed"
                value={data.currentSolarWind?.speed != null ? data.currentSolarWind.speed.toString() : '—'}
                unit="km/s"
                icon={Wind}
                accentColor={windAccent}
                tooltip="How fast charged particles from the Sun are traveling toward Earth. Normal is 300–500 km/s. Above 600 km/s the solar wind is fast enough to compress Earth's magnetosphere and amplify any geomagnetic storm in progress."
              />
              <MetricCard
                title="Solar Wind Density"
                value={data.currentSolarWind?.density != null ? data.currentSolarWind.density.toFixed(1) : '—'}
                unit="p/cm³"
                icon={Activity}
                accentColor="#00D4AA"
                tooltip="How many protons per cubic centimeter are packed into the solar wind. Typical is 3–10 p/cm³. High density amplifies storm intensity — a dense, fast wind hitting a southward Bz is the worst-case combination for geomagnetic storms."
              />
              <MetricCard
                title="Bz Component"
                value={data.currentSolarWind?.bz != null ? data.currentSolarWind.bz.toFixed(1) : '—'}
                unit="nT"
                icon={ThermometerSun}
                accentColor="#ef4444"
                tooltip="The north-south tilt of the Sun's magnetic field as it reaches Earth. When Bz goes negative (southward), it links with Earth's magnetic field and lets solar energy pour through — the primary trigger for geomagnetic storms. Even moderate solar wind can cause a strong storm if Bz is deeply negative."
              />
              <MetricCard
                title="X-Ray Flux Class"
                value={data.currentXrayClass}
                unit="GOES"
                icon={Zap}
                accentColor="#FF6B35"
                tooltip="The intensity of the latest solar flare measured by GOES satellites. Classes go B → C → M → X, each 10× stronger than the last. C-class is minor background activity. M-class can cause brief radio blackouts. X-class flares can knock out HF radio globally and energize the Van Allen belts for days."
              />
            </div>
            <StormStatus
              stormLevel={stormLevel}
              currentKp={currentKpNum}
              lastUpdated={lastUpdatedMs}
            />
          </div>
          <div className="flex flex-col gap-3">
            <LiveSun />
            <SolarEventLog events={data.solarEvents} />
          </div>
        </div>

        {/* === Historical Charts === */}
        <div className="mb-6">
          <SolarCharts
            kpIndex={data.kpIndex}
            xrayFlux={data.xrayFlux}
            solarWind={data.solarWind}
          />
        </div>

        {/* === Schumann Resonance === */}
        <div className="mb-8">
          <SchumannResonance />
        </div>

        {/* === Footer === */}
        <footer className="border-t border-gray-800/30 py-6 text-center">
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-500">Project Helios</span> — Solar Weather Monitoring Dashboard
          </p>
          <p className="mt-1 text-xs text-gray-700">
            Data sourced from NOAA SWPC &amp; NASA SDO with graceful mock fallbacks | Built with React + Recharts + Tailwind v4
          </p>
          <p className="mt-1 text-xs text-gray-800">
            &copy; {new Date().getFullYear()} Project Helios
          </p>
        </footer>
      </main>
    </div>
  );
}
