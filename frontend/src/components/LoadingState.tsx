import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Loading clinical telemetry & schedule..." 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <span className="material-symbols-outlined text-[36px] text-secondary animate-spin mb-3">
        progress_activity
      </span>
      <p className="font-title-sm text-title-sm text-primary font-medium">{message}</p>
      <span className="text-[12px] text-on-surface-variant mt-1">Aarogya Care Verified Network</span>
    </div>
  );
};
