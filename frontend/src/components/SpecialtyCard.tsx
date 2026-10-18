import React from 'react';
import { Link } from 'react-router-dom';
import { Department } from '../types';
import { getDepartmentIcon } from '../utils/iconMap';

interface SpecialtyCardProps {
  department: Department;
}

export const SpecialtyCard: React.FC<SpecialtyCardProps> = ({ department }) => {
  const iconSymbol = getDepartmentIcon(department.icon, department.name, department.code);

  return (
    <div className="specialty-card">
      {/* 1. Header: 44x44px icon container on left, badge on right, vertically centered */}
      <div className="specialty-card__header">
        <div className="w-[44px] h-[44px] rounded-xl bg-surface-container flex items-center justify-center text-secondary shrink-0">
          <span className="material-symbols-outlined text-[24px] leading-none select-none">
            {iconSymbol}
          </span>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface text-[12px] font-medium leading-[16px] whitespace-nowrap">
          {department.specialistsCount} Specialists
        </span>
      </div>

      {/* 2. Title: 18px / 600 / 26px */}
      <h3 className="specialty-card__title">
        {department.name}
      </h3>

      {/* 3. Description: 14px / 400 / 22px */}
      <p className="specialty-card__description line-clamp-3 mb-4">
        {department.description}
      </p>

      {/* Tags: naturally wrapped */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {department.tags.map((tag, idx) => (
          <span
            key={idx}
            className="px-2 py-0.5 rounded bg-surface-container-low text-primary text-[12px] font-medium leading-[16px]"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* 4. Footer: anchored to bottom of card, aligned */}
      <div className="specialty-card__footer">
        <span className="text-[13px] font-normal text-on-surface-variant leading-[20px] truncate max-w-[160px]">
          Lead: {department.leadDoctor}
        </span>
        <Link
          to={`/doctors?dept=${department.category || department.code.toLowerCase()}`}
          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-surface-container text-secondary text-[14px] font-semibold leading-[20px] hover:bg-secondary hover:text-white transition-colors shrink-0"
        >
          <span>Find Doctors</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
};
