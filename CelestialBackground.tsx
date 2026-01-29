import React, { useMemo, useEffect, useRef } from 'react';
import { Moon, Sparkles, Compass } from 'lucide-react';

const CelestialBackground: React.FC = () => {
  const bgRef = useRef<HTMLDivElement>(null);
  const radianceRef = useRef<HTMLDivElement>(null);
  const backStarsRef = useRef<HTMLDivElement>(null);
  const midStarsRef = useRef<HTMLDivElement>(null);
  const frontStarsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let requestRef: number;
    let ticking = false;
    let clientX = 0;
    let clientY = 0;

    const updatePosition = () => {
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = (clientY / window.innerHeight) * 2 - 1;

      if (bgRef.current) {
        bgRef.current.style.transform = `translate(${x * -15}px, ${y * -15}px) scale(1.15)`;
      }
      if (radianceRef.current) {
        radianceRef.current.style.transform = `translate(${x * 20}px, ${y * 20}px) translate(-50%, -50%)`;
      }
      if (backStarsRef.current) {
        backStarsRef.current.style.transform = `translate(${x * -30}px, ${y * -30}px)`;
      }
      if (midStarsRef.current) {
        midStarsRef.current.style.transform = `translate(${x * -60}px, ${y * -60}px)`;
      }
      if (frontStarsRef.current) {
        frontStarsRef.current.style.transform = `translate(${x * -120}px, ${y * -120}px)`;
      }

      ticking = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      clientX = e.clientX;
      clientY = e.clientY;

      if (!ticking) {
        ticking = true;
        requestRef = requestAnimationFrame(updatePosition);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(requestRef);
    };
  }, []);

  const starLayers = useMemo(() => {
    const generateLayer = (count: number, sizeRange: [number, number]) => {
      return Array.from({ length: count }).map((_, i) => ({
        id: i,
        size: Math.random() * (sizeRange[1] - sizeRange[0]) + sizeRange[0],
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        duration: `${Math.random() * 4 + 3}s`,
        delay: `${Math.random() * 5}s`,
      }));
    };
    return {
      back: generateLayer(200, [0.5, 1.2]),
      mid: generateLayer(80, [1.5, 2.8]),
      front: generateLayer(30, [3.0, 5.0]),
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-10] bg-[#010101] overflow-hidden celestial-container pointer-events-none">
      {/* Primary Cinematic Asset Background */}
      <div 
        ref={bgRef}
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 scale-105 transition-transform duration-1000 ease-out"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=2300&auto=format&fit=crop')`, 
          transform: `translate(0px, 0px) scale(1.15)`
        }} 
      />

      {/* Central Radiance */}
      <div 
        ref={radianceRef}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-gradient-radial from-gold-600/10 via-amber-900/5 to-transparent blur-[120px] animate-soft-pulse"
        style={{ transform: `translate(0px, 0px) translate(-50%, -50%)` }}
      />

      {/* Rotating Orbital Rings */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="gold-ring w-[600px] h-[600px] border-dashed border-gold-accent/40 animate-spin-slow" />
        <div className="gold-ring w-[800px] h-[800px] border-solid border-gold-accent/20 [animation-duration:40s] animate-spin-slow" />
        <div className="gold-ring w-[1100px] h-[1100px] border-dashed border-gold-accent/10 [animation-duration:80s] animate-spin-slow [animation-direction:reverse]" />
      </div>

      {/* Deep Atmosphere Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent h-1/3 bottom-0" />

      {/* Parallax Star Layers */}
      <div 
        ref={backStarsRef}
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{ transform: `translate(0px, 0px)` }}
      >
        {starLayers.back.map((star) => (
          <div
            key={`back-${star.id}`}
            className="absolute bg-white rounded-full animate-star-twinkle opacity-30 shadow-[0_0_8px_white]"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: star.top,
              left: star.left,
              '--twinkle-duration': star.duration,
              animationDelay: star.delay,
            } as any}
          />
        ))}
      </div>

      <div 
        ref={midStarsRef}
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{ transform: `translate(0px, 0px)` }}
      >
        {starLayers.mid.map((star) => (
          <div
            key={`mid-${star.id}`}
            className="absolute bg-gold-200 rounded-full animate-star-twinkle opacity-50 shadow-[0_0_12px_rgba(253,237,155,0.6)]"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: star.top,
              left: star.left,
              '--twinkle-duration': star.duration,
              animationDelay: star.delay,
            } as any}
          />
        ))}
      </div>

      <div 
        ref={frontStarsRef}
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{ transform: `translate(0px, 0px)` }}
      >
        {starLayers.front.map((star) => (
          <div
            key={`front-${star.id}`}
            className="absolute bg-white rounded-full animate-star-twinkle shadow-[0_0_20px_white]"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: star.top,
              left: star.left,
              '--twinkle-duration': star.duration,
              animationDelay: star.delay,
            } as any}
          />
        ))}
      </div>

      {/* Subtle Floating Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <Moon className="absolute top-[10%] right-[10%] w-24 h-24 text-gold-accent/40 animate-float" />
        <Compass className="absolute bottom-[10%] left-[5%] w-16 h-16 text-gold-accent/20 animate-spin-slow" />
        <Sparkles className="absolute top-[40%] left-[80%] w-12 h-12 text-white/40 animate-soft-pulse" />
      </div>

      {/* Vignette Masking */}
      <div className="absolute inset-0 shadow-[inset_0_0_30vw_rgba(0,0,0,1)]" />
    </div>
  );
};

export default CelestialBackground;