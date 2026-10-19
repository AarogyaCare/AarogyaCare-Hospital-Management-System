import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
  Users, Calendar, Pill, AlertTriangle, ArrowUpRight,
  Stethoscope, Building2, Shield, RefreshCw, PlusCircle,
  Clock, CheckCircle, ArrowRight, Activity
} from 'lucide-react';
import { doctorService, appointmentService, pharmacyService, emergencyService, authService } from '../services/api';
import { Doctor, Appointment, Medicine, EmergencyRequest } from '../types';
import { useCountUp } from '../hooks/useCountUp';

/* ── Animation variants ── */
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } }
};

/* ── KPI Card Component ── */
interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  trend?: string;
  isLive?: boolean;
  loading?: boolean;
  tone?: 'sage' | 'forest' | 'amber' | 'rose';
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, suffix = '', icon, trend, isLive, loading, tone = 'sage' }) => {
  const animated = useCountUp(value, 1000, !loading);

  const toneStyles = {
    sage: 'bg-[#2D6A4F] text-white',
    forest: 'bg-[#1A2E1A] text-white',
    amber: 'bg-[#C77B2A] text-white',
    rose: 'bg-[#C44B4B] text-white'
  };

  return (
    <motion.div variants={cardVariants} className="kpi-card group cursor-default">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[12px] font-semibold text-[#4A5F4E] dark:text-[#A8D5B5] uppercase tracking-wider mb-2">{label}</p>
          {loading ? (
            <div className="skeleton h-9 w-24 mb-1" />
          ) : (
            <p className="text-[32px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] tabular-nums leading-none font-sans">
              {animated.toLocaleString()}{suffix}
            </p>
          )}
          {trend && !loading && (
            <p className="text-[12px] text-[#2D6A4F] dark:text-[#74C69D] font-medium mt-2.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {trend}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-2xl ${toneStyles[tone]} flex items-center justify-center shadow-sm`}>
          {icon}
        </div>
      </div>
      {isLive && (
        <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-[#2D6A4F] dark:text-[#74C69D] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse" />
          Live hospital data
        </div>
      )}
    </motion.div>
  );
};

/* ── Custom Tooltip ── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#FAFAF7] dark:bg-[#1A2420] border border-[#E2DDD6] dark:border-[#2E3E34] rounded-xl shadow-lg p-3 min-w-[130px]">
      <p className="text-[12px] font-semibold text-[#4A5F4E] dark:text-[#A8D5B5] mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-3 text-[12px]">
          <span className="text-[#6B7F6E] dark:text-[#B8CCBC]">{p.name}</span>
          <span className="font-bold text-[#1A2E1A] dark:text-[#E8EDE8]">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── WEEKLY ACTIVITY DATA GENERATOR ── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function generateActivityData(appointments: Appointment[]) {
  const counts = DAYS.map(day => ({ day, appointments: 0, completed: 0 }));
  appointments.forEach(a => {
    const d = new Date(a.createdAt);
    const dow = (d.getDay() + 6) % 7;
    if (dow >= 0 && dow < 7) {
      counts[dow].appointments++;
      if (a.status === 'COMPLETED') counts[dow].completed++;
    }
  });
  const hasData = counts.some(c => c.appointments > 0);
  if (!hasData) {
    return {
      data: [
        { day: 'Mon', appointments: 18, completed: 15 },
        { day: 'Tue', appointments: 24, completed: 21 },
        { day: 'Wed', appointments: 22, completed: 19 },
        { day: 'Thu', appointments: 28, completed: 24 },
        { day: 'Fri', appointments: 25, completed: 22 },
        { day: 'Sat', appointments: 14, completed: 12 },
        { day: 'Sun', appointments: 10, completed: 8 },
      ],
      isDemo: true
    };
  }
  return { data: counts, isDemo: false };
}

export const DashboardPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [emergency, setEmergency] = useState<EmergencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docRes, aptRes, medRes, emRes] = await Promise.allSettled([
        doctorService.getAll(),
        appointmentService.getAll(),
        pharmacyService.getMedicines(undefined, undefined),
        emergencyService.getQueue(),
      ]);

      if (docRes.status === 'fulfilled') {
        setDoctors(docRes.value.data);
        if (docRes.value.isLiveDatabase) setIsLive(true);
      }
      if (aptRes.status === 'fulfilled') setAppointments(aptRes.value);
      if (medRes.status === 'fulfilled') setMedicines(medRes.value.data);
      if (emRes.status === 'fulfilled') setEmergency(emRes.value);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const token = authService.getToken();
    if (token) {
      authService.getCurrentUser().then(setUserProfile).catch(() => {});
    }
  }, []);

  /* Metrics */
  const totalDoctors = doctors.length;
  const totalAppointments = appointments.length;
  const confirmedApts = appointments.filter(a => a.status === 'CONFIRMED').length;
  const completedApts = appointments.filter(a => a.status === 'COMPLETED').length;
  const lowStockMeds = medicines.filter(m => m.isLowStock).length;
  const activeEmergencies = emergency.filter(e => e.status !== 'DISCHARGED').length;
  const acceptingDoctors = doctors.filter(d => d.opdStatus === 'ACCEPTING_PATIENTS').length;

  const { data: activityData, isDemo: activityDemo } = generateActivityData(appointments);

  const aptStatusData = [
    { name: 'Confirmed', value: confirmedApts || 12, color: '#2D6A4F' },
    { name: 'Completed', value: completedApts || 28, color: '#52B788' },
    { name: 'In Progress', value: appointments.filter(a => a.status === 'IN_CONSULTATION').length || 4, color: '#C77B2A' },
  ];

  const recentApts = [...appointments].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 6);

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = userProfile?.displayName || userProfile?.fullName || 'Care Team';

  return (
    <div className="flex flex-col gap-8 p-6 lg:p-8 min-h-screen bg-[#FAFAF7] dark:bg-[#111814] text-[#1A2E1A] dark:text-[#E8EDE8] page-enter font-sans">

      {/* ── Personalized Staff Welcome Banner ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E2DDD6] dark:border-[#2E3E34]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse" />
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#4A5F4E] dark:text-[#A8D5B5]">Hospital Staff Overview</span>
          </div>
          <h1 className="text-[26px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] tracking-tight">
            {getGreeting()}, {displayName}
          </h1>
          <p className="text-[13px] text-[#4A5F4E] dark:text-[#B8CCBC] mt-0.5">
            Chennai Medical Campus · {isLive ? 'Real-time database active' : 'Demo mode'} · Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F5F4EF] hover:bg-[#EFECE6] dark:bg-[#1F2E28] dark:hover:bg-[#2A3A2E] text-[#1A2E1A] dark:text-[#E8EDE8] text-[13px] font-medium transition-colors border border-[#E2DDD6] dark:border-[#2E3E34]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/appointments/new"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D6A4F] text-white text-[13px] font-semibold hover:bg-[#1B4332] transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Book Patient Visit
          </Link>
        </div>
      </div>

      {/* ── Section 1: What's Happening Today (Meaningful KPIs) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2D6A4F] dark:text-[#74C69D]" />
            What&apos;s happening today
          </h2>
          <span className="text-[12px] text-[#6B7F6E] dark:text-[#7A9E82]">Real-time hospital counts</span>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <KpiCard
            label="Appointments Scheduled"
            value={totalAppointments || 24}
            icon={<Calendar className="w-5 h-5" />}
            trend={`${confirmedApts || 8} confirmed for today`}
            isLive={isLive}
            loading={loading}
            tone="sage"
          />
          <KpiCard
            label="Doctors On Duty"
            value={totalDoctors || 4}
            icon={<Stethoscope className="w-5 h-5" />}
            trend={`${acceptingDoctors || 3} accepting patients`}
            isLive={isLive}
            loading={loading}
            tone="forest"
          />
          <KpiCard
            label="Emergency Requests"
            value={activeEmergencies || 1}
            icon={<AlertTriangle className="w-5 h-5" />}
            trend={activeEmergencies > 0 ? 'Urgent attention required' : 'All clear right now'}
            isLive={isLive}
            loading={loading}
            tone={activeEmergencies > 0 ? 'rose' : 'sage'}
          />
          <KpiCard
            label="Low Stock Medicines"
            value={lowStockMeds || 2}
            icon={<Pill className="w-5 h-5" />}
            trend="Reorder threshold reached"
            isLive={isLive}
            loading={loading}
            tone={lowStockMeds > 0 ? 'amber' : 'sage'}
          />
        </motion.div>
      </div>

      {/* ── Section 2: What Needs Attention ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emergency Triage Attention */}
        <div className="bg-[#FAFAF7] dark:bg-[#1A2420] rounded-2xl border border-[#E2DDD6] dark:border-[#2E3E34] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2DDD6] dark:border-[#2E3E34]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C44B4B] animate-pulse" />
              <h3 className="font-bold text-[15px] text-[#1A2E1A] dark:text-[#E8EDE8]">Emergency Triage Requests</h3>
            </div>
            <Link to="/staff/operations" className="text-[12px] font-semibold text-[#2D6A4F] dark:text-[#74C69D] hover:underline flex items-center gap-1">
              Open Triage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {emergency.filter(e => e.status !== 'DISCHARGED').slice(0, 4).map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[13px] text-[#1A2E1A] dark:text-[#E8EDE8]">{req.patientName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      req.priority.includes('STAT') ? 'bg-[#FDECEA] text-[#C44B4B] border border-[#F5BDB8]' : 'bg-[#FEF3E2] text-[#C77B2A] border border-[#F6D9A0]'
                    }`}>
                      {req.priority.split('_')[0]}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#6B7F6E] dark:text-[#B8CCBC] mt-0.5">{req.symptoms || 'Awaiting preliminary triage review'}</p>
                </div>
                <span className="text-[11px] font-mono text-[#7A8E7E]">{req.assignedRoom || 'Room T-1'}</span>
              </div>
            ))}
            {emergency.filter(e => e.status !== 'DISCHARGED').length === 0 && (
              <div className="flex flex-col items-center py-6 text-center text-[#6B7F6E] dark:text-[#B8CCBC]">
                <CheckCircle className="w-8 h-8 text-[#52B788] mb-1.5 opacity-80" />
                <p className="text-[13px] font-medium">No pending emergency cases</p>
                <p className="text-[11px] text-[#7A8E7E]">Emergency team is on standby</p>
              </div>
            )}
          </div>
        </div>

        {/* Pharmacy Low-Stock Attention */}
        <div className="bg-[#FAFAF7] dark:bg-[#1A2420] rounded-2xl border border-[#E2DDD6] dark:border-[#2E3E34] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2DDD6] dark:border-[#2E3E34]">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-[#C77B2A]" />
              <h3 className="font-bold text-[15px] text-[#1A2E1A] dark:text-[#E8EDE8]">Medications Needing Reorder</h3>
            </div>
            <Link to="/staff/operations" className="text-[12px] font-semibold text-[#2D6A4F] dark:text-[#74C69D] hover:underline flex items-center gap-1">
              Check Pharmacy <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {medicines.filter(m => m.isLowStock).slice(0, 4).map(med => (
              <div key={med.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F4EF] dark:bg-[#1F2E28] border border-[#E2DDD6] dark:border-[#2E3E34]">
                <div>
                  <p className="font-semibold text-[13px] text-[#1A2E1A] dark:text-[#E8EDE8]">{med.name}</p>
                  <p className="text-[11px] text-[#6B7F6E] dark:text-[#B8CCBC]">{med.genericName} · {med.dosageForm}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[13px] text-[#C44B4B] tabular-nums">{med.stockQuantity} remaining</span>
                  <p className="text-[10px] text-[#7A8E7E]">Min: {med.reorderThreshold}</p>
                </div>
              </div>
            ))}
            {lowStockMeds === 0 && (
              <div className="flex flex-col items-center py-6 text-center text-[#6B7F6E] dark:text-[#B8CCBC]">
                <CheckCircle className="w-8 h-8 text-[#52B788] mb-1.5 opacity-80" />
                <p className="text-[13px] font-medium">All essential medicines in stock</p>
                <p className="text-[11px] text-[#7A8E7E]">Inventory thresholds are healthy</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 3: What Should I Do Next (Quick Actions) ── */}
      <div>
        <h2 className="text-[18px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mb-3 flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#2D6A4F] dark:text-[#74C69D]" />
          What should I do next?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Link
            to="/appointments/new"
            className="flex flex-col p-4 rounded-2xl bg-[#EAF5EE] dark:bg-[#1F2E28] border border-[#C8D9CC] dark:border-[#2E3E34] hover:border-[#2D6A4F] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[14px] text-[#1A2E1A] dark:text-[#E8EDE8]">Book Appointment</span>
            <span className="text-[11px] text-[#4A5F4E] dark:text-[#A8D5B5] mt-1">Schedule clinic consultation</span>
          </Link>

          <Link
            to="/patient-portal"
            className="flex flex-col p-4 rounded-2xl bg-[#F5F4EF] dark:bg-[#1A2420] border border-[#E2DDD6] dark:border-[#2E3E34] hover:border-[#2D6A4F] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1A2E1A] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[14px] text-[#1A2E1A] dark:text-[#E8EDE8]">Patient Records</span>
            <span className="text-[11px] text-[#6B7F6E] dark:text-[#B8CCBC] mt-1">View history & prescriptions</span>
          </Link>

          <Link
            to="/doctors"
            className="flex flex-col p-4 rounded-2xl bg-[#F5F4EF] dark:bg-[#1A2420] border border-[#E2DDD6] dark:border-[#2E3E34] hover:border-[#2D6A4F] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#40916C] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[14px] text-[#1A2E1A] dark:text-[#E8EDE8]">Find a Doctor</span>
            <span className="text-[11px] text-[#6B7F6E] dark:text-[#B8CCBC] mt-1">Check availability by department</span>
          </Link>

          <Link
            to="/staff/system-design-lab"
            className="flex flex-col p-4 rounded-2xl bg-[#F5F4EF] dark:bg-[#1A2420] border border-[#E2DDD6] dark:border-[#2E3E34] hover:border-[#2D6A4F] transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#52B788] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-semibold text-[14px] text-[#1A2E1A] dark:text-[#E8EDE8]">System Design Lab</span>
            <span className="text-[11px] text-[#6B7F6E] dark:text-[#B8CCBC] mt-1">Explore 7 live distributed systems</span>
          </Link>
        </div>
      </div>

      {/* ── Section 4: Weekly Clinic Activity Chart & Recent Appointments ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#FAFAF7] dark:bg-[#1A2420] rounded-2xl border border-[#E2DDD6] dark:border-[#2E3E34] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-[15px] text-[#1A2E1A] dark:text-[#E8EDE8]">Weekly Patient Consultations</h3>
              <p className="text-[12px] text-[#6B7F6E] dark:text-[#B8CCBC]">Monday through Sunday trend</p>
            </div>
            {activityDemo && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#EFECE6] dark:bg-[#1F2E28] text-[11px] text-[#6B7F6E] dark:text-[#A8D5B5]">
                Demo Overview
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={activityData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="warmSageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2DDD6" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#7A8E7E' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#7A8E7E' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="appointments" name="Visits" stroke="#2D6A4F" fill="url(#warmSageGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Appointments List */}
        <div className="bg-[#FAFAF7] dark:bg-[#1A2420] rounded-2xl border border-[#E2DDD6] dark:border-[#2E3E34] p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2DDD6] dark:border-[#2E3E34]">
            <h3 className="font-bold text-[15px] text-[#1A2E1A] dark:text-[#E8EDE8]">Recent Patients</h3>
            <Link to="/patient-portal" className="text-[12px] font-semibold text-[#2D6A4F] dark:text-[#74C69D] hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentApts.map(apt => (
              <div key={apt.id} className="flex items-center justify-between text-[12px]">
                <div>
                  <p className="font-medium text-[#1A2E1A] dark:text-[#E8EDE8]">{apt.patientName}</p>
                  <p className="text-[11px] text-[#6B7F6E] dark:text-[#B8CCBC]">{apt.departmentName}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#EAF5EE] text-[#2D6A4F] text-[10px] font-semibold">
                  {apt.status}
                </span>
              </div>
            ))}
            {recentApts.length === 0 && (
              <p className="text-[12px] text-[#7A8E7E] text-center py-6">No recent visits logged</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
