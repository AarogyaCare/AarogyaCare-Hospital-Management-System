import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DEPARTMENTS } from '../data/mockData';
import { Department } from '../types';
import { departmentService } from '../services/api';
import { SpecialtyCard } from '../components/SpecialtyCard';

export const SpecialtiesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'specialists'>('name');
  const [departments, setDepartments] = useState<Department[]>(DEPARTMENTS);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveDatabase, setIsLiveDatabase] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = () => {
    setIsLoading(true);
    departmentService.getAll()
      .then(res => {
        setDepartments(res.data);
        setIsLiveDatabase(res.isLiveDatabase);
        setError(null);
      })
      .catch(() => {
        setError('Failed to fetch departments from service');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const filteredDepts = useMemo(() => {
    return departments.filter(d => {
      const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
      const matchesSearch = 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.specialistsCount - a.specialistsCount;
    });
  }, [departments, searchTerm, selectedCategory, sortBy]);

  return (
    <div className="flex flex-col w-full min-h-screen">
      {/* 1. Top Editorial Header & Breadcrumb Ribbon */}
      <section className="w-full bg-surface-container-low border-b border-surface-container-high/60 py-8 px-margin-mobile md:px-margin">
        <div className="max-w-[1360px] mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant mb-4">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">home</span>
              <span>Home</span>
            </Link>
            <span className="text-outline-variant">/</span>
            <span className="text-primary font-semibold">Specialties & Centres of Excellence</span>
          </nav>

          {/* Page Titles & Micro Badges */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed font-label-sm text-label-sm uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                Tertiary & Quaternary Clinical Network
              </div>
              <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight mb-3">
                Centres of Excellence & Medical Specialties
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                Explore world-class tertiary and quaternary departments with dedicated consultant teams, advanced diagnostic facilities, and interdisciplinary care protocols.
              </p>
              <div className="flex items-center gap-2 mt-3">
                {isLiveDatabase ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    PostgreSQL Authoritative Backend Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Development Local Fixtures
                  </span>
                )}
                {isLoading && (
                  <span className="inline-flex items-center gap-1 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span> Fetching...
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stats Pill Strip */}
            <div className="flex items-center gap-3 shrink-0 bg-surface-container-lowest p-2 rounded-xl shadow-sm">
              <div className="px-4 py-2 text-center">
                <span className="block font-headline-md text-headline-md text-primary font-bold">28+</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Departments</span>
              </div>
              <div className="w-px h-8 bg-surface-container-high"></div>
              <div className="px-4 py-2 text-center">
                <span className="block font-headline-md text-headline-md text-primary font-bold">140+</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Specialists</span>
              </div>
              <div className="w-px h-8 bg-surface-container-high"></div>
              <div className="px-4 py-2 text-center">
                <span className="block font-headline-md text-headline-md text-secondary font-bold">24/7</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Emergency CoEs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Search & Filter Ribbon */}
      <section className="sticky top-20 z-30 w-full bg-surface-container-lowest/95 backdrop-blur-md shadow-sm py-4 px-margin-mobile md:px-margin border-b border-surface-container-high">
        <div className="max-w-[1360px] mx-auto flex flex-col gap-4">
          {/* Search + Sort Line */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search specialty, symptom, or treatment (e.g. Angioplasty, Knee Replacement, Stroke care)..."
                className="w-full pl-11 pr-10 py-3 bg-surface-container-low rounded-xl text-on-surface font-body-md text-body-md placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/40 transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface p-1"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <div className="relative w-full md:w-64">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'specialists')}
                  className="w-full appearance-none bg-surface-container-low text-on-surface font-body-sm text-body-sm py-3 pl-3 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-all cursor-pointer"
                >
                  <option value="name">Sort by Name (A-Z)</option>
                  <option value="specialists">Number of Specialists</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline text-[20px]">
                  expand_more
                </span>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Specialties' },
              { id: 'surgical', label: 'Surgical Specialties' },
              { id: 'medical', label: 'Medical Super-Specialties' },
              { id: 'women-child', label: 'Women & Child' },
              { id: 'emergency', label: 'Critical Care & Emergency' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full font-label-md text-label-md transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container hover:text-primary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Flagship Centres of Excellence Showcase (Bento Grid) */}
      <section className="w-full px-margin-mobile md:px-margin pt-10 pb-6 max-w-[1360px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">workspace_premium</span>
              <span className="font-label-md text-label-md text-secondary font-bold uppercase tracking-wider">
                Apex Clinical Units
              </span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-0.5">
              Flagship Centres of Excellence
            </h2>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
            Dedicated 24/7 Rapid Triage
          </span>
        </div>

        {/* 4 Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Cardiac */}
          <div className="relative group overflow-hidden rounded-2xl bg-surface-container-lowest p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between border border-surface-container-high">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[80px] pointer-events-none group-hover:scale-110 transition-transform"></div>
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-error-container/30 text-error flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[30px]">cardiology</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2.5 py-1 rounded-full bg-secondary-fixed/60 text-on-secondary-fixed font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> 14 Specialists on Duty
                  </span>
                  <span className="font-label-sm text-label-sm text-outline mt-1">Door-to-Balloon: &lt;45 min</span>
                </div>
              </div>
              <h3 className="card-title text-primary group-hover:text-secondary transition-colors mb-2">
                Institute of Cardiac Sciences & Interventional Cardiology
              </h3>
              <p className="body-text text-on-surface-variant mb-5">
                South India's recognized epicenter for complex structural coronary interventions, leadless pacemakers, and zero-delay emergency primary angioplasties.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-2.5 py-1 rounded-md bg-surface-container-low badge-text text-on-surface font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">check_circle</span> 24/7 Primary PCI
                </span>
                <span className="px-2.5 py-1 rounded-md bg-surface-container-low badge-text text-on-surface font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">check_circle</span> Hybrid Bi-Plane Cath Lab
                </span>
                <span className="px-2.5 py-1 rounded-md bg-surface-container-low badge-text text-on-surface font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">check_circle</span> Specialized Valve Clinic
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-surface-container-high/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="metadata-text text-outline">Clinical Lead:</span>
                <span className="text-[14px] font-semibold text-primary">Dr. K. Ramanathan</span>
              </div>
              <Link
                to="/doctors?dept=cardiology"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-white btn-text hover:bg-primary transition-all shadow-sm"
              >
                <span>Find Doctors</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Card 2: Neurosciences */}
          <div className="relative group overflow-hidden rounded-2xl bg-surface-container-lowest p-6 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between border border-surface-container-high">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[80px] pointer-events-none group-hover:scale-110 transition-transform"></div>
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-surface-container text-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[30px]">neurology</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="inline-flex items-center gap-1 badge-text px-2.5 py-1 rounded-full bg-secondary-fixed/60 text-on-secondary-fixed font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> 9 Specialists on Duty
                  </span>
                  <span className="metadata-text text-outline mt-1">Door-to-Needle: &lt;30 min</span>
                </div>
              </div>
              <h3 className="card-title text-primary group-hover:text-secondary transition-colors mb-2">
                Comprehensive Neurosciences & Acute Stroke Unit
              </h3>
              <p className="body-text text-on-surface-variant mb-5">
                NABH-accredited comprehensive stroke protocol with emergency IV thrombolysis, mechanical thrombectomy, and 24/7 neuro-imaging telemetry.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-2.5 py-1 rounded-md bg-surface-container-low badge-text text-on-surface font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">check_circle</span> Bi-Plane Neuro-Intervention
                </span>
                <span className="px-2.5 py-1 rounded-md bg-surface-container-low badge-text text-on-surface font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">check_circle</span> Advanced Epilepsy Monitoring
                </span>
                <span className="px-2.5 py-1 rounded-md bg-surface-container-low badge-text text-on-surface font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-secondary">check_circle</span> Endoscopic Spine Clinic
                </span>
              </div>
            </div>
            <div className="pt-4 border-t border-surface-container-high/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="metadata-text text-outline">Clinical Lead:</span>
                <span className="text-[14px] font-semibold text-primary">Dr. Rajiv Menon</span>
              </div>
              <Link
                to="/doctors?dept=neurology"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-secondary text-white btn-text hover:bg-primary transition-all shadow-sm"
              >
                <span>Find Doctors</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Complete Filtered Department Grid */}
      <section className="w-full px-margin-mobile md:px-margin py-8 max-w-[1360px] mx-auto">
        <h2 className="section-heading text-primary mb-6">
          All Medical & Surgical Departments ({filteredDepts.length})
        </h2>
        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-error body-text">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <span>{error}</span>
            </div>
            <button
              onClick={fetchDepartments}
              className="px-3 py-1.5 rounded-lg bg-error text-white btn-text hover:bg-error/90 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-surface-container-lowest rounded-[20px] p-6 shadow-sm border border-surface-container-high animate-pulse min-h-[300px] flex flex-col justify-between">
                <div>
                  <div className="w-[44px] h-[44px] rounded-xl bg-surface-container mb-4"></div>
                  <div className="h-5 bg-surface-container rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-surface-container rounded w-full mb-2"></div>
                  <div className="h-4 bg-surface-container rounded w-5/6 mb-4"></div>
                  <div className="flex gap-2">
                    <div className="h-4 bg-surface-container rounded w-16"></div>
                    <div className="h-4 bg-surface-container rounded w-20"></div>
                  </div>
                </div>
                <div className="pt-4 border-t border-surface-container-high/60 flex items-center justify-between">
                  <div className="h-4 bg-surface-container rounded w-28"></div>
                  <div className="h-8 bg-surface-container rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-lowest rounded-[20px] border border-surface-container-high p-8">
            <span className="material-symbols-outlined text-outline text-[48px] mb-3">domain_disabled</span>
            <h3 className="card-title text-primary font-bold mb-1">No Departments Found</h3>
            <p className="body-text text-on-surface-variant mb-4">
              No clinical departments matched your search filter "{searchTerm}".
            </p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }}
              className="px-4 py-2 rounded-lg bg-secondary text-white btn-text hover:bg-primary transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepts.map((dept) => (
              <SpecialtyCard key={dept.id} department={dept} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
