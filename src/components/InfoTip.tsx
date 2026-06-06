import { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface Props {
  content: string;
}

export default function InfoTip({ content }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        aria-label="More information"
        className="text-gray-700 hover:text-gray-400 transition-colors focus:outline-none"
      >
        <Info className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 rounded-lg border border-gray-700/70 bg-gray-900/98 px-3 py-2.5 text-xs leading-relaxed text-gray-300 shadow-2xl backdrop-blur-sm z-50 pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-700/70" />
        </div>
      )}
    </div>
  );
}
