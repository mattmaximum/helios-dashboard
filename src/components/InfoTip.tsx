import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

interface Props {
  content: string;
}

export default function InfoTip({ content }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const position = useCallback(() => {
    if (!buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    const tipWidth = 240;
    const rawLeft = r.left + r.width / 2 - tipWidth / 2;
    const clampedLeft = Math.min(Math.max(rawLeft, 8), window.innerWidth - tipWidth - 8);
    setCoords({ top: r.top + window.scrollY - 8, left: clampedLeft });
  }, []);

  const show = useCallback(() => { position(); setOpen(true); }, [position]);
  const hide = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => { if (!open) { position(); setOpen(true); } else setOpen(false); }, [open, position]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const tooltip = open ? createPortal(
    <div
      style={{ position: 'absolute', top: coords.top, left: coords.left, transform: 'translateY(-100%)' }}
      className="z-[9999] w-60 rounded-lg border border-gray-700/70 bg-gray-900/98 px-3 py-2.5 text-xs leading-relaxed text-gray-300 shadow-2xl backdrop-blur-sm pointer-events-none"
    >
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-700/70" />
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onClick={toggle}
        aria-label="More information"
        className="text-gray-700 hover:text-gray-400 transition-colors focus:outline-none"
      >
        <Info className="h-3 w-3" />
      </button>
      {tooltip}
    </>
  );
}
