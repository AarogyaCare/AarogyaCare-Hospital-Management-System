import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { UserRole, EmergencyRequest } from './types';
import { authService, emergencyService } from './services/api';

export const App: React.FC = () => {
  const [currentUserRole, setCurrentRole] = useState<UserRole>('patient');
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
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
  );
};

export default App;
