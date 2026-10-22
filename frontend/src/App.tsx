import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useCallback, type ReactNode } from 'react';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import SplashLoader from './components/SplashLoader';
import MedoraAI from './components/MedoraAI';

// Public Pages
import Home from './pages/Home';
import Specialties from './pages/Specialties';
import Doctors from './pages/Doctors';
import DoctorProfile from './pages/DoctorProfile';
import Booking from './pages/Booking';
import BookAppointment from './pages/BookAppointment';
import GuidedBooking from './pages/GuidedBooking';

// Patient Portal Pages
import Login from './pages/Login';
import AccountProfile from './pages/AccountProfile';
import Dashboard from './pages/Dashboard';
import PatientAppointments from './pages/PatientAppointments';
import MedicalRecords from './pages/MedicalRecords';
import Billing from './pages/Billing';
import { HealthKnowledgeSearch } from './pages/knowledge/HealthKnowledgeSearch';
import { MedicalKnowledgeWorkspace } from './pages/knowledge/MedicalKnowledgeWorkspace';
import { KnowledgeSourcesManager } from './pages/admin/KnowledgeSourcesManager';

// Clinical & Nursing Pages
import DoctorClinicalWorkspace from './pages/clinical/DoctorClinicalWorkspace';
import NurseTriageWorkspace from './pages/clinical/NurseTriageWorkspace';
import PatientManagementEMR from './pages/clinical/PatientManagementEMR';

// Emergency Response & Command Center Pages
import EmergencyCommandCenter from './pages/EmergencyCommandCenter';
import IncidentDetailWorkspace from './pages/IncidentDetailWorkspace';
import PatientEmergencySOS from './pages/PatientEmergencySOS';

// Operations Pages
import ReceptionFrontDesk from './pages/operations/ReceptionFrontDesk';
import PharmacyInventory from './pages/operations/PharmacyInventory';
import BillingFinancialDesk from './pages/operations/BillingFinancialDesk';
import OperationsHub from './pages/operations/OperationsHub';
import AppointmentManagement from './pages/operations/AppointmentManagement';

// Administration Pages
import AdministratorDashboard from './pages/admin/AdministratorDashboard';
import UserRoleManagement from './pages/admin/UserRoleManagement';
import SystemHealthMonitoring from './pages/admin/SystemHealthMonitoring';
import ReportsAuditTrail from './pages/admin/ReportsAuditTrail';

// System Design Lab Pages
import RateLimiterLab from './pages/lab/RateLimiterLab';
import ConsistentHashingLab from './pages/lab/ConsistentHashingLab';
import KeyValueStoreLab from './pages/lab/KeyValueStoreLab';
import UniqueIdGeneratorLab from './pages/lab/UniqueIdGeneratorLab';
import UrlShortenerLab from './pages/lab/UrlShortenerLab';
import WebCrawlerLab from './pages/lab/WebCrawlerLab';
import AutocompleteLab from './pages/lab/AutocompleteLab';

import NotFound from './pages/NotFound';
import { useAuth, UserRole } from './context/AuthContext';

