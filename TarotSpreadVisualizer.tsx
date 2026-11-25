import React from 'react';
import { Spread, TarotCard } from './types';

interface CardItemProps {
  card: TarotCard;
  label: string;
}

const CardItem: React.FC<CardItemProps> = ({ card, label }) => (
  <div className="neo-3d-card p-5 transition-all duration-1000 hover:scale-110 group border border-white/[0.02] cursor-default relative overflow-hidden hover:shadow-[0_40px_70px_rgba(0,0,0,0.9)]">
    <div className="absolute inset-0 bg-taupe-accent/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

    <div className="relative w-full aspect-[3/5] neo-3d-input rounded-2xl flex items-center justify-center mb-6 overflow-hidden shadow-inner group-hover:shadow-[inset_0_0_30px_rgba(255,255,255,0.05)] transition-shadow">
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          className={`w-full h-full object-cover transition-all duration-1000 ${card.orientation === 'Reversed' ? 'rotate-180' : ''
            } grayscale-[30%] opacity-90 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105`}
          loading="lazy"
        />
      ) : (
        <div className={`text-5xl md:text-6xl transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) ${card.orientation === 'Reversed' ? 'rotate-180 scale-x-[-1]' : ''} grayscale opacity-40 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-110`}>
          🎴
        </div>
      )}
      {card.orientation === 'Reversed' && (
        <div className="absolute inset-0 bg-rose-500/[0.03] pointer-events-none" />
      )}
      <div className="absolute top-4 left-4 text-[7px] font-black text-white/10 uppercase tracking-[0.3em]">
        TLP // OS
      </div>
      <div className="absolute bottom-4 right-4 text-[7px] font-black text-taupe-accent/20 uppercase tracking-widest group-hover:text-taupe-accent/40 transition-colors">
        {card.orientation === 'Reversed' ? 'REVERSED' : 'STABLE'}
      </div>
    </div>

    <div className="space-y-3 text-center relative z-10">
      <div className="flex flex-col items-center gap-1">
        <span className="text-[7px] font-black uppercase tracking-[0.5em] text-taupe-accent/40 group-hover:text-taupe-accent transition-colors">{label}</span>
        <div className="h-0.5 w-4 bg-white/5 rounded-full group-hover:bg-taupe-accent transition-colors" />
      </div>

      <h5 className="text-[11px] font-black text-white leading-tight uppercase tracking-[0.15em] group-hover:text-taupe-accent transition-colors px-1">
        {card.name}
      </h5>

      <div className={`text-[9px] font-black tracking-[0.3em] uppercase py-1 px-3 rounded-full inline-block ${card.orientation === 'Upright' ? 'text-emerald-400 bg-emerald-500/5' : 'text-rose-400 bg-rose-500/5'}`}>
        {card.orientation}
      </div>
    </div>
  </div>
);

interface TarotSpreadVisualizerProps {
  spread: Spread;
}

const TarotSpreadVisualizer: React.FC<TarotSpreadVisualizerProps> = ({ spread }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-10 animate-fade-in-up">
      {spread.situation.map((card, i) => (
        <CardItem key={`sit-${i}`} card={card} label={`SITUATION 0${i + 1}`} />
      ))}
      {spread.feelings.map((card, i) => (
        <CardItem key={`feel-${i}`} card={card} label={`EMOTIONAL 0${i + 1}`} />
      ))}
      {spread.message.map((card, i) => (
        <CardItem key={`msg-${i}`} card={card} label={`SPIRITUAL 0${i + 1}`} />
      ))}
      {spread.outcome.map((card, i) => (
        <CardItem key={`out-${i}`} card={card} label={`FUTURE 0${i + 1}`} />
      ))}
      <div className="col-span-2 sm:col-span-1 lg:col-span-1 flex items-center justify-center">
        <div className="w-full">
          <CardItem card={spread.bottom} label="SHADOW BASE" />
        </div>
      </div>
    </div>
  );
};

export default TarotSpreadVisualizer;