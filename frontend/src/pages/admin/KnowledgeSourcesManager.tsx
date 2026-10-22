import React, { useEffect, useState } from 'react';
import { api, KnowledgeSourceDto } from '../../services/api';
import { Globe, Plus, Trash2, Play, Shield, Database, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export const KnowledgeSourcesManager: React.FC = () => {
  const [sources, setSources] = useState<KnowledgeSourceDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);

  // New source form state
  const [domain, setDomain] = useState('');
  const [name, setName] = useState('');
  const [seedUrl, setSeedUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Crawl execution state
  const [crawling, setCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<any>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [maxPages, setMaxPages] = useState(10);
  const [maxDepth, setMaxDepth] = useState(2);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.knowledgeSources(),
      api.knowledgeCacheStats()
    ])
      .then(([srcs, st]) => {
        setSources(srcs);
        setStats(st);
      })
      .catch((err) => console.error('Failed to load knowledge source management data', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      await api.addKnowledgeSource({ domain, name, seed_url: seedUrl });
      setFormSuccess(`Knowledge source '${name}' registered successfully under SSRF domain allowlist.`);
      setDomain('');
      setName('');
      setSeedUrl('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register knowledge source. Please check SSRF domain rules.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSource = async (id: string, srcName: string) => {
    if (!window.confirm(`Are you sure you want to remove '${srcName}' and all associated indexed clinical documents?`)) {
      return;
    }

    try {
      await api.deleteKnowledgeSource(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete knowledge source');
    }
  };

  const handleTriggerCrawl = async () => {
    setCrawling(true);
    setCrawlResult(null);
    setCrawlError(null);

    try {
      const res = await api.triggerKnowledgeCrawl({
        seed_urls: sources.map((s) => s.seed_url).filter(Boolean),
        max_depth: maxDepth,
        max_pages: maxPages
      });
      setCrawlResult(res);
      loadData();
    } catch (err: any) {
      setCrawlError(err.message || 'Crawler execution encountered an error.');
    } finally {
      setCrawling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/60 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            SSRF Guard &amp; Consistent Hashing Administration
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Knowledge Sources &amp; Crawler Registry
          </h1>
          <p className="text-slate-400 text-xs max-w-2xl leading-relaxed">
            Manage approved public healthcare domains (who.int, cdc.gov, mohfw.gov.in), execute real bounded network crawling, and monitor ring cache partitions.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Approved Sources</p>
              <p className="text-xl font-bold text-white mt-1">{sources.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Indexed Documents</p>
              <p className="text-xl font-bold text-white mt-1">{stats.crawler?.total_documents || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">Hash Ring Nodes</p>
              <p className="text-xl font-bold text-white mt-1">
                {stats.hashring?.physical_node_count || 0} <span className="text-xs text-slate-500">({stats.hashring?.total_vnodes || 0} vnodes)</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 font-medium">SSRF Threats Blocked</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{stats.crawler?.ssrf_blocked_total || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Sources List & Add / Crawl Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Sources Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="text-cyan-400" />
              <span>Registered Healthcare Sources</span>
            </h2>
            <span className="text-xs text-slate-500">{sources.length} Verified Authorities</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Source &amp; Authority</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Indexed Docs</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div>{s.name}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">{s.seed_url}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-300">{s.domain}</td>
                    <td className="px-4 py-3 font-semibold">{s.documents_count}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteSource(s.id, s.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
                        title="Delete source and remove its documents"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {sources.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No approved sources registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Actions Panel */}
        <div className="space-y-6">
          {/* Register New Source Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="text-cyan-400" />
              <span>Register Approved Source</span>
            </h2>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddSource} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Domain (Allowlist)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. nih.gov, who.int"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Organization / Authority Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Institutes of Health"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Seed Protocol URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={seedUrl}
                  onChange={(e) => setSeedUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition shadow flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{submitting ? 'Validating SSRF...' : 'Register Source'}</span>
              </button>
            </form>
          </div>

          {/* Trigger Bounded Crawl Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Play className="text-emerald-400" />
              <span>Execute Live Bounded Crawl</span>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              Triggers real HTTP network traversal with 3s timeouts, deduplicating through SHA-256 and indexing structured sections.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Pages</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Depth</label>
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={maxDepth}
                  onChange={(e) => setMaxDepth(parseInt(e.target.value) || 2)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>

            <button
              onClick={handleTriggerCrawl}
              disabled={crawling}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition shadow flex items-center justify-center gap-1.5"
            >
              <Play className={`w-3.5 h-3.5 ${crawling ? 'animate-spin' : ''}`} />
              <span>{crawling ? 'Crawling Network...' : 'Start Crawl Job'}</span>
            </button>

            {crawlResult && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs space-y-1.5 text-slate-300">
                <span className="font-bold text-emerald-400 block">Crawl Complete</span>
                <div>Pages Fetched: <strong className="text-white">{crawlResult.pages_crawled}</strong></div>
                <div>Documents Indexed: <strong className="text-white">{crawlResult.documents_indexed}</strong></div>
                <div>Duplicates Prevented: <strong className="text-white">{crawlResult.duplicates_detected}</strong></div>
                <div>SSRF Threats Shielded: <strong className="text-white">{crawlResult.ssrf_blocked_count}</strong></div>
              </div>
            )}

            {crawlError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {crawlError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
