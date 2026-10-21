import { useState, useEffect } from 'react';
import { 
  Cpu, Play, RotateCcw, AlertTriangle, CheckCircle2, 
  ShieldCheck, Zap, ArrowRight, Gauge, Layers 
} from 'lucide-react';

export default function RateLimiterLab() {
  const [algorithm, setAlgorithm] = useState<'token-bucket' | 'sliding-window'>('token-bucket');
  const [capacity, setCapacity] = useState(10);
  const [refillRate, setRefillRate] = useState(2); // tokens per second
  const [tokens, setTokens] = useState(10);
  const [requestLog, setRequestLog] = useState<{ id: number; timestamp: string; status: 200 | 429 }[]>([]);
  const [isSpamming, setIsSpamming] = useState(false);

  // Token bucket refill ticker
  useEffect(() => {
    if (algorithm !== 'token-bucket') return;
    const interval = setInterval(() => {
      setTokens((prev) => Math.min(capacity, prev + refillRate));
    }, 1000);
    return () => clearInterval(interval);
  }, [algorithm, capacity, refillRate]);

  // Request spammer ticker
  useEffect(() => {
    if (!isSpamming) return;
    const interval = setInterval(() => {
      handleSendRequest();
    }, 250);
    return () => clearInterval(interval);
  }, [isSpamming, tokens]);

  const handleSendRequest = () => {
    const time = new Date().toLocaleTimeString();
    if (tokens >= 1) {
      setTokens((t) => t - 1);
      setRequestLog((prev) => [{ id: Date.now() + Math.random(), timestamp: time, status: 200 }, ...prev.slice(0, 19)]);
    } else {
      setRequestLog((prev) => [{ id: Date.now() + Math.random(), timestamp: time, status: 429 }, ...prev.slice(0, 19)]);
    }
  };

  const resetBucket = () => {
    setTokens(capacity);
    setRequestLog([]);
    setIsSpamming(false);
  };

  const totalRequests = requestLog.length;
  const accepted = requestLog.filter((r) => r.status === 200).length;
  const rejected = requestLog.filter((r) => r.status === 429).length;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002a50] to-[#106E70] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            System Design Lab 1
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            API Gateway Rate Limiter Simulator
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Simulates distributed API rate limiting algorithms protecting Medora clinical endpoints against denial of service and traffic spikes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSpamming(!isSpamming)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg ${
              isSpamming
                ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                : 'bg-teal-400 hover:bg-teal-300 text-[#002043]'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>{isSpamming ? 'Stop Traffic Spammer' : 'Spam Requests (4 req/sec)'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Controls & Visualizer vs Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Controls & Bucket Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Algorithm Configuration</h3>
            <button
              onClick={resetBucket}
              className="text-xs font-semibold text-slate-500 hover:text-[#002043] flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset State</span>
            </button>
          </div>

          {/* Algorithm Tabs */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={() => setAlgorithm('token-bucket')}
              className={`py-2.5 rounded-xl border transition ${
                algorithm === 'token-bucket' ? 'bg-[#002043] text-white border-[#002043]' : 'bg-slate-50 text-slate-700'
              }`}
            >
              Token Bucket Algorithm
            </button>
            <button
              type="button"
              onClick={() => setAlgorithm('sliding-window')}
              className={`py-2.5 rounded-xl border transition ${
                algorithm === 'sliding-window' ? 'bg-[#002043] text-white border-[#002043]' : 'bg-slate-50 text-slate-700'
              }`}
            >
              Sliding Window Counter
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Bucket Capacity (Max Burst Tokens):</span>
                <span className="font-bold text-[#002043]">{capacity} Tokens</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                value={capacity}
                onChange={(e) => {
                  setCapacity(Number(e.target.value));
                  setTokens(Number(e.target.value));
                }}
                className="w-full accent-[#002043]"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Refill Rate (Tokens added per second):</span>
                <span className="font-bold text-teal-700">+{refillRate} Tokens / sec</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={refillRate}
                onChange={(e) => setRefillRate(Number(e.target.value))}
                className="w-full accent-[#178B8B]"
              />
            </div>
          </div>

          {/* Visual Bucket */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Token Vault Tank</span>
              <span className="font-mono text-sm text-[#002043]">{tokens} / {capacity} Available</span>
            </div>

            {/* Visual Token Pills */}
            <div className="min-h-16 p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap gap-1.5 items-center justify-center">
              {Array.from({ length: tokens }).map((_, idx) => (
                <span
                  key={idx}
                  className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#178B8B] to-teal-400 text-white font-mono text-[10px] font-bold flex items-center justify-center shadow-xs animate-scaleIn"
                >
                  ⚡
                </span>
              ))}
              {tokens === 0 && (
                <span className="text-xs text-rose-500 font-bold animate-pulse">
                  Bucket Empty! All incoming requests will be rejected (429 Too Many Requests).
                </span>
              )}
            </div>

            <button
              onClick={handleSendRequest}
              className="w-full py-3 bg-[#002043] hover:bg-[#17365d] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-teal-300" />
              <span>Simulate Single Client API Request (Cost: 1 Token)</span>
            </button>
          </div>
        </div>

        {/* Live Traffic Inspector & 429 Throttle Log (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Gateway Traffic Inspector</h3>
            <span className="text-xs text-slate-400">{totalRequests} Total Requests</span>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-center">
              <span className="block text-[10px] uppercase font-bold text-emerald-600">200 OK Passed</span>
              <span className="text-2xl font-black">{accepted}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-center">
              <span className="block text-[10px] uppercase font-bold text-rose-600">429 Rate Limited</span>
              <span className="text-2xl font-black">{rejected}</span>
            </div>
          </div>

          {/* Request stream list */}
          <div className="space-y-1.5 max-h-[340px] overflow-y-auto">
            {requestLog.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                Send requests or trigger the traffic spammer to inspect live responses.
              </p>
            ) : (
              requestLog.map((req) => (
                <div
                  key={req.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-mono ${
                    req.status === 200
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/70 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {req.status === 200 ? 'HTTP 200 OK' : 'HTTP 429 Too Many Requests'}
                    </span>
                    <span className="text-[10px] text-slate-500">/api/v1/appointments</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{req.timestamp}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
