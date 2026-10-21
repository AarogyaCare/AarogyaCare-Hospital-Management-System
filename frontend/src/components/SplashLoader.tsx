import { useEffect, useState } from 'react';

interface SplashLoaderProps {
  onComplete: () => void;
}

export default function SplashLoader({ onComplete }: SplashLoaderProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Begin fade-out after 2.6 s, then unmount
    const fadeTimer = setTimeout(() => setFadeOut(true), 2600);
    const doneTimer = setTimeout(() => onComplete(), 3200);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#001730] transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Subtle radial backdrop glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(23,139,139,0.18)_0%,_transparent_70%)] pointer-events-none" />

      {/* Logo */}
      <div className="relative flex flex-col items-center gap-6 select-none">
        <img
          src="/medora-logo.png"
          alt="Medora"
          className="h-20 md:h-24 object-contain drop-shadow-2xl animate-[pulse_2s_ease-in-out_infinite]"
          style={{ filter: 'brightness(1.08) contrast(1.05)' }}
        />

        {/* Quote */}
        <div className="flex flex-col items-center gap-2 max-w-xs md:max-w-md text-center px-6">
          <p className="text-white/90 text-base md:text-lg font-light leading-relaxed tracking-wide italic">
            "The art of medicine consists of keeping the patient amused while nature cures the disease."
          </p>
          <span className="text-teal-400 text-xs font-semibold uppercase tracking-widest mt-1">— Voltaire</span>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-0.5 rounded-full bg-white/10 overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-teal-400 to-[#178B8B] rounded-full"
            style={{ animation: 'medora-progress 2.6s ease-out forwards' }}
          />
        </div>

        <p className="text-slate-400 text-[11px] tracking-widest uppercase">Smart Healthcare. Connected Care.</p>
      </div>

      <style>{`
        @keyframes medora-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
