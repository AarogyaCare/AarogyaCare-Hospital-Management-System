import React, { useEffect, useState } from 'react';
import { api, MedicalKnowledgeItemDto, MedicalKnowledgeSearchResponse } from '../../services/api';
import { ResourcePreviewModal } from '../../components/ResourcePreviewModal';
import { Search, FileText, Filter, ExternalLink, Activity, Layers } from 'lucide-react';

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
    <div className="space-y-6 animate-fadeIn">
      {/* Workspace Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-xs font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Clinical Evidence &amp; Decision Support
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/60 text-xs font-mono">
              UCS3513 System Design Tier
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Medical Knowledge &amp; Clinical Guidelines Workspace
          </h1>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Evidence-based standard operating procedures, acute stroke pathways, and infection control triage routed deterministically across partitioned caching nodes.
          </p>
        </div>

        {response && (
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-300 min-w-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Consistent Hash Node:</span>
              <span className="font-mono text-cyan-300 font-semibold">{response.routed_cache_node}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Cache Tier Status:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                response.cache_hit
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {response.cache_hit ? 'HIT (SUB-MILLISECOND)' : 'MISS (LOCAL POPULATED)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Lookup Duration:</span>
              <span className="text-slate-200">{response.search_latency_ms} ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Clinical Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Filter guidelines by condition, drug, or clinical criteria (e.g., stroke, oseltamivir, triage, IPC)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500"
            >
              {SPECIALTIES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs transition shadow flex items-center gap-1.5 shrink-0"
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
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading verified clinical protocols...</p>
        </div>
      ) : response && response.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {response.items.map((item: MedicalKnowledgeItemDto) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                      {item.source_name || item.domain}
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-800 text-slate-300">
                      {item.specialty.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {item.id.replace('doc-', '')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition">
                  {item.title}
                </h3>

                <p className="text-slate-300 text-xs leading-relaxed line-clamp-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {item.content_snippet}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{item.section_count} Clinical Sections</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedResourceId(item.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition shadow flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Protocol</span>
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No clinical guidelines matched your criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
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
