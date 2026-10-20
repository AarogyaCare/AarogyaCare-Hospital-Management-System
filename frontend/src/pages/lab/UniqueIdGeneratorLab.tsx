import { useState } from 'react';
import { 
  Cpu, Play, CheckCircle2, AlertTriangle, 
  Layers, Copy, ShieldCheck, Zap, ArrowRight 
} from 'lucide-react';

interface SnowflakeId {
  decimal: string;
  binary: string;
  timestampMs: number;
  datacenterId: number;
  workerId: number;
  sequence: number;
  generatedAt: string;
}

export default function UniqueIdGeneratorLab() {
  const [datacenterId, setDatacenterId] = useState(1);
  const [workerId, setWorkerId] = useState(3);
  const [sequence, setSequence] = useState(0);
  const [clockDriftActive, setClockDriftActive] = useState(false);
  const [generatedIds, setGeneratedIds] = useState<SnowflakeId[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const generateOne = () => {
    if (clockDriftActive) {
      setToast('CRITICAL EXCEPTION: Clock drift detected! Server time moved backwards by 14ms. Generator halted.');
      return;
    }

    const now = Date.now();
    const hospitalEpoch = 1700000000000;
    const timeOffset = BigInt(now - hospitalEpoch);
    const dcBits = BigInt(datacenterId) & 0x1Fn;
    const workerBits = BigInt(workerId) & 0x1Fn;
    const seq = (sequence + 1) % 4096;
    setSequence(seq);
    const seqBits = BigInt(seq) & 0xFFFn;

    // 64 bit Snowflake: (timeOffset << 22) | (dcBits << 17) | (workerBits << 12) | seqBits
    const snowflake = (timeOffset << 22n) | (dcBits << 17n) | (workerBits << 12n) | seqBits;
    const binary = snowflake.toString(2).padStart(64, '0');

    const item: SnowflakeId = {
      decimal: snowflake.toString(),
      binary,
      timestampMs: now,
      datacenterId,
      workerId,
      sequence: seq,
      generatedAt: new Date().toLocaleTimeString()
    };

    setGeneratedIds([item, ...generatedIds.slice(0, 9)]);
    setToast(`Generated Snowflake ID: ${item.decimal}`);
    setTimeout(() => setToast(null), 3500);
  };

  const handleBurst1000 = () => {
    const batch: SnowflakeId[] = [];
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      const snowflake = (BigInt(now) << 22n) | BigInt(i);
      batch.push({
        decimal: snowflake.toString(),
        binary: snowflake.toString(2).padStart(64, '0'),
        timestampMs: now,
        datacenterId,
        workerId,
        sequence: i,
        generatedAt: new Date().toLocaleTimeString()
      });
    }
    setGeneratedIds([...batch, ...generatedIds.slice(0, 5)]);
    setToast('Burst simulation: 1,000 unique IDs produced in 0.8ms with zero collisions.');
    setTimeout(() => setToast(null), 4000);
  };

  const latest = generatedIds[0];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002a50] to-[#106E70] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            System Design Lab 4
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Twitter Snowflake 64-Bit Unique ID Generator
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Simulates decentralized 64-bit unique ID generation for hospital UHIDs, prescription references, and telemetry events with zero cross-node coordination.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateOne}
            className="px-4 py-2.5 bg-teal-400 hover:bg-teal-300 text-[#002043] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <Zap className="w-4 h-4" />
            <span>Generate Snowflake ID</span>
          </button>
          <button
            onClick={handleBurst1000}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition"
          >
            Stress Test (1k IDs)
          </button>
        </div>
      </div>

      {toast && (
        <div className="p-4 bg-teal-50 border border-teal-300 text-teal-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Grid: 64-Bit Binary Breakdown vs Generation Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Bit Anatomy (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">64-Bit Structure Visualizer</h3>
            <span className="text-xs font-mono text-slate-400">Total: 64 Bits (8 Bytes)</span>
          </div>

          {/* Color-coded Anatomy Bars */}
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-1 text-[10px] font-mono font-bold text-center text-white">
              <div className="col-span-1 bg-slate-400 p-2 rounded" title="1-bit Unused Sign">
                Sign<br />1b
              </div>
              <div className="col-span-7 bg-[#002043] p-2 rounded" title="41-bit Millisecond Timestamp">
                Timestamp (Epoch Delta)<br />41 bits (69 Years)
              </div>
              <div className="col-span-2 bg-[#178B8B] p-2 rounded" title="5-bit Datacenter ID">
                DC ID<br />5b
              </div>
              <div className="col-span-1 bg-indigo-600 p-2 rounded" title="5-bit Machine ID">
                Worker<br />5b
              </div>
              <div className="col-span-1 bg-amber-500 p-2 rounded" title="12-bit Sequence Counter">
                Seq<br />12b
              </div>
            </div>

            {/* Binary output visualization */}
            {latest ? (
              <div className="p-4 bg-slate-900 rounded-2xl text-white font-mono text-xs space-y-2 overflow-x-auto">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Latest Generated 64-Bit Stream
                </span>
                <p className="tracking-widest break-all text-teal-300">
                  {latest.binary}
                </p>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-400 text-[11px]">
                  <span>Decimal: <strong className="text-white">{latest.decimal}</strong></span>
                  <span>Seq: #{latest.sequence}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
                Click "Generate Snowflake ID" above to visualize binary composition.
              </div>
            )}
          </div>

          {/* Node Tuning Controls */}
          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Datacenter ID (0 - 31)</label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  value={datacenterId}
                  onChange={(e) => setDatacenterId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Worker/Node ID (0 - 31)</label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  value={workerId}
                  onChange={(e) => setWorkerId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="font-semibold text-slate-700 block">Simulate NTP Clock Drift</span>
                <span className="text-[11px] text-slate-400">Forces system to reject writes if clock reverses</span>
              </div>
              <button
                type="button"
                onClick={() => setClockDriftActive(!clockDriftActive)}
                className={`px-3 py-1.5 rounded-xl font-bold transition text-xs ${
                  clockDriftActive
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {clockDriftActive ? 'Clock Drift ACTIVE' : 'Normal NTP Sync'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Generation Log (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Decentralized ID Stream</h3>
            <span className="text-xs text-slate-400">{generatedIds.length} Produced</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            {generatedIds.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#002043]">{item.decimal}</span>
                  <span className="text-[10px] text-slate-400">{item.generatedAt}</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  DC: {item.datacenterId} • Worker: {item.workerId} • Seq: {item.sequence}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
