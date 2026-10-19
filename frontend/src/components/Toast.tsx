import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Toast, ToastType } from '../hooks/useToast';

interface ToastContainerProps {
  toasts: Toast[];
  dismiss: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
};

const borderColors: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
  warning: 'border-l-amber-500',
};

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, dismiss }) => {
  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 64, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 64, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={`pointer-events-auto min-w-[320px] max-w-sm bg-surface-container-lowest dark:bg-zinc-900 rounded-xl shadow-2xl border border-surface-container-high dark:border-zinc-700 border-l-4 ${borderColors[toast.type]} flex items-start gap-3 px-4 py-3.5`}
            role="alert"
          >
            <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[14px] text-on-surface dark:text-zinc-100 leading-5">{toast.title}</p>
              {toast.message && (
                <p className="text-[13px] text-on-surface-variant dark:text-zinc-400 mt-0.5 leading-5">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 p-1 rounded-lg text-on-surface-variant hover:bg-surface-container dark:hover:bg-zinc-800 transition-colors -mr-1 -mt-0.5"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