function ProtectedRoute({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8 text-center text-sm text-slate-600" role="status">Checking your session…</div>;
  if (!user) return <Navigate to="/portal/login" replace state={{ returnTo: location.pathname + location.search }} />;
  if (!roles.includes(user.role)) return <Navigate to={dashboardForRole(user.role)} replace state={{ unauthorized: true }} />;
  return <>{children}</>;
}

function dashboardForRole(role: UserRole): string {
  const dashboards: Record<UserRole, string> = {
    PATIENT: '/portal/dashboard',
    DOCTOR: '/clinical/workspace',
    NURSE: '/nursing/station',
    RECEPTIONIST: '/reception',
    PHARMACIST: '/pharmacy',
    BILLING_STAFF: '/billing/desk',
    ADMIN: '/admin',
  };
  return dashboards[role];
}

const authenticated = (...roles: UserRole[]) => (page: ReactNode) => (
  <ProtectedRoute roles={roles}>{page}</ProtectedRoute>
);

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashComplete = useCallback(() => setSplashDone(true), []);

  return (
    <>
      {!splashDone && <SplashLoader onComplete={handleSplashComplete} />}
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<PublicLayout />}>
              {/* Public Screens (1-7) */}
              <Route path="/" element={<Home />} />
              <Route path="/specialties" element={<Specialties />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/doctors/booking" element={<Booking />} />
              <Route path="/doctors/:doctorId" element={<DoctorProfile />} />
              <Route path="/appointments/book" element={authenticated('PATIENT', 'RECEPTIONIST', 'ADMIN')(<BookAppointment />)} />
              <Route path="/appointments/guided" element={authenticated('PATIENT', 'ADMIN')(<GuidedBooking />)} />

              {/* Patient Portal Screens (8-12) */}
              <Route path="/portal/login" element={<Login />} />
              <Route path="/portal/profile" element={authenticated('PATIENT', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'BILLING_STAFF', 'ADMIN')(<AccountProfile />)} />
              <Route path="/portal/dashboard" element={authenticated('PATIENT', 'ADMIN')(<Dashboard />)} />
              <Route path="/patient-portal" element={<Navigate to="/portal/dashboard" replace />} />
              <Route path="/portal/appointments" element={authenticated('PATIENT', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')(<PatientAppointments />)} />
              <Route path="/portal/medical-records" element={authenticated('PATIENT')(<MedicalRecords />)} />
              <Route path="/portal/billing" element={authenticated('PATIENT', 'BILLING_STAFF', 'ADMIN')(<Billing />)} />
              <Route path="/portal/emergency" element={<PatientEmergencySOS />} />
              <Route path="/emergency/sos" element={<PatientEmergencySOS />} />
              <Route path="/portal/knowledge" element={<HealthKnowledgeSearch />} />
              <Route path="/health-knowledge" element={<Navigate to="/portal/knowledge" replace />} />

              {/* Emergency Response & Incident Command Center Screens */}
              <Route path="/emergency/command-center" element={authenticated('NURSE', 'DOCTOR', 'RECEPTIONIST', 'ADMIN')(<EmergencyCommandCenter />)} />
              <Route path="/emergency/incidents/:id" element={authenticated('NURSE', 'DOCTOR', 'RECEPTIONIST', 'ADMIN', 'PATIENT')(<IncidentDetailWorkspace />)} />
              <Route path="/emergency" element={<Navigate to="/emergency/command-center" replace />} />

              {/* Clinical & Nursing Screens (13-15) */}
              <Route path="/clinical/workspace" element={authenticated('DOCTOR', 'ADMIN')(<DoctorClinicalWorkspace />)} />
              <Route path="/clinical/knowledge" element={authenticated('DOCTOR', 'NURSE', 'ADMIN')(<MedicalKnowledgeWorkspace />)} />
              <Route path="/clinical-dashboard" element={<Navigate to="/clinical/workspace" replace />} />
              <Route path="/nursing/station" element={authenticated('NURSE', 'ADMIN')(<NurseTriageWorkspace />)} />
              <Route path="/nursing-station" element={<Navigate to="/nursing/station" replace />} />
              <Route path="/emr/patients" element={authenticated('DOCTOR', 'NURSE', 'ADMIN')(<PatientManagementEMR />)} />
              <Route path="/emr" element={<Navigate to="/emr/patients" replace />} />

              {/* Operations Screens (16-20) */}
              <Route path="/reception" element={authenticated('RECEPTIONIST', 'ADMIN')(<ReceptionFrontDesk />)} />
              <Route path="/pharmacy" element={authenticated('PHARMACIST', 'ADMIN')(<PharmacyInventory />)} />
              <Route path="/billing/desk" element={authenticated('BILLING_STAFF', 'ADMIN')(<BillingFinancialDesk />)} />
              <Route path="/billing" element={<Navigate to="/billing/desk" replace />} />
              <Route path="/operations/hub" element={authenticated('RECEPTIONIST', 'ADMIN')(<OperationsHub />)} />
              <Route path="/operations" element={<Navigate to="/operations/hub" replace />} />
              <Route path="/operations/appointments" element={authenticated('RECEPTIONIST', 'DOCTOR', 'ADMIN')(<AppointmentManagement />)} />

              {/* Administration Screens (21-24) */}
              <Route path="/admin" element={authenticated('ADMIN')(<AdministratorDashboard />)} />
              <Route path="/admin/users" element={authenticated('ADMIN')(<UserRoleManagement />)} />
              <Route path="/admin/system-health" element={authenticated('ADMIN')(<SystemHealthMonitoring />)} />
              <Route path="/admin/reports" element={authenticated('ADMIN')(<ReportsAuditTrail />)} />
              <Route path="/admin/knowledge-sources" element={authenticated('ADMIN')(<KnowledgeSourcesManager />)} />

              {/* System Design Lab Components (25-31) - Open for System Design Evaluation */}
              <Route path="/lab/rate-limiter" element={<RateLimiterLab />} />
              <Route path="/lab/consistent-hashing" element={<ConsistentHashingLab />} />
              <Route path="/lab/key-value-store" element={<KeyValueStoreLab />} />
              <Route path="/lab/unique-id-generator" element={<UniqueIdGeneratorLab />} />
              <Route path="/lab/url-shortener" element={<UrlShortenerLab />} />
              <Route path="/lab/web-crawler" element={<WebCrawlerLab />} />
              <Route path="/lab/autocomplete" element={<AutocompleteLab />} />

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <MedoraAI />
        </Router>
      </AuthProvider>
    </>
  );
}
