import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Wind, ThermometerSun, ArrowDownUp, RefreshCw, Zap, Sun, Shield, Activity } from 'lucide-react';
import { fetchSolarData, SolarData, getStormLevel, getStormLevelNumeric } from '@/data/solarData';
import StormAlert from './components/StormAlert';
import KpGauge from './components/KpGauge';
import MetricCard from './components/MetricCard';
import LiveSun from './components/LiveSun';
import SolarCharts from './components/SolarCharts';
import SchumannResonance from './components/SchumannResonance';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const AUTO_REFRESH_LABELS = ['Auto-refresh', '5m', '4:59', '4:58', '4:57'];

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
    } catch (err: any) {
      setError(err.message || 'Failed to fetch solar data');
    } finally {
      if (!isAuto) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  return { data, loading, error, refresh: () => loadData(true) };
}

function formatFlux(flux: number | null): string {
  if (flux == null) return '—';
  return flux.toFixed(0);
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

  const currentKpNum = data.currentStormLevel
    ? getStormLevelNumeric(data.currentKp || 0)
    : 0;
  const stormLevel = data.currentStormLevel || {
    code: 'G0',
    label: 'Quiet',
    color: '#10B981',
    description: 'Quiet geomagnetic conditions',
  };

  const lastUpdatedMs = data.currentSolarWind?.timestamp
    ? new Date(data.currentSolarWind.timestamp).getTime()
    : data.lastUpdated;
  const lastUpdatedFormatted = data.currentSolarWind
    ? new Date(data.currentSolarWind.timestamp).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date(data.lastUpdated).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  // Format Kp display
  const kpDisplay = data.currentKp != null ? data.currentKp.toFixed(1) : '—';

  return (
    <div className="min-h-screen aurora-bg">
      {/* Header bar */}
      <header className="sticky top-0 z-50 border-b border-gray-800/40 bg-black/80 backdrop-blur-lg">
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
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* === Storm Alert Hero === */}
        <div className="mb-6">
          <StormAlert
            stormLevel={stormLevel}
            currentKp={currentKpNum}
            lastUpdated={lastUpdatedMs}
          />
        </div>

        {/* === Row: MetricCards === */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
          <MetricCard
            title="Solar Wind Speed"
            value={data.currentSolarWind?.speed != null ? data.currentSolarWind.speed.toString() : '—'}
            unit="km/s"
            icon={Wind}
            accentColor="#00FF94"
          />
          <MetricCard
            title="Solar Wind Density"
            value={data.currentSolarWind?.density != null ? data.currentSolarWind.density.toFixed(1) : '—'}
            unit="p/cm³"
            icon={Activity}
            accentColor="#00D4AA"
          />
          <MetricCard
            title="Bz Component"
            value={data.currentSolarWind?.bz != null ? data.currentSolarWind.bz.toFixed(1) : '—'}
            unit="nT"
            icon={ThermometerSun}
            accentColor="#ef4444"
          />
          <MetricCard
            title="X-Ray Flux Class"
            value={data.currentXrayClass}
            unit="GOES"
            icon={Zap}
            accentColor="#FF6B35"
          />
        </div>

        {/* === Row: KpGauge + LiveSun === */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <KpGauge
            currentKp={currentKpNum}
            kpIndex={data.kpIndex}
          />
          <LiveSun />
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
            &copy; {new Date().getFullYear()} Hai Nguyen (nguyenhaidev)
          </p>
        </footer>
      </main>
    </div>
  );
}
