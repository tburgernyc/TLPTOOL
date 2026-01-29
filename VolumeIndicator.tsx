import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface VolumeIndicatorProps {
  subscribeToVolume: (callback: (volume: number) => void) => () => void;
}

export const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ subscribeToVolume }) => {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    return subscribeToVolume(setVolume);
  }, [subscribeToVolume]);

  return (
    <div className="flex items-center gap-4 px-6 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.1)]">
      <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
      <div className="flex gap-1 items-end h-5">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-1.5 bg-emerald-500/80 rounded-full transition-all duration-100"
            style={{ height: `${Math.max(3, (volume / (i + 1)) * 0.9)}px` }}
          />
        ))}
      </div>
    </div>
  );
};
