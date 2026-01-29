import React from 'react';

interface LoadingIndicatorProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ size = 'md', label }) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-20 h-20',
    lg: 'w-32 h-32'
  };

  return (
    <div className="flex flex-col items-center gap-10">
      <div className={`relative ${sizeMap[size]} transition-all duration-1000`}>
        {/* Outer Celestial Compass Ring */}
        <svg className="absolute inset-0 w-full h-full animate-[spin_15s_linear_infinite]" viewBox="0 0 100 100">
          <circle 
            cx="50" 
            cy="50" 
            r="48" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="0.5" 
            strokeDasharray="1 8" 
            className="text-gold-accent/30" 
          />
        </svg>

        {/* Major Zodiac Path */}
        <svg className="absolute inset-0 w-full h-full animate-[spin_8s_linear_infinite_reverse]" viewBox="0 0 100 100">
          <circle 
            cx="50" 
            cy="50" 
            r="38" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeDasharray="15 30" 
            className="text-gold-accent/50" 
          />
        </svg>

        {/* Fast Inner Orbital */}
        <svg className="absolute inset-0 w-full h-full animate-[spin_2.5s_cubic-bezier(0.4,0,0.2,1)_infinite]" viewBox="0 0 100 100">
          <path 
            d="M50 20 A30 30 0 0 1 80 50" 
            fill="none" 
            stroke="url(#goldGradient)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            className="drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]"
          />
          <defs>
            <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="100%" stopColor="#D4AF37" />
            </linearGradient>
          </defs>
        </svg>

        {/* Pulsing Galactic Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1),0_0_40px_rgba(212,175,55,0.8)] animate-pulse" />
          <div className="absolute w-full h-[1px] bg-gold-accent/20 animate-[spin_4s_linear_infinite]" />
          <div className="absolute h-full w-[1px] bg-gold-accent/20 animate-[spin_4s_linear_infinite]" />
        </div>
      </div>
      
      {label && (
        <div className="space-y-4 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.8em] text-gold-accent animate-soft-pulse">
            {label}
          </p>
          <div className="flex justify-center gap-3">
            {[0, 150, 300].map((delay) => (
              <div 
                key={delay}
                className="w-1 h-1 bg-gold-accent/40 rounded-full animate-bounce" 
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingIndicator;