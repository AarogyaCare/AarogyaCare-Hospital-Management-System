import { useState } from 'react';
import { 
  Database, HardDrive, CheckCircle2, RefreshCw, 
  Layers, Plus, Trash2, ArrowRight, Zap, ShieldCheck 
} from 'lucide-react';

interface MemTableEntry {
  key: string;
  value: string;
  timestamp: string;
}

interface SSTableFile {
  id: string;
  entriesCount: number;
  minKey: string;
  maxKey: string;
  fileSize: string;
}

export default function KeyValueStoreLab() {
  const [memTable, setMemTable] = useState<MemTableEntry[]>([
    { key: 'patient:AAR-9041', value: '{"name":"Ramesh","bp":"128/82"}', timestamp: '10:14:02' },
    { key: 'doctor:DOC-1', value: '{"name":"Dr. Ramanathan","status":"OPD"}', timestamp: '10:15:30' },
  ]);

  const [sstables, setSstables] = useState<SSTableFile[]>([
    { id: 'sstable-001.db', entriesCount: 1250, minKey: 'apt:100', maxKey: 'apt:999', fileSize: '184 KB' },
    { id: 'sstable-002.db', entriesCount: 940, minKey: 'bed:101', maxKey: 'bed:402', fileSize: '112 KB' },
  ]);

  const [inputKey, setInputKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [lookupKey, setLookupKey] = useState('patient:AAR-9041');
  const [lookupResult, setLookupResult] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const handlePut = () => {
    if (!inputKey.trim() || !inputValue.trim()) return;
    const entry: MemTableEntry = {
      key: inputKey,
      value: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };
    const updated = [entry, ...memTable];
    setMemTable(updated);
    setInputKey('');
    setInputValue('');
    setToast(`Appended to Write-Ahead Log (WAL) & MemTable in RAM (O(1)).`);

    // Auto-flush simulation if memtable reaches 4 entries
    if (updated.length >= 4) {
      setTimeout(() => {
        handleFlushMemtable(updated);
      }, 1000);
    }
  };

  const handleFlushMemtable = (current: MemTableEntry[]) => {
    const newFile: SSTableFile = {
      id: `sstable-${String(sstables.length + 1).padStart(3, '0')}.db`,
      entriesCount: current.length,
      minKey: current[current.length - 1].key,
      maxKey: current[0].key,
      fileSize: `${Math.round(current.length * 3.4)} KB`
    };
    setSstables([newFile, ...sstables]);
    setMemTable([]);
    setToast(`MemTable threshold exceeded! Flushed immutable SSTable to disk (${newFile.id}).`);
    setTimeout(() => setToast(null), 4000);
  };

  const handleLookup = () => {
    // 1. Check MemTable
    const foundMem = memTable.find((m) => m.key === lookupKey);
    if (foundMem) {
      setLookupResult(`LSM Read Hit in MemTable (RAM): ${foundMem.value} (Latency: 0.12 ms)`);
      return;
    }
    // 2. Check Bloom filter & SSTables
    setLookupResult(`LSM Read Hit in Disk SSTable: Found via Bloom filter (Latency: 2.4 ms)`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#106E70] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            System Design Lab 3
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            LSM-Tree Key-Value Store Engine
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Simulates Log-Structured Merge (LSM) architecture: Write-Ahead Logs, In-Memory MemTables, and Immutable SSTable Compaction.
          </p>
        </div>

        <button
          onClick={() => handleFlushMemtable(memTable)}
          disabled={memTable.length === 0}
          className="px-4 py-2.5 bg-teal-400 hover:bg-teal-300 text-[#002043] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <HardDrive className="w-4 h-4" />
          <span>Manual SSTable Flush</span>
        </button>
      </div>

      {toast && (
        <div className="p-4 bg-teal-50 border border-teal-300 text-teal-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{toast}</span>
        </div>
      )}

      {/* Grid: Write/Read path vs Storage Tiering */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Put/Get Operations (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">PUT Operation (Write Path)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Appends to WAL sequentially and inserts to Red-Black Tree MemTable:</p>

            <div className="space-y-3 mt-3 text-xs">
              <input
                type="text"
                placeholder="Key (e.g. patient:AAR-9041)"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium"
              />
              <input
                type="text"
                placeholder='Value (e.g. {"status":"CheckedIn"})'
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-700"
              />
              <button
                type="button"
                onClick={handlePut}
                className="w-full py-2.5 bg-[#002043] hover:bg-[#17365d] text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Execute PUT(key, value)</span>
              </button>
            </div>
          </div>

          {/* Read Path */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900">GET Operation (Read Path)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Checks MemTable first, then Bloom filter, then SSTables:</p>

            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={lookupKey}
                onChange={(e) => setLookupKey(e.target.value)}
                placeholder="Lookup key..."
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium"
              />
              <button
                type="button"
                onClick={handleLookup}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition"
              >
                GET
              </button>
            </div>

            {lookupResult && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800">
                {lookupResult}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Storage Architecture Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          {/* Tier 1: In-Memory MemTable */}
          <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                <span className="font-bold text-teal-900 uppercase">Tier 1: MemTable in RAM</span>
              </div>
              <span className="font-mono text-teal-800 font-bold">{memTable.length} / 4 items before flush</span>
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              {memTable.length === 0 ? (
                <p className="text-slate-400 py-3 text-center text-xs">MemTable empty (Ready for writes)</p>
              ) : (
                memTable.map((item, idx) => (
                  <div key={idx} className="p-2 bg-white rounded-lg border border-teal-200/60 flex items-center justify-between">
                    <span className="font-bold text-slate-800">{item.key}</span>
                    <span className="text-slate-500 truncate max-w-xs">{item.value}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tier 2: Disk SSTable Files */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 uppercase">Tier 2: Immutable SSTables on Disk</span>
              <span className="text-slate-500">{sstables.length} SSTable Files</span>
            </div>

            <div className="space-y-2 text-xs">
              {sstables.map((file) => (
                <div key={file.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <HardDrive className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="font-mono font-bold text-slate-900">{file.id}</span>
                      <p className="text-[11px] text-slate-400">Keys: [{file.minKey} ... {file.maxKey}]</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-teal-700">{file.entriesCount} keys</span>
                    <p className="text-[11px] text-slate-400">{file.fileSize}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
