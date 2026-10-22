import React, { useEffect, useState } from 'react';
import { api, MedicalKnowledgeItemDto, MedicalKnowledgeSearchResponse } from '../../services/api';
import { ResourcePreviewModal } from '../../components/ResourcePreviewModal';
import { Search, BookOpen, Shield, ExternalLink, Clock, Cpu, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  { key: 'ALL', label: 'All Knowledge' },
  { key: 'PREVENTION', label: 'Prevention & Wellness' },
  { key: 'SYMPTOMS', label: 'Symptoms & Warning Signs' },
  { key: 'CLINICAL_PROTOCOL', label: 'Clinical Protocols' },
  { key: 'PUBLIC_HEALTH', label: 'Public Health Advisories' }
];

export const HealthKnowledgeSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [response, setResponse] = useState<MedicalKnowledgeSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);

  const fetchKnowledge = (q = query, cat = selectedCategory) => {
    setLoading(true);
    api.searchKnowledge(q, cat, 'ALL')
      .then((res) => setResponse(res))
      .catch((err) => console.error('Knowledge search failed', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchKnowledge();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKnowledge();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-cyan-800/40 p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              Verified Public Health Knowledge
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Patient Health &amp; Wellness Knowledge Hub
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl">
              Search verified medical guidelines, fever warnings, and preventive care instructions indexed directly from the WHO, CDC, and Ministry of Health.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5 max-w-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="font-semibold block text-amber-200">Emergency Warning</strong>
              Experiencing severe chest pain, shortness of breath, or sudden weakness? Please dial emergency services or visit the nearest emergency room immediately.
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by symptom, disease, or health topic (e.g., flu, dengue, fever, respiratory, blood pressure)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition text-sm shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-cyan-900/30 flex items-center gap-2"
          >
            <span>Search</span>
          </button>
        </form>

        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 mr-1">Categories:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                selectedCategory === cat.key
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Telemetry Strip: Real Consistent Hashing Metadata */}
      {response && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Found <strong className="text-white">{response.total_results}</strong> verified medical resources
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Cpu className="text-cyan-400 w-3.5 h-3.5" />
              Routed Node: <strong className="text-cyan-300">{response.routed_cache_node}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                response.cache_hit
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}
            >
              {response.cache_hit ? 'CACHE HIT' : 'CACHE MISS (POPULATED)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Search Latency: <strong className="text-slate-200">{response.search_latency_ms} ms</strong></span>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Searching medical knowledge repository...</p>
        </div>
      ) : response && response.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {response.items.map((item: MedicalKnowledgeItemDto) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition group hover:shadow-cyan-950/20"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    {item.source_name || item.domain}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-800 text-slate-400">
                    {item.category.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-800 text-slate-400">
                    {item.specialty.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                  {item.content_snippet}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  {item.section_count > 0 ? `${item.section_count} Clinical Sections` : 'Summary View'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedResourceId(item.id)}
                    className="px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition shadow flex items-center gap-1.5"
                  >
                    <span>Read In-App</span>
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    title="Open original authoritative source"
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
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No medical knowledge results found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your search keywords or switching category filters to "All Knowledge".
          </p>
          <button
            onClick={() => {
              setQuery('');
              setSelectedCategory('ALL');
              fetchKnowledge('', 'ALL');
            }}
            className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
          >
            Reset Filters
          </button>
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
