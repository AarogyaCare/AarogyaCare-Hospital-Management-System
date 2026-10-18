import React from 'react';
import { Link } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-background">
      <div className="max-w-lg w-full bg-surface-container-lowest rounded-[20px] p-8 shadow-sm border border-surface-container-high text-center">
        {/* Medical / Hospital 404 Icon */}
        <div className="w-16 h-16 rounded-2xl bg-secondary-fixed/50 text-secondary flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[36px]">travel_explore</span>
        </div>

        {/* 404 Status Chip */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant badge-text uppercase tracking-wider mb-3">
          <span className="w-2 h-2 rounded-full bg-secondary"></span>
          Error 404 • Page Not Found
        </div>

        {/* Headings */}
        <h1 className="page-heading text-primary tracking-tight mb-2">
          Clinical Resource Not Found
        </h1>
        <p className="body-text text-on-surface-variant mb-6">
          The requested page, doctor profile, or medical reference could not be located on the Aarogya Care clinical network. Please check the URL or use the navigation options below.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Link
            to="/"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-white btn-text hover:bg-secondary transition-colors text-center shadow-sm"
          >
            Return to Homepage
          </Link>
          <Link
            to="/patient-portal"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-surface-container text-primary btn-text hover:bg-surface-container-high transition-colors text-center"
          >
            Patient Portal
          </Link>
        </div>

        {/* Quick Directory Links */}
        <div className="pt-6 border-t border-surface-container-high flex flex-wrap items-center justify-center gap-4 metadata-text text-outline">
          <Link to="/specialties" className="hover:text-primary transition-colors">
            Specialties & CoEs
          </Link>
          <span>•</span>
          <Link to="/doctors" className="hover:text-primary transition-colors">
            Find a Doctor
          </Link>
          <span>•</span>
          <Link to="/staff/operations" className="hover:text-primary transition-colors">
            Operations Hub
          </Link>
        </div>
      </div>
    </div>
  );
};
