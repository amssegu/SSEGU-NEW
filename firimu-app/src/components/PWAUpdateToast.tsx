import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export const PWAUpdateToast: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        window.setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-white/15 bg-[#16161E] px-4 py-3 text-sm text-zinc-100 shadow-2xl"
    >
      <RefreshCw className="h-4 w-4 shrink-0 text-[#E50914]" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-semibold text-white">App update available</p>
        <p className="text-xs text-zinc-400">Reload to get the latest movies &amp; features.</p>
      </div>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="min-h-[36px] shrink-0 rounded-lg bg-[#E50914] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#FF121F]"
      >
        Update
      </button>
      <button
        type="button"
        onClick={() => setNeedRefresh(false)}
        aria-label="Dismiss update notification"
        className="flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
