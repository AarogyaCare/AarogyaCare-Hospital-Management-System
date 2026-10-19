import React, { createContext, useContext } from 'react';
import { useToast, Toast } from '../hooks/useToast';
import { ToastContainer } from '../components/Toast';

interface ToastContextValue {
  toasts: Toast[];
  dismiss: (id: string) => void;
  toast: (opts: Omit<Toast, 'id'>) => string;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toastApi = useToast();

  return (
    <ToastContext.Provider value={toastApi}>
      {children}
      <ToastContainer toasts={toastApi.toasts} dismiss={toastApi.dismiss} />
    </ToastContext.Provider>
  );
};

export const useToastContext = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
};
