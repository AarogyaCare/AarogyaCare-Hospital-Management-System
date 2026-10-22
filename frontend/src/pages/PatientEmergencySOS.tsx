import { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall, ShieldAlert, AlertTriangle, Flame, HeartPulse,
  Clock, MapPin, CheckCircle2, User, RefreshCw, Send, ArrowRight
} from 'lucide-react';
import { api, EmergencyIncidentDetailDto } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PatientEmergencySOS() {
  const { user } = useAuth();
  const [activeEmergency, setActiveEmergency] = useState<EmergencyIncidentDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [form, setForm] = useState({
    patient_name: user?.name || '',
    emergency_type: 'ACUTE_CHEST_PAIN',
    symptoms: '',
    location: '',
    contact_phone: user?.phone || '',
  });

  const checkActiveEmergency = useCallback(async (isSilent = false) => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.activePatientEmergency();
      setActiveEmergency(res);
    } catch (err) {
      console.error('Failed to check active emergency', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    checkActiveEmergency();
    if (!user) return;
    const timer = setInterval(() => checkActiveEmergency(true), 10000);
    return () => clearInterval(timer);
  }, [checkActiveEmergency, user]);

  const handleSubmitSOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        patient_name: form.patient_name || user?.name || 'Emergency Walk-in',
        patient_id: user?.id,
        contact_number: form.contact_phone || user?.phone || '+91 99999 00000',
        triage_level: form.emergency_type.includes('CHEST') || form.emergency_type.includes('BREATH') ? 'RED' : 'YELLOW',
        chief_complaint: form.symptoms || form.emergency_type,
        location: form.location || 'Emergency Entrance',
        emergency_type: form.emergency_type,
        notes: `Urgent alert triggered for ${form.patient_name || user?.name || 'patient'}`,
      };

      const res = await api.createEmergency(payload);
      setFormSubmitted(true);
      await checkActiveEmergency();
    } catch (err: any) {
      alert(err.message || 'Failed to submit emergency request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] text-slate-900 pb-16">
      {/* Critical Red Safety Banner */}
      <div className="bg-rose-700 text-white px-4 md:px-8 py-4 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <Flame className="w-6 h-6 text-rose-200 animate-pulse shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-100">
                Life-Threatening Emergency Alert
              </p>
              <p className="text-xs text-rose-100 mt-0.5">
                For immediate life threats (cardiac arrest, unconsciousness, severe choking, profuse hemorrhage), call emergency ambulance directly.
              </p>
            </div>
          </div>
          <a
            href="tel:108"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-rose-800 font-extrabold text-xs rounded-xl shadow hover:bg-rose-50 transition shrink-0"
          >
            <PhoneCall className="w-4 h-4 text-rose-700" />
            Call Ambulance 108
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-6 space-y-6">
        {/* Hospital Hotlines Quick Card */}
        <div className="bg-gradient-to-r from-[#001730] to-[#0A3D62] text-white rounded-2xl p-6 shadow-md border border-slate-800">
          <h1 className="text-lg md:text-xl font-bold mb-1">Medora Emergency Services &amp; SOS Center</h1>
          <p className="text-xs text-slate-300 mb-4">
            Connect immediately with our 24/7 Emergency Department and Trauma Response Care Team.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="tel:1066"
              className="bg-white/10 hover:bg-white/15 p-3.5 rounded-xl border border-white/10 transition flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider block">Trauma Direct</span>
                <span className="text-sm font-bold text-white">1066</span>
              </div>
            </a>

            <a
              href="tel:+914428290000"
              className="bg-white/10 hover:bg-white/15 p-3.5 rounded-xl border border-white/10 transition flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-sm">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider block">ER Front Desk</span>
                <span className="text-sm font-bold text-white">+91 44 2829 0000</span>
              </div>
            </a>

            <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider block">ER Location</span>
                <span className="text-xs font-semibold text-white">Medora Campus, Gate 1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Emergency Incident Status Card */}
        {loading ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 shadow-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            <p className="text-xs">Checking active emergency status...</p>
          </div>
        ) : activeEmergency ? (
          <div className="bg-white rounded-2xl p-6 border-2 border-rose-300 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-rose-600 animate-pulse" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">Active Emergency Incident</h2>
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {activeEmergency.incident_number || activeEmergency.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => checkActiveEmergency(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
                Refresh Status
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Care Status</span>
                <p className="text-sm font-bold text-slate-900 mt-1 uppercase">
                  {activeEmergency.status}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Allocated ER Bay</span>
                <p className="text-sm font-bold text-teal-800 mt-1">
                  {activeEmergency.assigned_bay || 'In Triage Queue'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Attending Physician</span>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {activeEmergency.assigned_doctor_name || 'Emergency Team On Duty'}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
              <p className="font-semibold">Patient Instructions:</p>
              <p>
                Our trauma and nursing personnel are actively managing your case. If you are en route, proceed to <strong>Gate 1 Emergency Ambulance Bay</strong>.
              </p>
            </div>
          </div>
        ) : (
          /* Request Urgent Help Form */
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Request Urgent Emergency Assistance</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Alert the Medora Front Desk and Emergency Triage Station of your inbound acute arrival.
              </p>
            </div>

            {formSubmitted && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Emergency request submitted successfully! Our emergency triage team has been alerted.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmitSOS} className="space-y-4 text-xs">
              {!user && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={form.patient_name}
                    onChange={e => setForm({ ...form, patient_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Category</label>
                  <select
                    value={form.emergency_type}
                    onChange={e => setForm({ ...form, emergency_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="ACUTE_CHEST_PAIN">Severe Chest Pain / Heart Condition</option>
                    <option value="BREATHING_DIFFICULTY">Severe Shortness of Breath / Asthma Attack</option>
                    <option value="TRAUMA_FALL_FRACTURE">Accident / Injury / Severe Fall</option>
                    <option value="NEURO_STROKE_ALERT">Sudden Weakness / Stroke Symptoms</option>
                    <option value="ALLERGY_ANAPHYLAXIS">Acute Allergic Reaction / Anaphylaxis</option>
                    <option value="HIGH_FEVER_CONVULSION">Pediatric High Fever / Seizures</option>
                    <option value="OTHER_ACUTE">Other Critical / Urgent Medical Symptom</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Callback Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={form.contact_phone}
                    onChange={e => setForm({ ...form, contact_phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Current Location / Status</label>
                <input
                  type="text"
                  placeholder="e.g. In auto-rickshaw near T. Nagar heading to Medora hospital"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Symptoms &amp; Current Condition *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your current symptoms, onset time, and any medications taken..."
                  value={form.symptoms}
                  onChange={e => setForm({ ...form, symptoms: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                <strong>Important Notice:</strong> Submitting this form sends an alert to our Emergency Triage Coordinator. However, if your condition is deteriorating rapidly, please dial <strong>108</strong> immediately for paramedic support.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/20 transition flex items-center gap-2 transform hover:-translate-y-0.5"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Transmitting Alert...' : 'Transmit Emergency Alert to ER Desk'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
