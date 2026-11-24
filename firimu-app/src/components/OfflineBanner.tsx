import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-[#1B1710] px-4 py-2.5 text-xs font-medium text-amber-200 shadow-xl"
    >
      <WifiOff className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
      <span>Offline mode — Showing cached catalog</span>
    </div>
  );
};
