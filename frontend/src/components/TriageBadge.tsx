import React from 'react';

interface TriageBadgeProps {
  score: 'ESI-1_STAT' | 'ESI-2_EMERGENT' | 'ESI-3_URGENT' | 'ESI-4_LESS_URGENT' | string;
  size?: 'sm' | 'md';
}

export const TriageBadge: React.FC<TriageBadgeProps> = ({ score, size = 'sm' }) => {
  let colorStyles = 'bg-surface-container-high text-on-surface';
  let label = score;

  if (score.includes('STAT') || score.includes('1')) {
    colorStyles = 'bg-error-container text-on-error-container border border-error/30';
    label = 'ESI-1 STAT';
  } else if (score.includes('EMERGENT') || score.includes('2')) {
    colorStyles = 'bg-secondary-fixed text-on-secondary-fixed border border-secondary/30';
    label = 'ESI-2 Urgent';
  } else if (score.includes('URGENT') || score.includes('3')) {
    colorStyles = 'bg-surface-container text-primary border border-surface-container-high';
    label = 'ESI-3 Stable';
  } else {
    colorStyles = 'bg-surface-container-low text-on-surface-variant';
    label = 'ESI-4 Routine';
  }

  const sizeStyles = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-label-md';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-label-sm font-semibold uppercase tracking-wider ${sizeStyles} ${colorStyles}`}>
      {score.includes('STAT') && <span className="w-1.5 h-1.5 rounded-full bg-error animate-ping"></span>}
      <span>{label}</span>
    </span>
  );
};
