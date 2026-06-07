import { createContext, useContext, useState, ReactNode } from 'react';

export type TimeMode = 'local' | 'utc';

interface TimeContextValue {
  mode: TimeMode;
  toggle: () => void;
  /** Format an ISO string with optional Intl options, respecting current mode */
  fmt: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
  /** Format a millisecond timestamp, respecting current mode */
  fmtMs: (ms: number, opts?: Intl.DateTimeFormatOptions) => string;
  /** " UTC" when in UTC mode, "" in local mode — append to formatted strings */
  suffix: string;
}

const TimeContext = createContext<TimeContextValue>({
  mode: 'local',
  toggle: () => {},
  fmt: (iso, opts) => new Date(iso).toLocaleString(undefined, opts),
  fmtMs: (ms, opts) => new Date(ms).toLocaleString(undefined, opts),
  suffix: '',
});

export function TimeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TimeMode>(() => {
    try { return (localStorage.getItem('helios-time-mode') as TimeMode) ?? 'local'; }
    catch { return 'local'; }
  });

  const toggle = () => {
    const next: TimeMode = mode === 'local' ? 'utc' : 'local';
    setMode(next);
    try { localStorage.setItem('helios-time-mode', next); } catch {}
  };

  const tz = mode === 'utc' ? 'UTC' : undefined;
  const suffix = mode === 'utc' ? ' UTC' : '';

  const fmt = (iso: string, opts?: Intl.DateTimeFormatOptions) =>
    new Date(iso).toLocaleString(undefined, { timeZone: tz, ...opts });

  const fmtMs = (ms: number, opts?: Intl.DateTimeFormatOptions) =>
    new Date(ms).toLocaleString(undefined, { timeZone: tz, ...opts });

  return (
    <TimeContext.Provider value={{ mode, toggle, fmt, fmtMs, suffix }}>
      {children}
    </TimeContext.Provider>
  );
}

export const useTime = () => useContext(TimeContext);
