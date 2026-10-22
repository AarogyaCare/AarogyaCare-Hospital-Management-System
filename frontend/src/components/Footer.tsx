import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  PhoneCall, ShieldCheck
} from 'lucide-react';

export default function Footer() {
  const { user } = useAuth();
  const portalLinks = user ? {
    PATIENT: [['Patient Dashboard', '/portal/dashboard'], ['My Appointments', '/portal/appointments'], ['Medical Records', '/portal/medical-records'], ['Invoices', '/portal/billing']],
    DOCTOR: [['Doctor Workspace', '/clinical/workspace'], ['Patient Records', '/emr/patients'], ['Appointments', '/operations/appointments']],
    NURSE: [['Nursing Station', '/nursing/station'], ['Patient Records', '/emr/patients']],
    RECEPTIONIST: [['Reception Desk', '/reception'], ['Operations', '/operations/hub'], ['Appointments', '/operations/appointments']],
    PHARMACIST: [['Pharmacy', '/pharmacy']],
    BILLING_STAFF: [['Billing Desk', '/billing/desk']],
    ADMIN: [['Administration', '/admin'], ['User Management', '/admin/users'], ['System Health', '/admin/system-health'], ['Audit Reports', '/admin/reports']],
  }[user.role] : [['Login', '/portal/login'], ['Register', '/portal/login?mode=register'], ['Book Appointment', '/appointments/book']];

  return (
    <footer className="bg-[#001730] text-slate-300 border-t border-slate-800">
      {/* Emergency & Quick Contact Strip */}
      <div className="border-b border-slate-800/80 bg-[#001224] py-6 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">24/7 Acute Trauma &amp; Ambulance Hotlines</h4>
              <p className="text-xs text-slate-400">Door-to-balloon time &lt; 60 mins • Stroke code &lt; 45 mins</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <a 
              href="tel:1066"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-rose-600/30 flex items-center gap-2"
            >
              <span>Emergency 1066</span>
            </a>
            <a 
              href="tel:+914428290000"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl border border-slate-700 transition"
            >
              +91 44 2829 0000
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'ADMIN' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-8`}>
          {/* Hospital Identity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/medora-logo.png"
                alt="Medora"
                className="h-10 object-contain"
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              A 650-bed quaternary referral hospital delivering clinical excellence across Cardiology, Neurosurgery, Robotic Orthopedics, and Multi-organ Transplants with integrated digital health architecture.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>NABH Digital Health Level 2 Accredited</span>
            </div>
          </div>

          {/* Clinical Departments */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Centres of Excellence</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link to="/specialties" className="hover:text-teal-300 transition">Cardiology &amp; Heart Center</Link></li>
              <li><Link to="/specialties" className="hover:text-teal-300 transition">Neurology &amp; Neurosurgery</Link></li>
              <li><Link to="/specialties" className="hover:text-teal-300 transition">Robotic Orthopedics</Link></li>
              <li><Link to="/specialties" className="hover:text-teal-300 transition">Medical &amp; Surgical Oncology</Link></li>
              <li><Link to="/specialties" className="hover:text-teal-300 transition">Nephrology &amp; Kidney Transplant</Link></li>
              <li><Link to="/specialties" className="hover:text-teal-300 transition">Level-1 Trauma &amp; Emergency</Link></li>
            </ul>
          </div>

          {/* Quick Access Portals */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Portals &amp; Workspaces</h5>
            <ul className="space-y-2 text-xs text-slate-400">
              {portalLinks.map(([label, path]) => <li key={path}><Link to={path} className="hover:text-teal-300 transition">{label}</Link></li>)}
            </ul>
          </div>

          {/* System Design Lab (Admin Only) */}
          {user?.role === 'ADMIN' && (
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-white mb-3">System Design Lab</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li><Link to="/lab/rate-limiter" className="hover:text-teal-300 transition">Rate Limiter Simulation</Link></li>
                <li><Link to="/lab/consistent-hashing" className="hover:text-teal-300 transition">Consistent Hashing Ring</Link></li>
                <li><Link to="/lab/key-value-store" className="hover:text-teal-300 transition">LSM Key-Value Store</Link></li>
                <li><Link to="/lab/unique-id-generator" className="hover:text-teal-300 transition">Snowflake ID Generator</Link></li>
                <li><Link to="/lab/url-shortener" className="hover:text-teal-300 transition">URL Shortener Base62</Link></li>
                <li><Link to="/lab/autocomplete" className="hover:text-teal-300 transition">Trie Prefix Autocomplete</Link></li>
              </ul>
            </div>
          )}
        </div>

        {/* Bottom copyright */}
        <div className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Medora Management System. All rights reserved. Medora Clinical Campus, Chennai.</p>
          <div className="flex items-center gap-4">
            {!user && <><Link to="/specialties" className="hover:text-slate-400 transition">Specialties</Link><Link to="/doctors" className="hover:text-slate-400 transition">Doctors</Link><Link to="/portal/login" className="hover:text-slate-400 transition">Login</Link></>}
            {user?.role === 'ADMIN' && <><Link to="/admin/system-health" className="hover:text-slate-400 transition">System Status</Link><Link to="/admin/reports" className="hover:text-slate-400 transition">Audit Reports</Link></>}
          </div>
        </div>
      </div>
    </footer>
  );
}
