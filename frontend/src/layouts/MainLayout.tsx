import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EmergencyModal } from '../components/EmergencyModal';
import { AuthModal } from '../components/AuthModal';
import { UserRole, EmergencyRequest } from '../types';

interface MainLayoutProps {
  currentUserRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  emergencyModalOpen: boolean;
  setEmergencyModalOpen: (open: boolean) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  onSubmitEmergency: (req: Partial<EmergencyRequest>) => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  currentUserRole,
  onSelectRole,
  emergencyModalOpen,
  setEmergencyModalOpen,
  authModalOpen,
  setAuthModalOpen,
  onSubmitEmergency
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Header
        currentUserRole={currentUserRole}
        onSelectRole={onSelectRole}
        onOpenEmergency={() => setEmergencyModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      <Footer />

      {/* Global Modals */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        onSubmitEmergency={onSubmitEmergency}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        currentRole={currentUserRole}
        onSelectRole={onSelectRole}
      />
    </div>
  );
};
