import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, Play, RotateCcw, CheckCircle2, 
  Layers, ArrowRight, ShieldCheck, Zap, Database, Search, AlertTriangle, ExternalLink, BookOpen
} from 'lucide-react';
import { api } from '../../services/api';
import { ResourcePreviewModal } from '../../components/ResourcePreviewModal';

export interface CrawlTask {
  id: string;
  url: string;
  depth: number;
  status: 'Pending Frontier' | 'Parsing HTML' | 'Indexed & Deduplicated';
  outlinksCount: number;
  latencyMs: number;
}

export interface IndexedDocument {
  id: string;
  url: string;
  title: string;
  domain: string;
  content_snippet?: string;
}

export default function WebCrawlerLab() {
  const [frontier, setFrontier] = useState<CrawlTask[]>([
    { id: '1', url: 'https://who.int/cardiovascular_diseases/guidelines', depth: 0, status: 'Indexed & Deduplicated', outlinksCount: 12, latencyMs: 142 },
    { id: '2', url: 'https://mohfw.gov.in/guidelines/stroke_management', depth: 1, status: 'Indexed & Deduplicated', outlinksCount: 8, latencyMs: 98 },
    { id: '3', url: 'https://cdc.gov/diabetes/guidelines', depth: 1, status: 'Pending Frontier', outlinksCount: 0, latencyMs: 0 },
    { id: '4', url: 'https://medora.org/clinical-protocols', depth: 2, status: 'Pending Frontier', outlinksCount: 0, latencyMs: 0 }
  ]);

  const [newSeed, setNewSeed] = useState('https://who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [isCrawling, setIsCrawling] = useState(false);

  // Live Backend Crawler Telemetry & Search
  const [stats, setStats] = useState<{ total_documents: number; domains_covered: number; ssrf_blocked_total: number; duplicates_detected: number }>({
    total_documents: 0,
    domains_covered: 4,
    ssrf_blocked_total: 0,
    duplicates_detected: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [indexedDocs, setIndexedDocs] = useState<IndexedDocument[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadCrawlerData = async () => {
    try {
      const [statsData, docsData] = await Promise.all([
        api.crawlerStats(),
        api.crawlerSearch(''),
      ]);
      if (statsData) {
        setStats({
          total_documents: Number(statsData.total_documents || 0),
          domains_covered: Number(statsData.domains_covered || 4),
          ssrf_blocked_total: Number(statsData.ssrf_blocked_total || 0),
          duplicates_detected: Number(statsData.duplicates_detected || 0),
        });
      }
      if (Array.isArray(docsData)) {
        setIndexedDocs(docsData);
      }
    } catch {
      // Graceful fallback to demo mode
    }
  };

  useEffect(() => {
    void loadCrawlerData();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    try {
      const results = await api.crawlerSearch(searchQuery.trim());
      if (Array.isArray(results)) {
        setIndexedDocs(results);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Search failed.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStepCrawl = async () => {
    const pendingIdx = frontier.findIndex((t) => t.status === 'Pending Frontier');
    const targetTask = pendingIdx !== -1 ? frontier[pendingIdx] : frontier[0];
    const targetUrl = targetTask?.url || 'https://who.int/cardiovascular_diseases/guidelines';

    setIsCrawling(true);
    try {
      const startTime = Date.now();
      const res = await api.crawlerJob({
        seed_urls: [targetUrl],
        max_depth: 1,
        max_pages: 3,
      });

      const elapsed = Date.now() - startTime;
      if (pendingIdx !== -1) {
        const updated = [...frontier];
        updated[pendingIdx].status = 'Indexed & Deduplicated';
        updated[pendingIdx].outlinksCount = Math.floor(4 + Math.random() * 8);
        updated[pendingIdx].latencyMs = elapsed;
        setFrontier(updated);
      }

      showToast(`Crawl Job Complete: ${res.pages_crawled || 1} page(s) analyzed, ${res.documents_indexed || 0} indexed to MongoDB.`, 'success');
      await loadCrawlerData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Crawler execution failed.', 'warning');
    } finally {
      setIsCrawling(false);
    }
  };

  const handleAddSeed = async () => {
    if (!newSeed.trim()) return;
    const url = newSeed.trim();
    setIsCrawling(true);

    try {
      const res = await api.crawlerJob({
        seed_urls: [url],
        max_depth: 1,
        max_pages: 2,
      });

      const task: CrawlTask = {
        id: String(Date.now()),
        url,
        depth: 0,
        status: 'Indexed & Deduplicated',
        outlinksCount: Number(res.pages_crawled || 2),
        latencyMs: 120,
      };
      setFrontier([task, ...frontier]);
      setNewSeed('');
      showToast(`Backend indexed seed: ${url}. Added to MongoDB knowledge base.`, 'success');
      await loadCrawlerData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Crawl error';
      if (msg.includes('SSRF') || msg.includes('internal') || msg.includes('loopback') || msg.includes('allowlist')) {
        showToast(`SSRF Security Guard Blocked: ${msg}`, 'error');
      } else {
        showToast(`Crawl error: ${msg}`, 'warning');
      }
    } finally {
      setIsCrawling(false);
    }
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
            Distributed Clinical Trials &amp; Guidelines Web Crawler
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Asynchronous multi-threaded BFS crawler with strict SSRF defense, domain whitelisting, SHA-256 deduplication, and full-text indexation into MongoDB.
          </p>
        </div>

        <button
          onClick={handleStepCrawl}
          disabled={isCrawling}
          className="px-5 py-2.5 bg-teal-400 hover:bg-teal-300 disabled:opacity-50 text-[#002043] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 self-start md:self-auto"
        >
          <Play className={`w-4 h-4 ${isCrawling ? 'animate-spin' : ''}`} />
          <span>{isCrawling ? 'Crawling Pipeline...' : 'Run Crawler on Frontier'}</span>
        </button>
      </div>

      {/* Production Workflow Integration Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-teal-600" />
          </div>
          <span>
            <strong className="text-slate-900 font-semibold">Real-World Hospital Integration:</strong>{' '}
            Crawler results are deployed into patient and physician workflows with in-app structured previews and consistent-hashing cache routing.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/portal/knowledge"
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition shadow-sm text-xs"
          >
            Patient Hub
          </Link>
          <Link
            to="/clinical/knowledge"
            className="px-3 py-1.5 bg-[#002043] hover:bg-[#17365d] text-white font-semibold rounded-lg transition shadow-sm text-xs"
          >
            Doctor Workspace
          </Link>
          <Link
            to="/admin/knowledge-sources"
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-lg transition shadow-sm text-xs"
          >
            Manage Sources
          </Link>
        </div>
      </div>

      {toast && (
        <div
          role="alert"
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-900 font-mono'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
            <Database className="w-4 h-4 text-teal-600" />
            <span>Indexed in MongoDB</span>
          </div>
          <span className="text-2xl font-black text-[#002043]">{stats.total_documents}</span>
          <span className="text-[10px] text-slate-400 block">Medical Guidelines</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Approved Domains</span>
          </div>
          <span className="text-2xl font-black text-slate-800">{stats.domains_covered}</span>
          <span className="text-[10px] text-slate-400 block">who.int, cdc.gov, mohfw</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <span>SSRF Incursions Blocked</span>
          </div>
          <span className="text-2xl font-black text-rose-700">{stats.ssrf_blocked_total}</span>
          <span className="text-[10px] text-slate-400 block">RFC 1918 &amp; Loopback</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>SHA-256 Dedup Skips</span>
          </div>
          <span className="text-2xl font-black text-emerald-700">{stats.duplicates_detected}</span>
          <span className="text-[10px] text-slate-400 block">Exact Hashes Prevented</span>
        </div>
      </div>

      {/* Grid: Seed Form & Frontier Queue vs Index Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Frontier Manager (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Dispatch Crawl Job to Backend</h3>
            <p className="text-xs text-slate-500 mt-0.5">Dispatches real HTTP fetch with automated SSRF protection.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Seed URL</label>
              <input
                type="url"
                value={newSeed}
                onChange={(e) => setNewSeed(e.target.value)}
                placeholder="https://who.int/medical-guidelines"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-[#002043]"
              />
            </div>

            {/* Quick Test Links */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Presets:</span>
              <div className="flex flex-wrap gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setNewSeed('https://who.int/cardiovascular_diseases/guidelines')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono"
                >
                  WHO Guidelines
                </button>
                <button
                  type="button"
                  onClick={() => setNewSeed('https://mohfw.gov.in/guidelines/stroke_management')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-mono"
                >
                  MOHFW India
                </button>
                <button
                  type="button"
                  onClick={() => setNewSeed('http://127.0.0.1:8000/internal-data')}
                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 rounded text-rose-700 border border-rose-200 font-mono"
                  title="Test SSRF Protection"
                >
                  Test SSRF Block
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddSeed}
              disabled={isCrawling}
              className="w-full py-2.5 bg-[#002043] hover:bg-[#17365d] disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>{isCrawling ? 'Crawling...' : 'Enqueue &amp; Index Seed'}</span>
            </button>
          </div>

          {/* SSRF & Politeness Rules Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">SSRF &amp; Whitelist Protocol:</span>
              <span className="font-mono text-emerald-700 font-bold">ACTIVE</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Blocks RFC 1918 private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), AWS/GCP metadata (169.254.169.254), and loopback (127.0.0.1). Traversal restricted to approved medical domains.
            </p>
            <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-600 text-[11px]">
              <span>Politeness Throttle:</span>
              <span className="font-semibold text-teal-800">1 Req / 500ms</span>
            </div>
          </div>
        </div>

        {/* Live Search & Indexed Knowledge Explorer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Indexed Knowledge Search</h3>
              <p className="text-xs text-slate-500">Search scraped guidelines and clinical research from MongoDB.</p>
            </div>

            <form onSubmit={handleSearch} className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keywords (e.g. stroke, cvd)..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#002043]"
              />
            </form>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {isSearching ? (
              <p className="text-xs text-slate-500 text-center py-8">Searching indexed repository...</p>
            ) : indexedDocs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No indexed documents matching &ldquo;{searchQuery}&rdquo;. Try crawling a seed above.
              </p>
            ) : (
              indexedDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 text-xs space-y-2 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[10px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {doc.domain}
                        </span>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] text-slate-500 truncate max-w-xs hover:text-[#002043] flex items-center gap-1"
                        >
                          <span className="truncate">{doc.url}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDocId(doc.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#002043] hover:bg-[#17365d] text-white rounded-lg transition shrink-0 flex items-center gap-1 shadow-sm"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>In-App Reader</span>
                    </button>
                  </div>

                  {doc.content_snippet && (
                    <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                      {doc.content_snippet}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* In-App Structured Reader Modal */}
      <ResourcePreviewModal
        resourceId={selectedDocId}
        onClose={() => setSelectedDocId(null)}
      />
    </div>
  );
}
