import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { UserRole, EmergencyRequest } from './types';
import { authService, emergencyService } from './services/api';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

export const App: React.FC = () => {
  const [currentUserRole, setCurrentRole] = useState<UserRole>('patient');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Apply persisted dark mode on startup
    try {
      const isDark = localStorage.getItem('aarogya_dark_mode') === 'true';
      document.documentElement.classList.toggle('dark', isDark);
    } catch {}

    authService.me().then(user => {
      if (user && user.role) {
        setCurrentRole(user.role);
      }
    }).catch(() => {});
  }, []);

  const handleSubmitEmergency = (req: Partial<EmergencyRequest>) => {
    emergencyService.submitRequest(req).catch(err => {
      console.error('Failed to submit emergency ticket to backend:', err);
    });
  };

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AppRoutes
            currentUserRole={currentUserRole}
            setCurrentRole={setCurrentRole}
            emergencyModalOpen={emergencyModalOpen}
            setEmergencyModalOpen={setEmergencyModalOpen}
            authModalOpen={authModalOpen}
            setAuthModalOpen={setAuthModalOpen}
            handleSubmitEmergency={handleSubmitEmergency}
          />
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
