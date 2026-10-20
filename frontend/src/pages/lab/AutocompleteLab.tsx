import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Search, CheckCircle2, Database, Zap, 
  ArrowRight, ShieldCheck, Layers, Sparkles 
} from 'lucide-react';

interface TrieTerm {
  term: string;
  category: 'Medication' | 'Diagnosis' | 'Specialty' | 'Symptom';
  frequency: number;
}

const mockTrieDictionary: TrieTerm[] = [
  { term: 'Atorvastatin 20mg', category: 'Medication', frequency: 1840 },
  { term: 'Acorvas (Atorvastatin)', category: 'Medication', frequency: 1220 },
  { term: 'Acute Myocardial Infarction', category: 'Diagnosis', frequency: 950 },
  { term: 'Acute Ischemic Stroke', category: 'Diagnosis', frequency: 890 },
  { term: 'Cardiology & Cardiac Surgery', category: 'Specialty', frequency: 2400 },
  { term: 'Cardiac Arrhythmia', category: 'Diagnosis', frequency: 1100 },
  { term: 'Chest pain radiating to left arm', category: 'Symptom', frequency: 1750 },
  { term: 'Clopidogrel 75mg', category: 'Medication', frequency: 1600 },
  { term: 'Neurology & Neurosurgery', category: 'Specialty', frequency: 1950 },
  { term: 'Nephrology & Renal Transplant', category: 'Specialty', frequency: 1400 },
  { term: 'Metformin 500mg', category: 'Medication', frequency: 2100 },
  { term: 'Migraine with visual aura', category: 'Symptom', frequency: 920 },
  { term: 'Orthopedics & Joint Replacement', category: 'Specialty', frequency: 1800 },
  { term: 'Osteoarthritis of knee', category: 'Diagnosis', frequency: 1540 },
  { term: 'Pediatrics & Neonatal Care', category: 'Specialty', frequency: 1350 },
  { term: 'Paracetamol 650mg (Dolo)', category: 'Medication', frequency: 3200 },
];

export default function AutocompleteLab() {
  const [query, setQuery] = useState('at');
  const [topKLimit, setTopKLimit] = useState(5);
  const [backendSuggestions, setBackendSuggestions] = useState<TrieTerm[] | null>(null);
  useEffect(() => {
    if (!query.trim()) { setBackendSuggestions([]); return; }
    const timer = setTimeout(() => { api.autocomplete(query, topKLimit).then((data: any) => setBackendSuggestions((data.suggestions || data.results || []).map((v: any) => ({ term: typeof v === 'string' ? v : v.term || v.text || v.value || v.name, category: v.category || 'Diagnosis', frequency: Number(v.frequency || 0) })))).catch(() => setBackendSuggestions(null)); }, 180);
    return () => clearTimeout(timer);
  }, [query, topKLimit]);

  const matchedSuggestions = query.trim()
    ? mockTrieDictionary
        .filter((item) => item.term.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, topKLimit)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#106E70] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            System Design Lab 7
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Trie-Based Prefix Autocomplete System
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Simulates pre-computed Trie prefix trees with frequency-weighted Top-K results and sub-5ms lookup latency across medical terms.
          </p>
        </div>

        <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-xs">
          <span className="text-slate-300 block text-[10px]">Trie Dictionary Nodes:</span>
          <span className="text-base font-extrabold text-white">48,000 Medical Entities</span>
        </div>
      </div>

      {/* Grid: Search Input & Live Results vs Trie Tree Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Search & Suggestions (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Interactive Query Search</h3>
            <span className="text-xs text-slate-400">Prefix Match</span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type medical term (e.g. at, card, para, metf)..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#002043]"
            />
          </div>

          {/* Top-K Limit toggle */}
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Top-K Heap Output Size:</span>
            <div className="flex gap-1.5">
              {[3, 5, 8].map((k) => (
                <button
                  key={k}
                  onClick={() => setTopKLimit(k)}
                  className={`px-3 py-1 rounded-lg font-bold border transition ${
                    topKLimit === k
                      ? 'bg-[#002043] text-white border-[#002043]'
                      : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  {k} items
                </button>
              ))}
            </div>
          </div>

          {/* Suggestions Dropdown simulation */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Trie Top-K Results ({matchedSuggestions.length})
            </span>

            {matchedSuggestions.length === 0 ? (
              <div className="p-8 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
                No matching prefix found. Try "at", "card", "ortho", or "para".
              </div>
            ) : (
              matchedSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 hover:bg-teal-50/60 rounded-xl border border-slate-200 flex items-center justify-between text-xs transition cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{item.term}</span>
                    <span className="text-[10px] text-teal-700 font-semibold">{item.category}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    Freq: {item.frequency.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trie Node Hierarchy Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Trie Node Traversal Path</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Step-by-step character branch matching in pre-compiled memory tree:
            </p>
          </div>

          {/* Visual Trie Path */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-[#002043] text-white font-mono text-xs font-bold shadow-xs">
                Root
              </span>
              {query.split('').map((char, i) => (
                <div key={i} className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-mono text-xs font-bold shadow-xs">
                    '{char.toLowerCase()}'
                  </span>
                </div>
              ))}
              {query && (
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-mono text-xs font-bold shadow-xs">
                    [Top-K Leaves]
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="flex justify-between">
                <span>Traversal Time Complexity:</span>
                <span className="font-mono font-bold text-slate-900">O(L) = O({query.length || 1})</span>
              </div>
              <div className="flex justify-between">
                <span>Top-K Retrieval:</span>
                <span className="font-mono font-bold text-teal-700">O(1) (Pre-computed min-heap per node)</span>
              </div>
              <div className="flex justify-between">
                <span>Memory Overhead:</span>
                <span className="font-mono font-bold text-slate-900">~24 MB RAM for 48,000 terms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
