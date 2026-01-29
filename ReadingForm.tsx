import React, { useState, useRef, useEffect } from 'react';
import { ReadingParams, ReadingMode, ReadingLength } from './types';
import { ZODIAC_SIGNS } from './constants';
import { Calendar, User, Info, Wand2, BookOpen, ChevronDown, ArrowRight, Clock, MapPin, Baby, Volume2, Check } from 'lucide-react';
import LoadingIndicator from './LoadingIndicator';

interface ReadingFormProps {
  onSubmit: (params: ReadingParams) => void;
  isLoading: boolean;
}

const InputLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-black text-taupe-accent uppercase tracking-[0.4em] mb-4 ml-2 opacity-80">
    {children}
  </label>
);

function CustomSelect<T extends string>({ value, onChange, options }: { value: T, onChange: (val: T) => void, options: { label: string, value: T, description?: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const click = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener('mousedown', click);
    return () => document.removeEventListener('mousedown', click);
  }, []);

  const selected = options.find(opt => opt.value === value);

  return (
    <div className="relative group" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full neo-3d-input px-6 py-5 text-sm font-black tracking-[0.2em] transition-all flex items-center justify-between text-white uppercase text-left ${isOpen ? 'border-taupe-accent/40 translate-y-[-2px]' : ''}`}
      >
        <span className="truncate pr-4">{selected?.label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 right-0 z-[200] neo-3d-card p-2 shadow-2xl max-h-[320px] overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className={`w-full px-5 py-4 rounded-xl text-left transition-all flex items-center justify-between ${value === opt.value ? 'bg-gold-accent/10 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'}`}
            >
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest">{opt.label}</span>
                {opt.description && <span className="text-[8px] font-bold text-slate-600 uppercase mt-0.5">{opt.description}</span>}
              </div>
              {value === opt.value && <Check className="w-3.5 h-3.5 text-gold-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ReadingForm: React.FC<ReadingFormProps> = ({ onSubmit, isLoading }) => {
  const today = new Date().toISOString().split('T')[0];
  const [params, setParams] = useState<ReadingParams>({
    sign: ZODIAC_SIGNS[0],
    mode: ReadingMode.COLLECTIVE,
    topic: '',
    startDate: today,
    endDate: today,
    length: ReadingLength.MEDIUM,
    includeAudio: false,
    querentName: '',
    birthDate: '',
    birthTime: '',
    birthLocation: '',
  });

  const isSpecific = params.mode === ReadingMode.SPECIFIC || params.mode === ReadingMode.MANUAL_SPECIFIC;
  const isManual = params.mode === ReadingMode.MANUAL_COLLECTIVE || params.mode === ReadingMode.MANUAL_SPECIFIC;

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(params); }} className="neo-3d-card p-10 md:p-16 space-y-14 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-gold-accent/5 blur-[120px] pointer-events-none" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 relative z-10">
        <div className="space-y-4">
          <InputLabel>Primary Sign influence</InputLabel>
          <CustomSelect 
            value={params.sign}
            onChange={(val) => setParams({ ...params, sign: val })}
            options={ZODIAC_SIGNS.map(sign => ({ label: sign, value: sign }))}
          />
        </div>

        <div className="space-y-4">
          <InputLabel>Operational logic</InputLabel>
          <CustomSelect 
            value={params.mode}
            onChange={(val) => setParams({ ...params, mode: val as ReadingMode })}
            options={[
              { label: 'Collective', value: ReadingMode.COLLECTIVE, description: 'Automated wide-reach protocol' },
              { label: 'Specific Querent', value: ReadingMode.SPECIFIC, description: 'Direct personalized address' },
              { label: 'Manual Collective', value: ReadingMode.MANUAL_COLLECTIVE, description: 'Two-stage node capture' },
              { label: 'Manual Specific', value: ReadingMode.MANUAL_SPECIFIC, description: 'High-precision manual synthesis' },
            ]}
          />
        </div>

        <div className="md:col-span-2 space-y-4">
          <InputLabel>Central Narrative Anchor</InputLabel>
          <input 
            type="text"
            placeholder="Focal theme?"
            value={params.topic}
            onChange={(e) => setParams({ ...params, topic: e.target.value })}
            className="w-full neo-3d-input px-8 py-6 text-base font-bold placeholder:text-slate-800 text-white"
            required
          />
        </div>

        <div className="space-y-4">
          <InputLabel>Timeframe Start</InputLabel>
          <div className="relative group">
            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-accent/40" />
            <input 
              type="date"
              value={params.startDate}
              onChange={(e) => setParams({ ...params, startDate: e.target.value })}
              className="w-full neo-3d-input pl-16 pr-6 py-5 text-sm font-black text-white"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <InputLabel>Timeframe End</InputLabel>
          <div className="relative group">
            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-accent/40" />
            <input 
              type="date"
              value={params.endDate}
              onChange={(e) => setParams({ ...params, endDate: e.target.value })}
              className="w-full neo-3d-input pl-16 pr-6 py-5 text-sm font-black text-white"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <InputLabel>Output Depth</InputLabel>
          <CustomSelect 
            value={params.length}
            onChange={(val) => setParams({ ...params, length: val as ReadingLength })}
            options={[
              { label: 'Short Form', value: ReadingLength.SHORT, description: '900-1000 Units' },
              { label: 'Standard', value: ReadingLength.MEDIUM, description: '1500-2000 Units' },
              { label: 'Deep Archive', value: ReadingLength.DEEP, description: '3000-3500 Units' },
            ]}
          />
        </div>

        <div className="space-y-4">
          <InputLabel>Vocal Synthesis Layer</InputLabel>
          <button 
            type="button"
            onClick={() => setParams({ ...params, includeAudio: !params.includeAudio })}
            className={`w-full neo-3d-input px-6 py-5 flex items-center justify-between transition-all ${params.includeAudio ? 'border-gold-accent/40 bg-gold-accent/5' : ''}`}
          >
            <span className={`text-sm font-black tracking-[0.2em] uppercase transition-colors ${params.includeAudio ? 'text-white' : 'text-slate-700'}`}>
              {params.includeAudio ? 'ENABLED // PCM STREAM' : 'DISABLED'}
            </span>
            <Volume2 className={`w-5 h-5 ${params.includeAudio ? 'text-gold-accent' : 'text-slate-800'}`} />
          </button>
        </div>

        {isSpecific && (
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 animate-in fade-in slide-in-from-top-4 border-t border-white/[0.03] pt-12">
            <div className="space-y-4 md:col-span-2">
              <InputLabel>Target Name</InputLabel>
              <input 
                type="text"
                placeholder="Personal address name"
                value={params.querentName || ''}
                onChange={(e) => setParams({ ...params, querentName: e.target.value })}
                className="w-full neo-3d-input px-8 py-5 text-sm font-bold text-white"
              />
            </div>

            <div className="space-y-4">
              <InputLabel>Birth Date</InputLabel>
              <input 
                type="date"
                value={params.birthDate || ''}
                onChange={(e) => setParams({ ...params, birthDate: e.target.value })}
                className="w-full neo-3d-input px-8 py-5 text-sm font-black text-white"
              />
            </div>

            <div className="space-y-4">
              <InputLabel>Birth Time</InputLabel>
              <input 
                type="time"
                value={params.birthTime || ''}
                onChange={(e) => setParams({ ...params, birthTime: e.target.value })}
                className="w-full neo-3d-input px-8 py-5 text-sm font-black text-white"
              />
            </div>

            <div className="md:col-span-2 space-y-4">
              <InputLabel>Birth Location</InputLabel>
              <input 
                type="text"
                placeholder="City, Country"
                value={params.birthLocation || ''}
                onChange={(e) => setParams({ ...params, birthLocation: e.target.value })}
                className="w-full neo-3d-input px-8 py-5 text-sm font-bold text-white"
              />
            </div>
          </div>
        )}
      </div>

      <button 
        type="submit"
        disabled={isLoading}
        className="w-full py-7 neo-3d-button bg-gradient-to-br from-[#4A4A4A] to-[#2D2D2D] !text-white rounded-2xl font-black uppercase tracking-[0.5em] text-[11px] disabled:opacity-30 flex items-center justify-center gap-6 group relative z-10"
      >
        {isLoading ? (
          <div className="flex items-center gap-4">
            <LoadingIndicator size="xs" />
            <span className="animate-soft-pulse">Transmitting...</span>
          </div>
        ) : (
          <>
            {isManual ? <BookOpen className="w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
            <span>{isManual ? 'Initialize Stage 01' : 'Synthesize script'}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-3 transition-transform" />
          </>
        )}
      </button>

      <div className="flex items-start gap-5 p-6 neo-3d-input rounded-2xl text-[10px] text-slate-500 tracking-[0.3em] font-black opacity-60">
        <Info className="w-5 h-5 text-gold-accent animate-pulse" />
        <p>
          {isManual 
            ? "Manual Protocol: Structural hook first, then node capture."
            : "Automated Protocol: Full immediate narrative synthesis."}
        </p>
      </div>
    </form>
  );
};

export default ReadingForm;