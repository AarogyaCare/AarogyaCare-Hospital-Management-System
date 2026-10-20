import { useState } from 'react';
import { 
  RotateCw, Plus, Trash2, CheckCircle2, 
  Layers, Database, ArrowRight, ShieldCheck, Zap 
} from 'lucide-react';

interface ServerNode {
  id: string;
  name: string;
  angle: number; // degrees on ring (0 - 360)
  color: string;
}

interface HashKey {
  key: string;
  angle: number;
  assignedNode: string;
}

export default function ConsistentHashingLab() {
  const [nodes, setNodes] = useState<ServerNode[]>([
    { id: 'node-a', name: 'Node A (Chennai Central)', angle: 45, color: '#178B8B' },
    { id: 'node-b', name: 'Node B (Grems Road Primary)', angle: 135, color: '#2563eb' },
    { id: 'node-c', name: 'Node C (Disaster Recovery)', angle: 240, color: '#8b5cf6' },
  ]);

  const [virtualNodesMultiplier, setVirtualNodesMultiplier] = useState(3);
  const [testKey, setTestKey] = useState('patient:uhid:AAR-2026-9041');
  const [testResult, setTestResult] = useState<string | null>(null);

  // Simple string to hash angle (0 - 359)
  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 360;
  };

  const handleLookupKey = () => {
    const keyAngle = hashString(testKey);
    // Find first node with angle >= keyAngle, or wrap around
    const sortedNodes = [...nodes].sort((a, b) => a.angle - b.angle);
    let matched = sortedNodes.find((n) => n.angle >= keyAngle);
    if (!matched) matched = sortedNodes[0];

    setTestResult(
      `Key "${testKey}" hashes to ${keyAngle}°. Clockwise traversal routes key to ${matched.name}.`
    );
  };

  const handleAddNode = () => {
    const letters = ['D', 'E', 'F'];
    const idx = nodes.length;
    if (idx >= 6) return;
    const name = `Node ${letters[idx - 3] || 'X'} (Edge Cache)`;
    const newAngle = Math.floor(Math.random() * 360);
    setNodes([
      ...nodes,
      { id: `node-${Date.now()}`, name, angle: newAngle, color: '#f59e0b' }
    ]);
  };

  const handleRemoveNode = (id: string) => {
    if (nodes.length <= 2) return;
    setNodes(nodes.filter((n) => n.id !== id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#002043] via-[#002b54] to-[#106E70] text-white p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/20 px-3 py-1 rounded-full border border-teal-400/30">
            System Design Lab 2
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Consistent Hashing Ring Simulator
          </h1>
          <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-xl">
            Simulates distributed hash rings with virtual nodes, demonstrating minimal key migration and zero-downtime cache rebalancing.
          </p>
        </div>

        <button
          onClick={handleAddNode}
          disabled={nodes.length >= 6}
          className="px-4 py-2.5 bg-teal-400 hover:bg-teal-300 text-[#002043] font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 self-start md:self-auto disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cache Node</span>
        </button>
      </div>

      {testResult && (
        <div className="p-4 bg-teal-50 border border-teal-300 text-teal-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* 2 Columns: Visual Ring vs Controls & Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Hash Ring (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm flex flex-col items-center justify-center space-y-6">
          <h3 className="text-base font-bold text-slate-900 self-start">Circular Hash Space (0° - 360°)</h3>

          {/* SVG Ring */}
          <div className="relative w-72 h-72 flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              <circle
                cx="100"
                cy="100"
                r="75"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="6"
                strokeDasharray="4 4"
              />
              {/* Nodes on ring */}
              {nodes.map((node) => {
                const rad = (node.angle * Math.PI) / 180;
                const cx = 100 + 75 * Math.cos(rad);
                const cy = 100 + 75 * Math.sin(rad);
                return (
                  <circle
                    key={node.id}
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill={node.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="cursor-pointer hover:scale-125 transition-transform"
                  />
                );
              })}
            </svg>

            {/* Center Info */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs font-bold text-[#002043]">{nodes.length} Physical Nodes</span>
              <span className="text-[10px] text-slate-400">
                {nodes.length * virtualNodesMultiplier} Virtual Tokens
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center max-w-sm">
            Keys are hashed onto the 360° continuum and assigned to the first node encountered moving clockwise.
          </p>
        </div>

        {/* Right Column: Key Lookup & Node List (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
          {/* Key Routing Tester */}
          <div>
            <h3 className="text-base font-bold text-slate-900">Route Patient EMR Key</h3>
            <p className="text-xs text-slate-500 mt-0.5">Test which database shard or cache replica stores this key:</p>

            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                placeholder="e.g. patient:record:9041"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-[#002043]"
              />
              <button
                type="button"
                onClick={handleLookupKey}
                className="px-4 py-2 bg-[#002043] hover:bg-[#17365d] text-white rounded-xl text-xs font-bold transition"
              >
                Route Key
              </button>
            </div>
          </div>

          {/* Virtual Nodes Multiplier */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-700">Virtual Nodes Replication Factor</span>
              <span className="text-xs font-bold text-teal-700">{virtualNodesMultiplier}x per Server</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-bold">
              {[1, 3, 5].map((multiplier) => (
                <button
                  key={multiplier}
                  type="button"
                  onClick={() => setVirtualNodesMultiplier(multiplier)}
                  className={`py-2 rounded-xl border transition ${
                    virtualNodesMultiplier === multiplier
                      ? 'bg-[#002043] text-white border-[#002043]'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {multiplier}x Replicas
                </button>
              ))}
            </div>
          </div>

          {/* Active Nodes List */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-700 block">Active Cache Clusters ({nodes.length})</span>
            <div className="space-y-2">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: node.color }} />
                    <span className="font-bold text-slate-900">{node.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({node.angle}°)</span>
                  </div>

                  {nodes.length > 2 && (
                    <button
                      onClick={() => handleRemoveNode(node.id)}
                      className="text-slate-400 hover:text-rose-600 transition"
                      title="Decommission node"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
