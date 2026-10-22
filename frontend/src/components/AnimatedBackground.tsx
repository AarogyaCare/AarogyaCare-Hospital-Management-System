import type { ReactNode } from 'react';

/**
 * AnimatedBackground
 * Renders a layered pastel mesh with softly floating abstract healthcare shapes.
 * Fully CSS-driven — respects prefers-reduced-motion via the global CSS rule.
 */
export default function AnimatedBackground({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Layer 1: mesh gradient */}
      <div className="absolute inset-0 bg-medora-mesh pointer-events-none" aria-hidden="true" />

      {/* Layer 2: large soft orbs */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Mint orb top-left */}
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#d1fae5]/60 to-[#a7f3d0]/30 blur-3xl animate-float-slow" />
        {/* Sky orb top-right */}
        <div className="absolute -top-20 right-0 w-[400px] h-[400px] rounded-full bg-gradient-to-bl from-[#bae6fd]/50 to-[#e0f2fe]/25 blur-3xl animate-float-medium" style={{ animationDelay: '1.5s' }} />
        {/* Lavender orb bottom-right */}
        <div className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full bg-gradient-to-tl from-[#e9d5ff]/40 to-[#f3e8ff]/20 blur-3xl animate-float-slow" style={{ animationDelay: '3s' }} />
        {/* Aqua orb bottom-left */}
        <div className="absolute -bottom-24 -left-16 w-[360px] h-[360px] rounded-full bg-gradient-to-tr from-[#cffafe]/45 to-[#a5f3fc]/20 blur-3xl animate-float-medium" style={{ animationDelay: '2s' }} />

        {/* Floating medical shapes — cross */}
        <svg className="absolute top-[12%] right-[8%] w-16 h-16 text-teal-200/40 animate-float-slow" style={{ animationDelay: '0.5s' }} viewBox="0 0 48 48" fill="currentColor">
          <path d="M19 6h10v13h13v10H29v13H19V29H6V19h13z" />
        </svg>

        {/* Floating medical shapes — pulse line */}
        <svg className="absolute top-[55%] left-[5%] w-24 h-10 text-sky-200/35 animate-drift-x" style={{ animationDelay: '1s' }} viewBox="0 0 96 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="0,20 16,20 20,4 26,36 32,12 38,28 44,20 96,20" />
        </svg>

        {/* Floating shape — circle */}
        <div className="absolute top-[35%] left-[80%] w-10 h-10 rounded-full border-2 border-lavender-300/40 bg-purple-100/20 animate-pulse-soft" style={{ animationDelay: '0.8s' }} />
        <div className="absolute top-[70%] left-[60%] w-6 h-6 rounded-full border border-teal-200/50 bg-teal-50/30 animate-pulse-soft" style={{ animationDelay: '1.6s' }} />

        {/* Stethoscope silhouette */}
        <svg className="absolute bottom-[20%] right-[15%] w-20 h-20 text-sky-100/30 animate-float-medium" style={{ animationDelay: '2.5s' }} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="60" cy="62" r="8" />
          <path d="M24 14 Q24 38 42 44 Q60 50 60 54" strokeLinecap="round" />
          <path d="M14 14 a8 8 0 0 0 20 0" />
        </svg>

        {/* DNA helix dots */}
        <div className="absolute top-[25%] right-[30%] flex flex-col gap-3 animate-float-slow opacity-20" style={{ animationDelay: '1.2s' }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} className={`w-3 h-3 rounded-full ${i % 2 === 0 ? 'bg-teal-400' : 'bg-sky-400'} ml-${i % 2 === 0 ? '0' : '4'}`} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
