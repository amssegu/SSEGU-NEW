import React, { useEffect, useRef } from 'react';

interface AdSenseSlotProps {
  client?: string;
  slot?: string;
  format?: string;
  slotKey?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const ADSENSE_SCRIPT_SRC =
  'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7777536386845474';

function ensureAdSenseScript() {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector<HTMLScriptElement>(
    'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'
  );
  if (existing) return;
  const script = document.createElement('script');
  script.async = true;
  script.src = ADSENSE_SCRIPT_SRC;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

export const AdSenseSlot: React.FC<AdSenseSlotProps> = ({
  client = 'ca-pub-7777536386845474',
  slot = '9970802556',
  format = 'auto',
  slotKey = 'default',
  className = '',
}) => {
  const insRef = useRef<HTMLModElement | null>(null);
  const pushedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    ensureAdSenseScript();

    const el = insRef.current;
    if (!el) return;
    if (pushedKeyRef.current === `${slot}:${slotKey}`) return;

    // Avoid pushing twice if AdSense already populated this <ins> element
    if (el.getAttribute('data-adsbygoogle-status')) {
      pushedKeyRef.current = `${slot}:${slotKey}`;
      return;
    }

    pushedKeyRef.current = `${slot}:${slotKey}`;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore ad blocker or preview sandbox rejections
    }
  }, [slot, slotKey]);

  return (
    <aside
      aria-label="Advertisement"
      className={`w-full overflow-hidden rounded-xl border border-white/10 bg-[#121218] px-3 py-2.5 ${className}`}
    >
      <p className="mb-1.5 text-center text-[11px] font-medium text-zinc-500">
        Advertisement
      </p>
      <div className="min-h-[90px] w-full overflow-hidden">
        <ins
          key={`${slot}-${slotKey}`}
          ref={insRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
};
