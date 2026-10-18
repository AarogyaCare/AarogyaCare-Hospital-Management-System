import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = "search_off",
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-low/60 rounded-2xl border border-surface-container-high my-6">
      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-outline mb-3">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h4 className="font-title-md text-title-md text-primary font-bold">{title}</h4>
      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mt-1">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-primary text-white font-title-sm text-title-sm hover:bg-secondary transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
