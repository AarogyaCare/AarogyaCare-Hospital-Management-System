import { useState } from 'react';
import { 
  Globe, Play, RotateCcw, CheckCircle2, 
  Layers, ArrowRight, ShieldCheck, Zap, Database 
} from 'lucide-react';

interface CrawlTask {
  id: string;
  url: string;
  depth: number;
  status: 'Pending Frontier' | 'Parsing HTML' | 'Indexed & Deduplicated';
  outlinksCount: number;
  latencyMs: number;
}

export default function WebCrawlerLab() {
  const [frontier, setFrontier] = useState<CrawlTask[]>([
    { id: '1', url: 'https://clinicaltrials.gov/ct2/show/NCT04882190', depth: 0, status: 'Indexed & Deduplicated', outlinksCount: 14, latencyMs: 142 },
    { id: '2', url: 'https://pubmed.ncbi.nlm.nih.gov/33829104', depth: 1, status: 'Indexed & Deduplicated', outlinksCount: 8, latencyMs: 98 },
    { id: '3', url: 'https://who.int/cardiovascular_diseases/guidelines', depth: 1, status: 'Pending Frontier', outlinksCount: 0, latencyMs: 0 },
    { id: '4', url: 'https://icmr.gov.in/guidelines/stroke_management', depth: 2, status: 'Pending Frontier', outlinksCount: 0, latencyMs: 0 }
  ]);

  const [bloomFilterKeys, setBloomFilterKeys] = useState(4);
  const [isCrawling, setIsCrawling] = useState(false);
  const [newSeed, setNewSeed] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const handleStepCrawl = () => {
    const pendingIdx = frontier.findIndex((t) => t.status === 'Pending Frontier');
    if (pendingIdx === -1) {
      setToast('Frontier Queue Exhausted: All discovered medical links crawled.');
      return;
    }
    const updated = [...frontier];
    updated[pendingIdx].status = 'Indexed & Deduplicated';
    updated[pendingIdx].outlinksCount = Math.floor(4 + Math.random() * 12);
    updated[pendingIdx].latencyMs = Math.floor(60 + Math.random() * 120);
    setFrontier(updated);
    setBloomFilterKeys((k) => k + 1);
    setToast(`Crawled ${updated[pendingIdx].url}: Parsed ${updated[pendingIdx].outlinksCount} outlinks. Bloom filter updated.`);
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddSeed = () => {
    if (!newSeed.trim()) return;
    const task: CrawlTask = {
      id: String(Date.now()),
      url: newSeed,
      depth: 0,
      status: 'Pending Frontier',
      outlinksCount: 0,
      latencyMs: 0
    };
    setFrontier([task, ...frontier]);
    setNewSeed('');
    setToast(`Appended seed URL to Priority Queue Frontier.`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#106E70] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            System Design Lab 6
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Distributed Clinical Trials Web Crawler
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Simulates multi-threaded URL frontier scheduling, Bloom filter duplicate elimination, politeness throttles, and HTML link extraction.
          </p>
        </div>

        <button
          onClick={handleStepCrawl}
          className="px-5 py-2.5 bg-teal-400 hover:bg-teal-300 text-[#002043] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 self-start md:self-auto"
        >
          <Play className="w-4 h-4" />
          <span>Crawl Next Frontier URL</span>
        </button>
      </div>

      {toast && (
        <div className="p-4 bg-teal-50 border border-teal-300 text-teal-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Grid: Seed Form & Frontier Queue vs Index Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Frontier Manager (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900">Add Seed URL to Frontier</h3>

          <div className="space-y-3 text-xs">
            <input
              type="url"
              value={newSeed}
              onChange={(e) => setNewSeed(e.target.value)}
              placeholder="https://who.int/medical-guidelines"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
            <button
              type="button"
              onClick={handleAddSeed}
              className="w-full py-2.5 bg-[#002043] hover:bg-[#17365d] text-white rounded-xl font-bold transition"
            >
              Enqueue Seed
            </button>
          </div>

          {/* Bloom Filter & Politeness Status */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Bloom Filter Hash Table:</span>
              <span className="font-mono text-teal-700 font-bold">{bloomFilterKeys} Hashes Active</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Zero false negatives; prevents circular loops across cross-referenced medical journals.
            </p>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-600">
              <span>Domain Politeness:</span>
              <span className="font-semibold text-emerald-700">1 Req / 500ms</span>
            </div>
          </div>
        </div>

        {/* Frontier Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">URL Frontier Priority Queue</h3>
            <span className="text-xs text-slate-400">{frontier.length} Discovered URLs</span>
          </div>

          <div className="space-y-3">
            {frontier.map((task) => (
              <div
                key={task.id}
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#002043] truncate max-w-sm">
                    {task.url}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    task.status === 'Indexed & Deduplicated'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {task.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Depth: Level {task.depth}</span>
                  <span>Extracted Outlinks: {task.outlinksCount}</span>
                  <span>Fetch Latency: {task.latencyMs > 0 ? `${task.latencyMs} ms` : 'Pending'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
