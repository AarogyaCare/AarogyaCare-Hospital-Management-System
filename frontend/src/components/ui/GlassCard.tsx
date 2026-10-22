import React, { HTMLAttributes, forwardRef } from 'react';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'tint-mint' | 'tint-blue' | 'tint-lavender' | 'tint-rose';
  hoverEffect?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className = '', variant = 'default', hoverEffect = true, children, ...props }, ref) => {
    const tints = {
      default: 'bg-white/85 border-white/80',
      'tint-mint': 'bg-gradient-to-br from-white/90 to-[#e8faf5]/80 border-teal-200/60',
      'tint-blue': 'bg-gradient-to-br from-white/90 to-[#e8f4fd]/80 border-blue-200/60',
      'tint-lavender': 'bg-gradient-to-br from-white/90 to-[#f0eeff]/80 border-purple-200/60',
      'tint-rose': 'bg-gradient-to-br from-white/90 to-rose-50/80 border-rose-200/60',
    };

    return (
      <div
        ref={ref}
        className={`rounded-3xl border backdrop-blur-xl p-6 shadow-sm ${
          hoverEffect ? 'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200' : ''
        } ${tints[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
export default GlassCard;
