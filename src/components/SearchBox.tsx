import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { BrainMascot, MascotMood } from './BrainMascot.tsx';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  activeStatusMessage?: string;
  mascotMood: MascotMood;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  onSearch,
  isLoading,
  activeStatusMessage,
  mascotMood,
}) => {
  const [query, setQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const funnyPlaceholders = [
    'Miyamdan nima kerak edi?..',
    'MobiCom ranglari nima edi?..',
    'Telefon aksessuarlar brendi nomi nima?..',
    'Ofis Wi-Fi paroli necha edi?..',
    'Sardor bilan qachon ko‘rishamiz?..',
    'To‘y oshiga qancha zira solinadi?..',
    'Fitnes zal kunlari qaysi edi?..',
    '2025-yildagi muhim rejalarim?..',
  ];

  // Rotate funny placeholders every 3.5s when input is empty
  useEffect(() => {
    if (query) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % funnyPlaceholders.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [query, funnyPlaceholders.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim());
  };

  const handleChipClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    inputRef.current?.focus();
  };

  const clearQuery = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const exampleChips = [
    { label: 'MobiCom ranglari nima edi?', tag: 'Ranglar & Brend' },
    { label: 'Telefon aksessuarlar brendining nomi nima?', tag: 'Semantik qidiruv' },
    { label: 'Ofisdagi Wi-Fi paroli nima?', tag: 'Maxfiy parol 🔐' },
    { label: 'Sardor bilan uchrashuv qachon?', tag: 'Ish uchrashuvi' },
    { label: 'Eng zo‘r toshkentcha osh siri', tag: 'Retsept' },
    { label: 'Mashina moyi qachon almashtiriladi?', tag: 'Eslatma' },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Main Search Bar Wrapper */}
      <form
        onSubmit={handleSubmit}
        className={`relative group rounded-3xl transition-all duration-300 ${
          isLoading
            ? 'scale-[1.01] shadow-[0_0_40px_rgba(16,185,129,0.25)]'
            : 'hover:shadow-[0_0_30px_rgba(255,255,255,0.08)]'
        }`}
      >
        {/* Animated ambient border */}
        <div
          className={`absolute -inset-0.5 rounded-3xl opacity-75 blur-sm transition-all duration-500 ${
            isLoading
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-yellow-400 opacity-100 animate-pulse'
              : 'bg-gradient-to-r from-neutral-800 via-neutral-700 to-neutral-850 group-hover:opacity-100 group-hover:from-emerald-600/40 group-hover:to-cyan-600/40'
          }`}
        />

        {/* Inner search bar container */}
        <div className="relative flex items-center bg-[#0a0a0c] border border-neutral-800/90 rounded-3xl px-3 sm:px-5 py-2.5 sm:py-3.5 shadow-2xl backdrop-blur-xl">
          {/* Mascot seated proudly on the left */}
          <div className="shrink-0 mr-2 sm:mr-3">
            <BrainMascot mood={mascotMood} size={50} />
          </div>

          {/* Search Icon */}
          <Search className="w-5 h-5 text-neutral-500 mr-2.5 hidden sm:block shrink-0" />

          {/* Input field */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
              placeholder={funnyPlaceholders[placeholderIndex]}
              className="w-full bg-transparent text-white text-base sm:text-xl font-medium placeholder-neutral-500 focus:outline-none tracking-wide disabled:opacity-50"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-2 shrink-0">
            {query && !isLoading && (
              <button
                type="button"
                onClick={clearQuery}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Tozalash"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className={`flex items-center gap-1.5 px-3.5 sm:px-5 py-2 rounded-2xl font-semibold text-xs sm:text-sm tracking-wide transition-all transform active:scale-95 ${
                query.trim() && !isLoading
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'bg-neutral-800/80 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-emerald-950" />
                  <span className="hidden sm:inline">Kovlayapman...</span>
                </>
              ) : (
                <>
                  <span>Top!</span>
                  <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
                  <CornerDownLeft className="w-3.5 h-3.5 sm:hidden" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Loading state indicator with rotating funny Uzbek quotes */}
      {isLoading && (
        <div className="mt-4 flex flex-col items-center justify-center animate-fade-in text-center px-4">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-neutral-900/90 border border-emerald-500/30 text-emerald-400 text-sm font-mono shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="animate-pulse font-medium">{activeStatusMessage || 'Miyani kovlayapman...'}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Ikkinchi miya millionlab neyronlar orasidan xotirani qidirmoqda...
          </p>
        </div>
      )}
    </div>
  );
};
