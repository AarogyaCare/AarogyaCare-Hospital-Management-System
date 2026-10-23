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
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              Verified Public Health Knowledge
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Patient Health &amp; Wellness Knowledge Hub
            </h1>
            <p className="text-slate-500 text-xs md:text-sm max-w-2xl leading-relaxed">
              Search verified medical guidelines, fever warnings, and preventive care instructions indexed directly from the WHO, CDC, and Ministry of Health.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 max-w-xs shrink-0 shadow-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <strong className="font-semibold block text-amber-900">Emergency Warning</strong>
              Experiencing severe chest pain, shortness of breath, or sudden weakness? Please dial emergency services or visit the nearest emergency room immediately.
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by symptom, disease, or health topic (e.g., flu, dengue, fever, respiratory, blood pressure)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 focus:bg-white transition text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition shadow-sm flex items-center gap-2"
          >
            <span>Search</span>
          </button>
        </form>

        {/* Category Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1">Categories:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition border ${
                selectedCategory === cat.key
                  ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Telemetry Strip: Real Consistent Hashing Metadata */}
      {response && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Found <strong className="text-slate-900 font-bold">{response.total_results}</strong> verified medical resources
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Cpu className="text-teal-600 w-3.5 h-3.5" />
              Routed Node: <strong className="text-teal-700 font-bold">{response.routed_cache_node}</strong>
            </span>
            <span className="text-slate-300">•</span>
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
                ? `CACHE HIT (${response.cache_tier || 'REDIS'})`
                : `CACHE MISS (${response.cache_tier || 'REDIS'} POPULATED)`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Search Latency: <strong className="text-slate-800 font-semibold">{response.search_latency_ms} ms</strong></span>
          </div>
        </div>
      )}

      {/* Results Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Searching medical knowledge repository...</p>
        </div>
      ) : response && response.items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {response.items.map((item: MedicalKnowledgeItemDto) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 hover:border-teal-400/60 rounded-2xl p-5 shadow-sm hover:shadow-md flex flex-col justify-between transition group"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {item.source_name || item.domain}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {item.category.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {item.specialty.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition line-clamp-2">
                  {item.title}
                </h3>

                <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {item.content_snippet}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                  {item.section_count > 0 ? `${item.section_count} Clinical Sections` : 'Summary View'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedResourceId(item.id)}
                    className="px-3 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition shadow-sm flex items-center gap-1.5"
                  >
                    <span>Read In-App</span>
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
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
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No medical knowledge results found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search keywords or switching category filters to "All Knowledge".
          </p>
          <button
            onClick={() => {
              setQuery('');
              setSelectedCategory('ALL');
              fetchKnowledge('', 'ALL');
            }}
            className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
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
