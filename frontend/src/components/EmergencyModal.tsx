import React, { useState } from 'react';
import { EmergencyRequest } from '../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitEmergency: (req: Partial<EmergencyRequest>) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmitEmergency 
}) => {
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [priority, setPriority] = useState<'ESI-1_STAT' | 'ESI-2_EMERGENT' | 'ESI-3_URGENT'>('ESI-1_STAT');
  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `EM-${Math.floor(100 + Math.random() * 900)}`;
    setRequestId(id);
    onSubmitEmergency({
      requestNumber: id,
      patientName: patientName || 'Unregistered Trauma Patient',
      patientPhone: phone || '+91 99999 00000',
      symptoms: symptoms || 'Acute emergency triage trigger',
      priority,
      status: 'TRIAGE_RECEIVED',
      assignedRoom: priority === 'ESI-1_STAT' ? 'Resus Bay 01' : 'Triage Bay 03',
      assignedDoctor: 'Dr. N. Soundararajan (Duty In-Charge)',
      waitTime: '<2 mins',
      createdAt: 'Just now'
    });
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
    setPatientName('');
    setPhone('');
    setSymptoms('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-surface-container-high animate-scaleUp">
        {/* Header Ribbon */}
        <div className="bg-error text-white p-space-md flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[28px] animate-pulse">emergency</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm leading-tight">
                24/7 Acute Trauma & Emergency Intake
              </h3>
              <p className="text-label-sm opacity-90">
                Direct Level-1 Triage Coordination • Chennai Campus
              </p>
            </div>
          </div>
          <button 
            onClick={handleReset}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Disclaimer Alert */}
        <div className="p-3 bg-error-container/40 border-b border-error/20 flex items-start gap-2 text-on-error-container text-body-sm">
          <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">warning</span>
          <p className="text-[12px] leading-relaxed">
            <strong>System Prototype Notice:</strong> In life-threatening emergencies, immediately call emergency services <strong>1066</strong> or <strong>+91 44 2836 0000</strong>. This intake form simulates high-priority queueing and staff notification.
          </p>
        </div>

        {/* Form Body or Success State */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="p-space-lg space-y-space-md">
            <div>
              <label className="block font-title-sm text-title-sm text-primary mb-1">
                Triage Priority Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('ESI-1_STAT')}
                  className={`py-2 px-3 rounded-lg text-label-md font-label-md flex flex-col items-center gap-1 transition-all border ${
                    priority === 'ESI-1_STAT'
                      ? 'bg-error text-white border-error shadow-sm'
                      : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                  }`}
                >
                  <span className="font-bold">ESI-1 STAT</span>
                  <span className="text-[10px] opacity-90">Immediate Resus</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('ESI-2_EMERGENT')}
                  className={`py-2 px-3 rounded-lg text-label-md font-label-md flex flex-col items-center gap-1 transition-all border ${
                    priority === 'ESI-2_EMERGENT'
                      ? 'bg-secondary text-white border-secondary shadow-sm'
                      : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                  }`}
                >
                  <span className="font-bold">ESI-2 Emergent</span>
                  <span className="text-[10px] opacity-90">&lt;10 Min Review</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPriority('ESI-3_URGENT')}
                  className={`py-2 px-3 rounded-lg text-label-md font-label-md flex flex-col items-center gap-1 transition-all border ${
                    priority === 'ESI-3_URGENT'
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface border-surface-container-high hover:bg-surface-container'
                  }`}
                >
                  <span className="font-bold">ESI-3 Urgent</span>
                  <span className="text-[10px] opacity-90">Stable Triage</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-title-sm text-title-sm text-primary mb-1">
                Patient Name or Identifier
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. S. Rajendran (or Unknown Male/Female)"
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none focus:ring-2 focus:ring-error transition-all border border-surface-container-high"
                required
              />
            </div>

            <div>
              <label className="block font-title-sm text-title-sm text-primary mb-1">
                Contact Phone / Attendant Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98401 XXXXX"
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none focus:ring-2 focus:ring-error transition-all border border-surface-container-high"
                required
              />
            </div>

            <div>
              <label className="block font-title-sm text-title-sm text-primary mb-1">
                Reported Acute Symptoms / Clinical Event
              </label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe onset, chest pain, altered sensorium, trauma mechanism, severe bleeding..."
                rows={3}
                className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm focus:outline-none focus:ring-2 focus:ring-error transition-all border border-surface-container-high resize-none"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-lg text-on-surface font-title-sm hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-error text-white font-title-sm hover:bg-error/90 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Initiate Emergency Intake</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="p-space-lg flex flex-col items-center text-center space-y-space-md">
            <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center animate-bounce">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-error-container text-error font-mono font-bold text-label-md">
                INCIDENT ID: {requestId}
              </span>
              <h4 className="font-headline-sm text-headline-sm text-primary mt-2">
                Emergency Triage Acknowledged
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mt-1">
                Your emergency request is committed to PostgreSQL with priority <strong>{priority}</strong>.
              </p>
            </div>

            <div className="w-full bg-surface-container-low p-3 rounded-xl border border-surface-container-high text-left text-body-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Allocated Location:</span>
                <span className="font-semibold text-primary">{priority === 'ESI-1_STAT' ? 'Resuscitation Bay 01' : 'Triage Bay 03'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Duty Lead:</span>
                <span className="font-semibold text-primary">Dr. N. Soundararajan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Staff Dispatch:</span>
                <span className="font-semibold text-error">Simulated Outbox Dispatched</span>
              </div>
            </div>

            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-title-sm hover:bg-secondary transition-colors"
            >
              Done & Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
