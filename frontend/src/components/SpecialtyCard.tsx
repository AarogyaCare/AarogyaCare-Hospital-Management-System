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
    <div className="specialty-card bg-[#FFFFFF] dark:bg-[#1A2420] border border-[#E2DDD6] dark:border-[#2E3E34] rounded-2xl p-6 flex flex-col justify-between transition-all hover:border-[#2D6A4F] hover:shadow-md">
      {/* 1. Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] flex items-center justify-center text-[#2D6A4F] dark:text-[#74C69D] shrink-0">
            <span className="material-symbols-outlined text-[24px]">
              {iconSymbol}
            </span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#F5F4EF] dark:bg-[#1F2E28] text-[#4A5F4E] dark:text-[#A8D5B5] text-[12px] font-medium whitespace-nowrap">
            {department.specialistsCount} Specialists
          </span>
        </div>

        {/* 2. Title */}
        <h3 className="text-[17px] font-bold text-[#1A2E1A] dark:text-[#E8EDE8] mb-2 font-sans">
          {department.name}
        </h3>

        {/* 3. Description */}
        <p className="text-[13px] text-[#4A5F4E] dark:text-[#B8CCBC] line-clamp-3 mb-4 leading-relaxed">
          {department.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {department.tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-lg bg-[#F5F4EF] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] text-[11px] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 4. Footer */}
      <div className="pt-4 border-t border-[#E2DDD6] dark:border-[#2E3E34] flex items-center justify-between gap-2">
        <span className="text-[12px] text-[#6B7F6E] dark:text-[#B8CCBC] truncate max-w-[150px]">
          Lead: {department.leadDoctor}
        </span>
        <Link
          to={`/doctors?dept=${department.category || department.code.toLowerCase()}`}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#EAF5EE] dark:bg-[#1F2E28] text-[#2D6A4F] dark:text-[#74C69D] text-[13px] font-semibold hover:bg-[#2D6A4F] hover:text-white transition-colors shrink-0"
        >
          <span>Find Doctors</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
};
