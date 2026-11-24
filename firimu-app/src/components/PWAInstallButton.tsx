import React, { useState } from 'react';
import { Download, Monitor, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) return;
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex min-h-[40px] items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-[#E50914] font-semibold text-white transition-colors duration-150 hover:bg-[#FF121F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-xs sm:text-sm'
        }`}
      >
        <Download className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{isIOS ? 'Install App' : 'Install App'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121218] p-6 text-zinc-100 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="pwa-install-title" className="font-display text-xl font-bold text-white">
                  Install Ssegu Movies (Firimu)
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Add Firimu to your home screen for full-screen standalone playback and quick access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install instructions"
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-zinc-300">
              {isIOS ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-white">
                    <Share className="h-4 w-4 text-[#E50914]" aria-hidden="true" />
                    iPhone &amp; iPad (Safari)
                  </div>
                  <ol className="list-inside list-decimal space-y-1.5 text-zinc-300">
                    <li>
                      Tap the <strong className="text-white">Share</strong> button in Safari&apos;s toolbar.
                    </li>
                    <li>
                      Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.
                    </li>
                    <li>
                      Tap <strong className="text-white">Add</strong> to install Ssegu Firimu.
                    </li>
                  </ol>
                </div>
              ) : isAndroid ? (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-white">
                    <Smartphone className="h-4 w-4 text-[#E50914]" aria-hidden="true" />
                    Android (Chrome / Edge)
                  </div>
                  <ol className="list-inside list-decimal space-y-1.5 text-zinc-300">
                    <li>
                      Open the browser menu (<strong className="text-white">⋮</strong>) in the top right.
                    </li>
                    <li>
                      Tap <strong className="text-white">Install app</strong> or{' '}
                      <strong className="text-white">Add to Home screen</strong>.
                    </li>
                    <li>Confirm installation to launch Firimu as a standalone app.</li>
                  </ol>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 flex items-center gap-2 font-semibold text-white">
                    <Monitor className="h-4 w-4 text-[#E50914]" aria-hidden="true" />
                    Desktop &amp; Mobile Browsers
                  </div>
                  <ul className="space-y-2 text-zinc-300">
                    <li>
                      <strong className="text-white">Chrome / Edge:</strong> Click the install icon in the address bar or open browser menu &rarr;{' '}
                      <strong className="text-white">Install Ssegu Movies (Firimu)</strong>.
                    </li>
                    <li>
                      <strong className="text-white">iPhone / iPad Safari:</strong> Tap Share &rarr;{' '}
                      <strong className="text-white">Add to Home Screen</strong>.
                    </li>
                  </ul>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
