import React from 'react';
import { Pill, Printer, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { PrescriptionDto } from '../services/api';

interface Props {
  prescription: PrescriptionDto;
  onClose: () => void;
}

export default function PrescriptionDispensingSlipModal({ prescription, onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const isDispensed = String(prescription.status).toUpperCase() === 'DISPENSED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full shadow-2xl overflow-hidden my-8 animate-scaleUp">
        {/* Modal Top Bar */}
        <div className="print:hidden bg-slate-100 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-xs text-slate-800">Hospital Pharmacy Dispensing Slip &amp; Medication Label</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-[#002043] hover:bg-[#17365d] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-teal-300" />
              <span>Print Medication Label</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="p-8 space-y-6 text-slate-800 bg-white">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-slate-900">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
                  Rx
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-[#002043]">
                    MEDORA MAIN DISPENSARY
                  </h2>
                  <span className="text-[10px] text-teal-700 font-bold block uppercase tracking-wider">
                    24/7 Central Pharmacy &amp; Outpatient Formulary
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Medora Clinical Campus, Chennai<br />
                Pharmacist Desk: +91 44 2829 0214 • pharmacy@aarogya.care
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isDispensed ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-amber-50 text-amber-700 border border-amber-300'
              }`}>
                {isDispensed && <CheckCircle2 className="w-3 h-3" />}
                <span>{prescription.status}</span>
              </span>
            </div>
          </div>

          {/* Meta Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Prescription No</span>
              <span className="font-mono font-bold text-slate-900">{prescription.prescription_number || prescription.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Prescribing Doctor</span>
              <span className="font-bold text-slate-800">{prescription.doctor_name || 'Consultant Physician'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient Details</span>
              <span className="font-extrabold text-slate-900 block">{prescription.patient_name || 'Patient'}</span>
              <span className="font-mono font-bold text-slate-600 text-[11px]">ID: {prescription.patient_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Dispensed At</span>
              <span className="font-bold text-slate-800">
                {prescription.created_at ? new Date(prescription.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Medication Items */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Dispensed Medications &amp; Dosage Instructions
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-2">Medicine Name</th>
                    <th className="px-3 py-2">Dosage</th>
                    <th className="px-3 py-2">Frequency</th>
                    <th className="px-2 py-2 text-center">Days</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescription.items?.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">
                        {it.medicine_name}
                        {it.instructions && (
                          <span className="block text-[10px] text-teal-800 font-normal mt-0.5">
                            Note: {it.instructions}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{it.dosage}</td>
                      <td className="px-3 py-2.5 text-slate-700 font-medium">{it.frequency}</td>
                      <td className="px-2 py-2.5 text-center font-mono">{it.duration_days}</td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold text-teal-900 bg-teal-50/40">
                        {it.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Caution & Storage Guidelines */}
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Patient Medication Guidelines</span>
            </div>
            <p>
              Take all medicines strictly as instructed by your clinician. Complete the full prescribed course.
              Keep out of reach of children. Store below 25°C in a dry place. In case of unexpected adverse reactions,
              contact hospital emergency immediately.
            </p>
          </div>

          {/* Footer & Signature */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-400">
            <div>
              <p>Barcode verified against Medora drug inventory database.</p>
              <p>Batch allocation and expiry verified at the time of dispensing.</p>
            </div>
            <div className="text-right">
              <div className="w-36 border-b border-slate-400 pb-1 mb-1 font-mono text-slate-600 text-center font-bold">
                Registered Pharmacist
              </div>
              <span>Dispensary Authorized Seal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
