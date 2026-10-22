import React, { useEffect, useState } from 'react';
import { api, ResourcePreviewDto } from '../services/api';
import { X, ExternalLink, AlertTriangle, BookOpen, Calendar, Globe, CheckCircle2, Copy, Check } from 'lucide-react';

interface ResourcePreviewModalProps {
  resourceId: string | null;
  onClose: () => void;
}

export const ResourcePreviewModal: React.FC<ResourcePreviewModalProps> = ({ resourceId, onClose }) => {
  const [data, setData] = useState<ResourcePreviewDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!resourceId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    api.knowledgeResource(resourceId)
      .then((res) => setData(res))
      .catch((err) => {
        console.error('Failed to load resource preview', err);
        setError(err.message || 'Unable to load clinical resource preview');
      })
      .finally(() => setLoading(false));
  }, [resourceId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!resourceId) return null;

  const handleCopyCitation = () => {
    if (!data) return;
    const citation = `${data.title}. ${data.source_name || data.domain} (${data.published_date || '2024'}). Available at: ${data.url}`;
    navigator.clipboard.writeText(citation).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">
                In-Application Resource Reader
              </span>
              <p className="text-xs text-slate-400">Structured Medical Protocol &amp; Guideline View</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCitation}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition flex items-center gap-1.5"
              title="Copy clinical citation"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Cite'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Retrieving structured clinical document...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Document Header */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {data.source_name || data.domain}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-800/50">
                    {data.category.replace(/_/g, ' ')}
                  </span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/50">
                    {data.specialty.replace(/_/g, ' ')}
                  </span>
                  {data.published_date && (
                    <span className="px-2.5 py-1 text-xs rounded-full bg-slate-800 text-slate-400 flex items-center gap-1 border border-slate-700">
                      <Calendar className="w-3 h-3" />
                      Updated: {data.published_date}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-white leading-snug">
                  {data.title}
                </h1>

                {data.content_snippet && (
                  <p className="text-slate-300 text-sm leading-relaxed bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60 italic">
                    "{data.content_snippet}"
                  </p>
                )}
              </div>

              {/* Medical Disclaimer Banner */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-600/30 flex items-start gap-3 text-amber-200/90 text-xs leading-relaxed">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-amber-300 block mb-0.5">Authoritative Medical Disclaimer</strong>
                  {data.disclaimer}
                </div>
              </div>

              {/* Structured Sections */}
              <div className="space-y-5">
                <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
                  Verified Clinical Sections &amp; Key Recommendations
                </h2>

                <div className="space-y-4">
                  {data.sections && data.sections.length > 0 ? (
                    data.sections.map((section, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition space-y-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center border border-cyan-500/30">
                            {idx + 1}
                          </span>
                          <h3 className="text-base font-semibold text-slate-100">
                            {section.heading}
                          </h3>
                        </div>

                        {section.content && (
                          <p className="text-sm text-slate-300 leading-relaxed pl-8">
                            {section.content}
                          </p>
                        )}

                        {section.bullet_points && section.bullet_points.length > 0 && (
                          <ul className="pl-8 space-y-2 mt-2">
                            {section.bullet_points.map((pt, pIdx) => (
                              <li key={pIdx} className="text-xs text-slate-300 flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-800/40 text-slate-400 text-sm">
                      {data.full_text || 'Full document text available at source.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Outbound Source Verification & Safe Links */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Authoritative Origin Verification
                  </span>
                  <a
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 rounded-lg transition"
                  >
                    <span>Open External Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-400 truncate font-mono">
                  Origin URL: <span className="text-cyan-300">{data.url}</span>
                </div>

                {data.safe_outlinks && data.safe_outlinks.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs text-slate-500 font-medium">Verified Reference Links:</span>
                    <div className="flex flex-wrap gap-2">
                      {data.safe_outlinks.slice(0, 5).map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 text-[11px] rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition max-w-xs truncate"
                        >
                          <span className="truncate">{link.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <span>Safe In-App Content Extraction • No Iframe Embedding Required</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 transition"
          >
            Close Reader
          </button>
        </div>
      </div>
    </div>
  );
};
