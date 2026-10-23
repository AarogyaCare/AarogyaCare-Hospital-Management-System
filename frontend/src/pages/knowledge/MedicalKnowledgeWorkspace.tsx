import React, { useEffect, useState } from 'react';
import { api, MedicalKnowledgeItemDto, MedicalKnowledgeSearchResponse } from '../../services/api';
import { ResourcePreviewModal } from '../../components/ResourcePreviewModal';
import { Search, FileText, Filter, ExternalLink, Activity, Layers, CheckCircle2, Clock, Cpu, AlertTriangle } from 'lucide-react';

const SPECIALTIES = [
  { key: 'ALL', label: 'All Specialties' },
  { key: 'CARDIOLOGY', label: 'Cardiology' },
  { key: 'INFECTIOUS_DISEASE', label: 'Infectious Disease' },
  { key: 'GENERAL_MEDICINE', label: 'General Medicine' },
  { key: 'PULMONOLOGY', label: 'Pulmonology' }
];

const CATEGORIES = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'CLINICAL_PROTOCOL', label: 'Clinical Protocols & Triage' },
  { key: 'PREVENTION', label: 'Prevention & Risk Stratification' },
  { key: 'SYMPTOMS', label: 'Symptoms & Warning Signs' },
  { key: 'PUBLIC_HEALTH', label: 'Public Health Advisories' }
];

export const MedicalKnowledgeWorkspace: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [response, setResponse] = useState<MedicalKnowledgeSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const fetchGuidelines = (q = query, cat = selectedCategory, spec = selectedSpecialty) => {
    setLoading(true);
    api.searchKnowledge(q, cat, spec)
      .then((res) => setResponse(res))
      .catch((err) => console.error('Failed to load clinical guidelines', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchGuidelines();
  }, [selectedCategory, selectedSpecialty]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchGuidelines();
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              Clinical Evidence &amp; Decision Support
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-mono">
              Consistent Hashing Tier
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            Medical Knowledge &amp; Clinical Guidelines Workspace
          </h1>
          <p className="text-slate-500 text-xs md:text-sm max-w-2xl leading-relaxed">
            Evidence-based standard operating procedures, acute stroke pathways, and infection control triage routed deterministically across partitioned caching nodes.
          </p>
        </div>

        {response && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700 min-w-[260px] shrink-0 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-teal-600" />
                Hash Ring Node:
              </span>
              <span className="font-mono text-teal-700 font-bold bg-teal-50/80 px-2 py-0.5 rounded border border-teal-200/60">
                {response.routed_cache_node}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Cache Tier Status:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                  response.cache_status === 'ERROR' || response.cache_tier === 'UNAVAILABLE'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : response.cache_hit
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                {response.cache_status === 'ERROR' || response.cache_tier === 'UNAVAILABLE'
                  ? 'REDIS ERROR / UNAVAILABLE'
                  : response.cache_hit
                  ? `HIT (${response.cache_tier || 'REDIS'})`
                  : `MISS (${response.cache_tier || 'REDIS'} POPULATED)`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Lookup Duration:
              </span>
              <span className="text-slate-900 font-semibold">{response.search_latency_ms} ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Clinical Filter Bar */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter guidelines by condition, drug, or clinical criteria (e.g., stroke, oseltamivir, triage, IPC)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 focus:bg-white text-xs transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 focus:bg-white transition"
            >
              {SPECIALTIES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 focus:bg-white transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
          </div>
        </form>
      </div>

      {/* Guidelines Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading verified clinical protocols...</p>
        </div>
      ) : response && response.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {response.items.map((item: MedicalKnowledgeItemDto) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 hover:border-teal-400/60 rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between transition group"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                      {item.source_name || item.domain}
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {item.specialty.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    ID: {item.id.replace('doc-', '')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition">
                  {item.title}
                </h3>

                <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {item.content_snippet}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  <span>{item.section_count} Clinical Sections</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedResourceId(item.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-sm flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Protocol</span>
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="Open external original publication"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No clinical guidelines matched your criteria</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting your specialty or category filters to explore the entire clinical protocol collection.
          </p>
        </div>
      )}

      {/* In-App Resource Reader Modal */}
      <ResourcePreviewModal
        resourceId={selectedResourceId}
        onClose={() => setSelectedResourceId(null)}
      />
    </div>
  );
};
