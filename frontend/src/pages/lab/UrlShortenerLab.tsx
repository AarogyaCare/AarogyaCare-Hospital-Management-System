import { useState } from 'react';
import { api } from '../../services/api';
import { 
  Link2, CheckCircle2, Copy, BarChart2, 
  ExternalLink, ArrowRight, ShieldCheck, Zap 
} from 'lucide-react';

interface ShortenedLink {
  id: number;
  shortCode: string;
  longUrl: string;
  clicks: number;
  createdDate: string;
  redirectType: '301 Permanent' | '302 Temporary';
}

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function encodeBase62(num: number): string {
  let s = '';
  while (num > 0) {
    s = BASE62_CHARS[num % 62] + s;
    num = Math.floor(num / 62);
  }
  return s || '0';
}

export default function UrlShortenerLab() {
  const [links, setLinks] = useState<ShortenedLink[]>([
    {
      id: 1049281,
      shortCode: '4k7L',
      longUrl: 'https://aarogya.care/portal/medical-records?uhid=AAR-2026-9041&auth_token=8f9a2b',
      clicks: 42,
      createdDate: '16 Oct 2026',
      redirectType: '302 Temporary'
    },
    {
      id: 1049282,
      shortCode: '4k7M',
      longUrl: 'https://aarogya.care/doctors/doc-1?source=sms_reminder_grems_road',
      clicks: 119,
      createdDate: '17 Oct 2026',
      redirectType: '302 Temporary'
    }
  ]);

  const [inputUrl, setInputUrl] = useState('https://aarogya.care/portal/billing?invoice=INV-AAR-2026-10492');
  const [redirectType, setRedirectType] = useState<'301 Permanent' | '302 Temporary'>('302 Temporary');
  const [toast, setToast] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!inputUrl.trim()) return;
    try {
      const created = await api.createShortLink({ target_url: inputUrl, resource_type: 'GENERAL', resource_id: '', ttl_seconds: 86400 });
      const newLink: ShortenedLink = { id: Date.now(), shortCode: created.code, longUrl: inputUrl, clicks: Number(created.click_count || 0), createdDate: 'Just Now', redirectType };
      setLinks([newLink, ...links]);
      setToast(`Backend short link created: ${created.short_url || `${window.location.origin}/s/${created.code}`}`);
    } catch (error) { setToast(`Backend short-link creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`); }
    setTimeout(() => setToast(null), 4000);
  };

  const handleSimulateClick = async (shortCode: string) => {
    try {
      const data = await api.resolveShortLink(shortCode);
      setLinks((prev) => prev.map((l) => l.shortCode === shortCode ? { ...l, clicks: Number(data.click_count || l.clicks) } : l));
      setToast(`Backend resolved short link ${shortCode}.`);
    } catch (error) { setToast(`Short-link lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`); }
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#106E70] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            System Design Lab 5
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Base62 High-Throughput URL Shortener
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Simulates bijective Base62 encoding, auto-increment tokenization, 301 vs 302 redirect strategies, and click analytics telemetry.
          </p>
        </div>

        <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-xs">
          <span className="text-slate-300 block text-[10px]">Total Key Space:</span>
          <span className="text-base font-extrabold text-white">62^7 = 3.5 Trillion URLs</span>
        </div>
      </div>

      {toast && (
        <div className="p-4 bg-teal-50 border border-teal-300 text-teal-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Grid: Shortener Form vs Click Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Generator Form (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900">Shorten Clinical Deep Link</h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Destination Long URL</label>
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-[#002043]"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Redirect Response Header</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRedirectType('302 Temporary')}
                  className={`py-2 px-3 rounded-xl font-bold border transition ${
                    redirectType === '302 Temporary'
                      ? 'bg-[#002043] text-white border-[#002043]'
                      : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  302 Found (Analytics)
                </button>

                <button
                  type="button"
                  onClick={() => setRedirectType('301 Permanent')}
                  className={`py-2 px-3 rounded-xl font-bold border transition ${
                    redirectType === '301 Permanent'
                      ? 'bg-[#002043] text-white border-[#002043]'
                      : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  301 Moved (Fast Cache)
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                302 routes every hop through Aarogya API gateway to log click demographics.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreate}
              className="w-full py-3 bg-[#002043] hover:bg-[#17365d] text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              <span>Encode via Base62 Engine</span>
            </button>
          </div>
        </div>

        {/* Shortened Links & Clicks (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Active Short URLs & Telemetry</h3>
            <span className="text-xs text-slate-400">{links.length} Active Codes</span>
          </div>

          <div className="space-y-3">
            {links.map((link) => (
              <div
                key={link.id}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#002043] text-sm">
                    https://aarogya.care/r/{link.shortCode}
                  </span>
                  <span className="font-mono text-teal-700 font-bold bg-white px-2 py-0.5 rounded border border-teal-200">
                    {link.clicks} Clicks
                  </span>
                </div>

                <p className="text-slate-500 font-mono text-[11px] truncate">{link.longUrl}</p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                  <span className="text-slate-400 text-[10px]">ID: #{link.id} • {link.redirectType}</span>
                  <button
                    onClick={() => handleSimulateClick(link.shortCode)}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-[11px] transition"
                  >
                    Simulate Click
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
