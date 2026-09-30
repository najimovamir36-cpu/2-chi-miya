import React, { useState } from 'react';

export type MascotMood = 'idle' | 'thinking' | 'found' | 'empty' | 'private' | 'unlocked' | 'poked';

interface BrainMascotProps {
  mood?: MascotMood;
  className?: string;
  size?: number;
}

export const BrainMascot: React.FC<BrainMascotProps> = ({
  mood = 'idle',
  className = '',
  size = 72,
}) => {
  const [isPoked, setIsPoked] = useState(false);
  const [pokeQuote, setPokeQuote] = useState<string | null>(null);

  const pokeQuotes = [
    'Meni bosma, fikrlarim chalkashib ketadi! 😂',
    'Ey, qitiqlama! 😂',
    'Birinchi miyangni bos, meni emas!',
    'Ayy, neyronlarim uzilib ketayozdi! ⚡️',
    'Men robot emasman, ikkinchi miyaman! 🧠',
  ];

  const handlePoke = () => {
    setIsPoked(true);
    const q = pokeQuotes[Math.floor(Math.random() * pokeQuotes.length)];
    setPokeQuote(q);
    setTimeout(() => {
      setIsPoked(false);
      setPokeQuote(null);
    }, 2400);
  };

  const activeMood = isPoked ? 'poked' : mood;

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Speech bubble on poke */}
      {pokeQuote && (
        <div className="absolute -top-12 z-20 whitespace-nowrap bg-neutral-900 border border-emerald-500/40 text-emerald-400 text-xs px-2.5 py-1 rounded-full shadow-lg animate-bounce font-mono">
          {pokeQuote}
        </div>
      )}

      {/* SVG Brain */}
      <div
        onClick={handlePoke}
        title="Miyani bosib ko'r 😂"
        className={`cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95 ${
          activeMood === 'thinking'
            ? 'animate-think'
            : activeMood === 'empty'
            ? 'rotate-12 translate-y-2'
            : activeMood === 'found'
            ? 'animate-bounce'
            : activeMood === 'private'
            ? 'animate-pulse'
            : 'animate-wobble'
        }`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_0_15px_rgba(34,197,94,0.25)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer glow aura */}
          <circle
            cx="50"
            cy="50"
            r="44"
            className={`transition-colors duration-500 ${
              activeMood === 'private'
                ? 'fill-red-500/10 stroke-red-500/30'
                : activeMood === 'found'
                ? 'fill-emerald-500/15 stroke-emerald-500/40'
                : activeMood === 'thinking'
                ? 'fill-yellow-500/15 stroke-yellow-500/40'
                : 'fill-neutral-900/40 stroke-neutral-800'
            }`}
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Brain Left Hemisphere */}
          <path
            d="M 32 30 C 22 25 15 36 17 48 C 12 55 14 68 24 72 C 30 76 38 74 44 70 C 47 67 48 58 48 50 C 48 40 46 32 40 28 C 36 26 34 28 32 30 Z"
            fill={activeMood === 'private' ? '#38161D' : '#141416'}
            stroke={activeMood === 'private' ? '#f43f5e' : activeMood === 'found' ? '#10b981' : '#3f3f46'}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Brain Right Hemisphere */}
          <path
            d="M 68 30 C 78 25 85 36 83 48 C 88 55 86 68 76 72 C 70 76 62 74 56 70 C 53 67 52 58 52 50 C 52 40 54 32 60 28 C 64 26 66 28 68 30 Z"
            fill={activeMood === 'private' ? '#38161D' : '#141416'}
            stroke={activeMood === 'private' ? '#f43f5e' : activeMood === 'found' ? '#10b981' : '#3f3f46'}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Brain convolutions / grooves */}
          <path
            d="M 28 42 Q 35 44 38 38 M 24 56 Q 34 54 36 62 M 72 42 Q 65 44 62 38 M 76 56 Q 66 54 64 62"
            stroke={activeMood === 'private' ? '#fb7185' : activeMood === 'found' ? '#34d399' : '#52525b'}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Center division */}
          <path
            d="M 50 28 L 50 68"
            stroke={activeMood === 'private' ? '#fb7185' : '#52525b'}
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* EYES based on MOOD */}
          {activeMood === 'thinking' ? (
            // Swirling / searching eyes
            <g>
              <circle cx="37" cy="48" r="4.5" fill="#eab308" />
              <circle cx="63" cy="48" r="4.5" fill="#eab308" />
              <path d="M 35 48 A 2 2 0 0 1 39 48" stroke="#000" strokeWidth="1.5" />
              <path d="M 61 48 A 2 2 0 0 1 65 48" stroke="#000" strokeWidth="1.5" />
              {/* Little lightbulb or spark */}
              <circle cx="50" cy="18" r="3.5" fill="#facc15" className="animate-ping" />
            </g>
          ) : activeMood === 'found' ? (
            // Sparkly happy eyes
            <g>
              <circle cx="37" cy="48" r="5" fill="#10b981" />
              <circle cx="63" cy="48" r="5" fill="#10b981" />
              <circle cx="39" cy="46" r="1.8" fill="#ffffff" />
              <circle cx="65" cy="46" r="1.8" fill="#ffffff" />
              {/* Big happy smile */}
              <path d="M 42 59 Q 50 66 58 59" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          ) : activeMood === 'empty' ? (
            // Dizzy 'X' eyes
            <g>
              <path d="M 34 45 L 40 51 M 40 45 L 34 51" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
              <path d="M 60 45 L 66 51 M 66 45 L 60 51" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
              {/* Slanted sad / confused mouth */}
              <path d="M 44 62 Q 50 56 56 61" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
            </g>
          ) : activeMood === 'private' ? (
            // Cool Sunglasses / Secret mode
            <g>
              <polygon points="30,45 46,45 43,54 33,54" fill="#000000" stroke="#f43f5e" strokeWidth="1.5" />
              <polygon points="54,45 70,45 67,54 57,54" fill="#000000" stroke="#f43f5e" strokeWidth="1.5" />
              <line x1="46" y1="48" x2="54" y2="48" stroke="#f43f5e" strokeWidth="2" />
              {/* Smirk */}
              <path d="M 45 61 Q 52 64 56 60" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
            </g>
          ) : activeMood === 'poked' ? (
            // Surprised / shocked wide eyes
            <g>
              <circle cx="37" cy="48" r="6" fill="#f43f5e" />
              <circle cx="63" cy="48" r="6" fill="#f43f5e" />
              <circle cx="37" cy="48" r="2.5" fill="#fff" />
              <circle cx="63" cy="48" r="2.5" fill="#fff" />
              {/* Open round mouth */}
              <ellipse cx="50" cy="62" rx="4" ry="5" fill="#fff" />
            </g>
          ) : (
            // Normal clever idle eyes with slight curious look
            <g>
              <circle cx="37" cy="49" r="4" fill="#ffffff" />
              <circle cx="63" cy="49" r="4" fill="#ffffff" />
              <circle cx="38.5" cy="49" r="2" fill="#000000" />
              <circle cx="64.5" cy="49" r="2" fill="#000000" />
              {/* Subtle smile */}
              <path d="M 44 59 Q 50 63 56 59" stroke="#71717a" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
        </svg>
      </div>

      {/* Funny mini label below */}
      <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mt-1">
        {activeMood === 'thinking'
          ? 'Qidirmoqda...'
          : activeMood === 'found'
          ? 'Topdi! 🧠'
          : activeMood === 'empty'
          ? 'Unutgan 😂'
          : activeMood === 'private'
          ? 'Maxfiy rejim 🚨'
          : '2-chi Miya'}
      </span>
    </div>
  );
};
