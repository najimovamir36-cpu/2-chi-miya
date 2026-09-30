import React, { useState } from 'react';
import { Sparkles, Calendar, Tag, Radio, Copy, Check, ChevronDown, ChevronUp, Lock } from 'lucide-react';

export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  source?: string;
  tags?: string[];
  score?: number;
  isPrivate?: boolean;
}

export interface SearchResultData {
  found: boolean;
  isPrivate?: boolean;
  isUnlocked?: boolean;
  category?: string;
  date?: string;
  memoryId?: string;
  score?: number;
  answer: string;
  wittyRemark: string;
  highlightedQuote?: string;
  relevanceConfidence?: number;
  primaryMemory?: MemoryItem | null;
  similarMemories?: MemoryItem[];
}

interface ResultCardProps {
  data: SearchResultData;
  onSelectSimilarMemory?: (memory: MemoryItem) => void;
  onRetry?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  data,
  onSelectSimilarMemory,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [showFullMemory, setShowFullMemory] = useState(false);
  const [selectedSimilar, setSelectedSimilar] = useState<MemoryItem | null>(null);

  const handleCopy = () => {
    if (!data.answer) return;
    navigator.clipboard.writeText(data.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // If nothing found
  if (!data.found || !data.primaryMemory) {
    return (
      <div className="w-full max-w-2xl mx-auto my-6 px-4 animate-fade-in">
        <div className="rounded-3xl bg-[#0d0d10] border border-neutral-800 p-6 sm:p-8 text-center shadow-2xl">
          <div className="inline-flex p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-yellow-400 mb-4 text-3xl">
            🥱
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">
            Bu narsa miyamda yo‘q ekan 😂
          </h3>
          <p className="text-neutral-400 text-sm mb-6 max-w-md mx-auto">
            {data.wittyRemark || 'Buni hech qachon yozmagansan shekilli. Yoki birinchi miyang buni hali Telegram orqali yubormagan.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-5 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs tracking-wider uppercase transition-all"
            >
              Yana urintirib ko‘r 😂
            </button>
          )}
        </div>
      </div>
    );
  }

  const memory = data.primaryMemory;
  const confidencePercent = Math.round((data.relevanceConfidence || 0.85) * 100);

  // Category color scheme
  const categoryColors: Record<string, string> = {
    Projects: 'text-cyan-400 border-cyan-500/30 bg-cyan-950/30',
    Ideas: 'text-amber-400 border-amber-500/30 bg-amber-950/30',
    Knowledge: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30',
    Personal: 'text-purple-400 border-purple-500/30 bg-purple-950/30',
    Work: 'text-blue-400 border-blue-500/30 bg-blue-950/30',
    Important: 'text-rose-400 border-rose-500/30 bg-rose-950/30',
    Private: 'text-red-400 border-red-500/30 bg-red-950/30',
    'Random thoughts': 'text-neutral-300 border-neutral-700 bg-neutral-900',
  };

  const badgeClass = categoryColors[memory.category] || categoryColors['Random thoughts'];

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4 animate-fade-in space-y-4">
      {/* Primary Result Card */}
      <div className="relative rounded-3xl bg-[#0a0a0d] border border-neutral-800/90 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Glow ambient highlight */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Status Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-neutral-900">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              TOPDIM! 🧠
            </span>

            <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono border ${badgeClass}`}>
              {memory.category}
            </span>

            {memory.isPrivate && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/40">
                <Lock className="w-3 h-3" /> Maxfiy
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-500">
              {confidencePercent}% moslik
            </span>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-850 transition-colors"
              title="Javobdan nusxa olish"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Animated AI Answer */}
          <div>
            <p className="text-white text-lg sm:text-2xl font-bold leading-relaxed tracking-tight">
              {data.answer}
            </p>

            {data.wittyRemark && (
              <p className="text-emerald-400/90 text-sm sm:text-base font-medium mt-2.5 flex items-start gap-2">
                <span className="shrink-0 text-base">💡</span>
                <span>{data.wittyRemark}</span>
              </p>
            )}
          </div>

          {/* Highlighted Quote from memory */}
          {data.highlightedQuote && (
            <div className="p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs sm:text-sm text-neutral-300 font-mono flex items-start gap-2.5">
              <span className="text-emerald-400 font-bold shrink-0">“</span>
              <p className="flex-1 italic">{data.highlightedQuote}</p>
            </div>
          )}

          {/* Collapsible Original Memory Details */}
          <div className="pt-2 border-t border-neutral-900">
            <button
              onClick={() => setShowFullMemory(!showFullMemory)}
              className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-white py-1 font-mono transition-colors"
            >
              <span>{showFullMemory ? 'Xotira tafsilotlarini yashirish' : 'To‘liq xotira tafsilotlari'}</span>
              {showFullMemory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showFullMemory && (
              <div className="mt-3 p-4 rounded-2xl bg-black/60 border border-neutral-850 space-y-2.5 text-xs animate-fade-in">
                <div className="font-semibold text-neutral-200 text-sm">
                  {memory.title}
                </div>
                <p className="text-neutral-400 leading-relaxed">
                  {memory.content}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[11px] font-mono text-neutral-500 border-t border-neutral-900">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{memory.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5" />
                    <span>{memory.source || 'Telegram'}</span>
                  </div>
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{memory.tags.map((t) => `#${t}`).join(' ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Memories Section */}
      {data.similarMemories && data.similarMemories.length > 0 && (
        <div className="rounded-2xl bg-neutral-950/60 border border-neutral-900 p-4">
          <div className="text-xs font-mono text-neutral-400 mb-3 flex items-center justify-between">
            <span>Shunga o‘xshash yana {data.similarMemories.length} ta narsa topildi:</span>
            <span className="text-[10px] text-neutral-600">Bosing va ko‘ring</span>
          </div>

          <div className="space-y-2">
            {data.similarMemories.map((sim) => (
              <div
                key={sim.id}
                onClick={() => {
                  if (onSelectSimilarMemory) onSelectSimilarMemory(sim);
                  setSelectedSimilar(selectedSimilar?.id === sim.id ? null : sim);
                }}
                className="group cursor-pointer p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-850 border border-neutral-850 hover:border-neutral-750 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-neutral-200 group-hover:text-emerald-400 transition-colors">
                      {sim.title}
                    </span>
                    {sim.isPrivate && (
                      <span className="text-[9px] font-mono text-red-400 bg-red-950/40 px-1.5 py-0.2 rounded border border-red-900/40">
                        🔒 Maxfiy
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {sim.category}
                  </span>
                </div>

                <p className="text-xs text-neutral-400 line-clamp-1 mt-1">
                  {sim.content}
                </p>

                {selectedSimilar?.id === sim.id && (
                  <div className="mt-2.5 pt-2 border-t border-neutral-800 text-xs text-neutral-300 font-mono bg-black/40 p-2.5 rounded-lg animate-fade-in">
                    <div className="text-emerald-400 font-bold mb-1">To‘liq matn:</div>
                    <p>{sim.content}</p>
                    <div className="mt-1 text-[10px] text-neutral-500">Sana: {sim.date}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
