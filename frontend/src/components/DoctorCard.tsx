import React from 'react';
import { Link } from 'react-router-dom';
import { Doctor } from '../types';

interface DoctorCardProps {
  doctor: Doctor;
  onSelectSlot?: (doctorId: string, slotId: string) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onSelectSlot }) => {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6 border border-surface-container-high flex flex-col lg:flex-row gap-6 justify-between">
      <div className="flex flex-col sm:flex-row gap-5 flex-1">
        <div className="w-32 h-36 rounded-2xl overflow-hidden bg-surface-container shrink-0 relative shadow-sm">
          <img
            src={doctor.avatarUrl}
            alt={doctor.displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/consultation.png';
            }}
          />
          <div className="absolute bottom-1 left-1 right-1 py-0.5 rounded bg-primary/80 backdrop-blur-sm text-white text-[10px] text-center uppercase tracking-wider font-semibold">
            Accepting
          </div>
        </div>

        <div className="flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-text px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-medium leading-[16px]">
                {doctor.departmentName}
              </span>
              <span className="metadata-text text-on-surface-variant">
                • {doctor.experienceYears}+ Yrs Experience
              </span>
              <div className="flex items-center gap-1 text-[13px] text-amber-600 font-bold ml-auto">
                <span className="material-symbols-outlined text-[15px]">star</span>
                <span>{doctor.rating}</span>
                <span className="metadata-text text-on-surface-variant font-normal">({doctor.reviewCount})</span>
              </div>
            </div>

            <h3 className="card-title text-primary font-semibold">
              <Link to={`/doctors/${doctor.id}`} className="hover:text-secondary transition-colors">
                {doctor.displayName}
              </Link>
            </h3>
            <p className="metadata-text text-on-surface-variant mt-0.5">{doctor.designation}</p>
            <p className="metadata-text text-outline mt-0.5">{doctor.qualifications}</p>

            <div className="flex flex-wrap items-center gap-3 mt-3 body-text text-on-surface-variant">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">meeting_room</span>
                <span>{doctor.chamberRoom}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                <span>Avg Wait: {doctor.averageWaitMins} mins</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mt-3">
              {doctor.specializations.map((spec, idx) => (
                <span
                  key={idx}
                  className="badge-text px-2 py-0.5 rounded bg-surface-container-low text-primary font-medium"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-surface-container-high/60 flex items-center gap-3">
            <Link
              to={`/doctors/${doctor.id}`}
              className="btn-text text-secondary hover:underline flex items-center gap-1"
            >
              <span>Full Consultant Bio & Reviews</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="lg:w-72 shrink-0 bg-surface-container-low/70 rounded-xl p-4 border border-surface-container-high flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
              Next Available Slot
            </span>
            <span className="text-[11px] text-secondary font-medium">{doctor.nextSlotDate}</span>
          </div>
          <div className="p-3 rounded-lg bg-surface-container-lowest text-center border border-surface-container-high shadow-sm my-2">
            <span className="font-headline-sm text-headline-sm text-primary font-bold block">{doctor.nextSlotTime}</span>
            <span className="text-[11px] text-on-surface-variant block mt-0.5">In-Person OPD Chamber</span>
          </div>
        </div>

        <div className="pt-2">
          <Link
            to={`/appointments/new?doctorId=${doctor.id}`}
            className="w-full py-2.5 rounded-xl bg-primary text-white text-center font-title-sm hover:bg-secondary transition-colors block shadow-sm"
          >
            Lock & Book Slot
          </Link>
        </div>
      </div>
    </div>
  );
};
