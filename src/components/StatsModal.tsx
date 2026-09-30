import React, { useEffect, useState } from 'react';
import { X, Activity, BarChart3, Database, Shield, Zap, Sparkles } from 'lucide-react';
import { BrainMascot } from './BrainMascot.tsx';

interface StatsData {
  total: number;
  privateCount: number;
  publicCount: number;
  categories: Record<string, number>;
  capacityPercent: number;
  emptyPercent: number;
  status: string;
  funnyStatus: string;
}

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/stats')
        .then((r) => r.json())
        .then(setStats)
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0c0d12] border border-neutral-800 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-yellow-400 to-emerald-500" />

        <div className="flex items-center justify-between pb-4 border-b border-neutral-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-display">Miya Statistikasi</h3>
              <p className="text-xs text-neutral-400 font-mono">Neyron tarmoq holati</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-5">
          {/* Mascot with funny capacity status */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-850">
            <BrainMascot mood="found" size={56} />
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-emerald-400 font-bold">Xotira bandligi:</span>
                <span className="text-white font-bold">{stats?.capacityPercent || 18.4}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-yellow-400 rounded-full transition-all duration-1000"
                  style={{ width: `${stats?.capacityPercent || 18.4}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-400 font-mono mt-2 leading-relaxed">
                {stats?.funnyStatus || 'Miya to‘lishi: 18.4% - qolgan 81.6% bekorchi o‘ylar va memlar 😂'}
              </p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center">
              <Database className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-xl font-black text-white">{stats?.total ?? 10}</div>
              <div className="text-[10px] text-neutral-400 uppercase font-mono">Jami xotiralar</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center">
              <Sparkles className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <div className="text-xl font-black text-white">{stats?.publicCount ?? 8}</div>
              <div className="text-[10px] text-neutral-400 uppercase font-mono">Ochiq xotiralar</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-center">
              <Shield className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <div className="text-xl font-black text-white">{stats?.privateCount ?? 2}</div>
              <div className="text-[10px] text-neutral-400 uppercase font-mono">Maxfiy 🔐</div>
            </div>
          </div>

          {/* Categories breakdown */}
          {stats?.categories && (
            <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  Kategoriyalar taqsimoti:
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {Object.entries(stats.categories).map(([cat, count]) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300"
                  >
                    <span>{cat}</span>
                    <span className="text-emerald-400 font-bold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Funny Tip */}
          <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-850 text-[11px] text-neutral-400 font-mono flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
            <span>
              Maslahat: Har kuni Telegram botga kamida 2 ta fikr yozsangiz, birinchi miyangiz 40% yengil tortadi! 😂
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
