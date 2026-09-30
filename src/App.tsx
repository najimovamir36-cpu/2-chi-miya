import React, { useState, useEffect, useRef } from 'react';
import { AnimatedTitle } from './components/AnimatedTitle.tsx';
import { SearchBox } from './components/SearchBox.tsx';
import { ResultCard, SearchResultData, MemoryItem } from './components/ResultCard.tsx';
import { PrivateGate } from './components/PrivateGate.tsx';
import { TelegramSimulatorModal } from './components/TelegramSimulatorModal.tsx';
import { MemoriesDrawer } from './components/MemoriesDrawer.tsx';
import { StatsModal } from './components/StatsModal.tsx';
import { AmirTemurModal } from './components/AmirTemurModal.tsx';
import { MascotMood } from './components/BrainMascot.tsx';
import { Sparkles, Brain, Bot, BarChart2, FolderLock, ShieldAlert, Crown } from 'lucide-react';

export default function App() {
  const [searchResult, setSearchResult] = useState<SearchResultData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Miyani kovlayapman...');
  const [mascotMood, setMascotMood] = useState<MascotMood>('idle');
  const [activeQuery, setActiveQuery] = useState('');

  // Modals state
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isAmirTemurOpen, setIsAmirTemurOpen] = useState(false);
  const [isDirectPrivatePromptOpen, setIsDirectPrivatePromptOpen] = useState(false);

  // Stored memories for manager
  const [allMemories, setAllMemories] = useState<MemoryItem[]>([]);
  const [unlockedPrivatePassword, setUnlockedPrivatePassword] = useState<string | null>(null);

  // Rotating funny search messages
  const searchStatusList = [
    'Miyani kovlayapman...',
    'Eski xotiralarni titkilayapman...',
    'Bir soniya, miyamda chang ko‘p ekan...',
    'Boshqa papkalarni ham ko‘ryapman...',
    '2019-yildagi fikrlarni ham tekshiryapman...',
    'Topishga harakat qilyapman...',
    'Ha-a, mana bu ekan 😂',
  ];

  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load all memories on start
  const fetchMemories = async () => {
    try {
      const headers: Record<string, string> = {};
      if (unlockedPrivatePassword) {
        headers['x-private-password'] = unlockedPrivatePassword;
      }
      const res = await fetch('/api/memories', { headers });
      if (res.ok) {
        const data = await res.json();
        setAllMemories(data);
      }
    } catch (err) {
      console.error('Failed to load memories:', err);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [unlockedPrivatePassword]);

  // Execute Search
  const handleSearch = async (queryText: string, forcedPassword?: string) => {
    if (!queryText.trim()) return;

    setActiveQuery(queryText);
    setIsSearching(true);
    setMascotMood('thinking');

    // Cycle funny search status messages
    let msgIndex = 0;
    setStatusMessage(searchStatusList[0]);
    if (statusTimerRef.current) clearInterval(statusTimerRef.current);
    statusTimerRef.current = setInterval(() => {
      msgIndex = (msgIndex + 1) % searchStatusList.length;
      setStatusMessage(searchStatusList[msgIndex]);
    }, 600);

    try {
      const payload: Record<string, string> = { query: queryText };
      const pwd = forcedPassword || unlockedPrivatePassword;
      if (pwd) {
        payload.password = pwd;
      }

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: SearchResultData = await res.json();
      setSearchResult(data);

      if (data.isPrivate && !data.isUnlocked) {
        setMascotMood('private');
      } else if (data.found && data.primaryMemory) {
        setMascotMood('found');
      } else {
        setMascotMood('empty');
      }
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResult({
        found: false,
        answer: 'Miya biroz yiqilib tushdi.',
        wittyRemark: 'Miyadagi neyronlar biroz chalkashib ketdi. Yana urintirib ko‘r 😂',
      });
      setMascotMood('empty');
    } finally {
      if (statusTimerRef.current) clearInterval(statusTimerRef.current);
      setIsSearching(false);
    }
  };

  // When private memory password is verified
  const handlePrivateUnlocked = (unlockData: { password: string }) => {
    setUnlockedPrivatePassword(unlockData.password);
    setMascotMood('found');
    // Re-run the active search with the new password
    if (activeQuery) {
      handleSearch(activeQuery, unlockData.password);
    }
    fetchMemories();
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-neutral-100 flex flex-col justify-between selection:bg-emerald-400 selection:text-black">
      {/* Subtle Background Radial Aura */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[350px] bg-sky-500/5 rounded-full blur-[130px]" />
      </div>

      {/* CENTER HERO & SEARCH AREA */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center py-6 sm:py-10 px-4">
        {/* Animated Hero Title */}
        <AnimatedTitle />

        {/* Giant Search Field */}
        <div className="w-full mt-4 sm:mt-6">
          <SearchBox
            onSearch={handleSearch}
            isLoading={isSearching}
            activeStatusMessage={statusMessage}
            mascotMood={mascotMood}
          />
        </div>

        {/* Amir Temurxon Najimov (AI Nusxam) Interactive Chat Trigger */}
        <div className="mt-4 flex items-center justify-center">
          <button
            onClick={() => setIsAmirTemurOpen(true)}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-indigo-500/15 hover:from-cyan-500/25 hover:to-indigo-500/25 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-mono transition-all hover:scale-105 shadow-[0_0_25px_rgba(6,182,212,0.15)] group"
          >
            <span className="w-5 h-5 rounded-lg bg-cyan-400/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold flex items-center justify-center group-hover:scale-110 transition-transform">
              AT
            </span>
            <span className="font-semibold text-white">Amir Temurxon (AI Nusxam) bilan gaplashish</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 font-bold">
              Gemini & Grok
            </span>
          </button>
        </div>

        {/* RESULTS OR PRIVATE PROMPT DISPLAY */}
        {searchResult && (
          <div className="w-full mt-6">
            {searchResult.isPrivate && !searchResult.isUnlocked ? (
              <PrivateGate
                memoryId={searchResult.primaryMemory?.id}
                category={searchResult.category}
                date={searchResult.date}
                onUnlocked={handlePrivateUnlocked}
                onCancel={() => {
                  setSearchResult(null);
                  setMascotMood('idle');
                }}
              />
            ) : (
              <ResultCard
                data={searchResult}
                onSelectSimilarMemory={(mem) => {
                  handleSearch(mem.title);
                }}
                onRetry={() => {
                  if (activeQuery) handleSearch(activeQuery);
                }}
              />
            )}
          </div>
        )}

        {/* Standalone Private Vault Access if triggered */}
        {isDirectPrivatePromptOpen && !searchResult?.isPrivate && (
          <PrivateGate
            onUnlocked={(data) => {
              handlePrivateUnlocked(data);
              setIsDirectPrivatePromptOpen(false);
              setIsMemoriesOpen(true);
            }}
            onCancel={() => setIsDirectPrivatePromptOpen(false)}
          />
        )}
      </main>

      {/* Discrete Corner Access for Owner Tools */}
      <div className="fixed bottom-3 right-3 z-20 flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsAmirTemurOpen(true)}
          className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-cyan-400 border border-cyan-500/30 text-xs transition-all shadow-lg font-bold font-mono text-[10px]"
          title="Amir Temurxon (AI Nusxam - Gemini & Grok)"
        >
          AT
        </button>

        <button
          onClick={() => setIsTelegramOpen(true)}
          className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-sky-400 border border-neutral-800 text-xs transition-all shadow-lg"
          title="Telegram Bot"
        >
          <Bot className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsStatsOpen(true)}
          className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-yellow-400 border border-neutral-800 text-xs transition-all shadow-lg"
          title="Statistika"
        >
          <BarChart2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setIsMemoriesOpen(true)}
          className="p-2 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-emerald-400 border border-neutral-800 text-xs transition-all shadow-lg"
          title="Xotiralarim"
        >
          <Brain className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MODALS */}
      <AmirTemurModal
        isOpen={isAmirTemurOpen}
        onClose={() => setIsAmirTemurOpen(false)}
      />

      <TelegramSimulatorModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
        onMemoryAdded={() => {
          fetchMemories();
        }}
      />

      <MemoriesDrawer
        isOpen={isMemoriesOpen}
        onClose={() => setIsMemoriesOpen(false)}
        memories={allMemories}
        onRefresh={fetchMemories}
        onSelectMemoryForSearch={(title) => {
          handleSearch(title);
        }}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />
    </div>
  );
}
