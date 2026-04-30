import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  accentColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
}

export default function MetricCard({ title, value, unit, icon: Icon, accentColor = '#00FF94', trend, description }: Props) {
  const accent = accentColor;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-500';

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-gray-800/40 bg-gray-950/50 p-5 backdrop-blur-sm transition-all duration-300 hover:border-gray-700/60 hover:shadow-lg hover:shadow-black/40"
    >
      {/* Accent top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300 group-hover:h-1"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />

      {/* Corner glow */}
      <div
        className="absolute -bottom-10 -right-10 h-20 w-20 rounded-full blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-30"
        style={{ backgroundColor: accent }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-800/40 bg-gray-900/60"
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </div>
      </div>

      {/* Value */}
      <div className="mt-3 flex items-end gap-2">
        <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
        <span className="text-xs font-semibold text-gray-500">{unit}</span>
        {trend && (
          <span className={`text-xs ${trendColor}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="mt-2 text-xs text-gray-600">{description}</p>
      )}
    </div>
  );
}
