import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { PortalLayout } from '../layouts/PortalLayout';

import { HomePage } from '../pages/HomePage';
import { SpecialtiesPage } from '../pages/SpecialtiesPage';
import { DoctorsPage } from '../pages/DoctorsPage';
import { DoctorProfilePage } from '../pages/DoctorProfilePage';
import { AppointmentBookingPage } from '../pages/AppointmentBookingPage';
import { AppointmentConfirmationPage } from '../pages/AppointmentConfirmationPage';
import { OperationsHubPage } from '../pages/OperationsHubPage';
import { PatientPortalPage } from '../pages/PatientPortalPage';
import { ShortLinkRedirectPage } from '../pages/ShortLinkRedirectPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { LoginPage } from '../pages/LoginPage';

import { UserRole, EmergencyRequest } from '../types';

interface AppRoutesProps {
  currentUserRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  emergencyModalOpen: boolean;
  setEmergencyModalOpen: (open: boolean) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  handleSubmitEmergency: (req: Partial<EmergencyRequest>) => void;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
  currentUserRole,
  setCurrentRole,
  emergencyModalOpen,
  setEmergencyModalOpen,
  authModalOpen,
  setAuthModalOpen,
  handleSubmitEmergency
}) => {
  return (
    <Routes>
      {/* 0. Standalone Authentication Route */}
      <Route path="/login" element={<LoginPage onLoginSuccess={setCurrentRole} />} />

      {/* 1. Public & Booking Routes inside MainLayout */}
      <Route
        element={
          <MainLayout
            currentUserRole={currentUserRole}
            onSelectRole={setCurrentRole}
            emergencyModalOpen={emergencyModalOpen}
            setEmergencyModalOpen={setEmergencyModalOpen}
            authModalOpen={authModalOpen}
            setAuthModalOpen={setAuthModalOpen}
            onSubmitEmergency={handleSubmitEmergency}
          />
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/specialties" element={<SpecialtiesPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/doctors/:doctorId" element={<DoctorProfilePage />} />
        <Route path="/appointments/new" element={<AppointmentBookingPage />} />
        <Route path="/appointments/:appointmentId/confirmation" element={<AppointmentConfirmationPage />} />
        <Route path="/s/:code" element={<ShortLinkRedirectPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 2. Operations & Portal Workstation Routes inside PortalLayout */}
      <Route
        element={
          <PortalLayout
            currentRole={currentUserRole}
            onSelectRole={setCurrentRole}
          />
        }
      >
        <Route
          path="/staff/operations"
          element={
            <OperationsHubPage
              currentRole={currentUserRole}
              onSelectRole={setCurrentRole}
            />
          }
        />
        <Route path="/patient-portal" element={<PatientPortalPage />} />
      </Route>
    </Routes>
  );
};
