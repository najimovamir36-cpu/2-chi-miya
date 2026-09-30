import React, { useEffect, useState } from 'react';

interface AnimatedTitleProps {
  onAnimationComplete?: () => void;
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({ onAnimationComplete }) => {
  // Stages: 0: '2', 1: '2-chi', 2: '2-chi Miya', 3: 'Birinchi miyam band.', 4: 'Ikkinchisini ishlatyapman. 😂'
  const [stage, setStage] = useState<number>(0);
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 500); // '2-chi'
    const t2 = setTimeout(() => setStage(2), 1100); // '2-chi Miya'
    const t3 = setTimeout(() => setStage(3), 1900); // 'Birinchi miyam band.'
    const t4 = setTimeout(() => {
      setStage(4);
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 600);
      if (onAnimationComplete) onAnimationComplete();
    }, 2800); // 'Ikkinchisini ishlatyapman. 😂'

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onAnimationComplete]);

  // Letters of '2-chi Miya'
  const titleText = stage === 0 ? '2' : stage === 1 ? '2-chi' : '2-chi Miya';

  return (
    <div className="flex flex-col items-center justify-center text-center select-none py-4">
      {/* Glitch & Glow background highlight */}
      <div className="relative">
        <h1
          className={`font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-white flex items-center justify-center flex-wrap gap-x-1 sm:gap-x-2 transition-all duration-300 ${
            glitchActive ? 'animate-glitch text-emerald-400' : ''
          }`}
        >
          {titleText.split('').map((char, idx) => {
            const isLast = idx === titleText.length - 1;
            // Slight random tilt on letters for playful personality
            const tilts = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', 'rotate-0'];
            const tilt = tilts[idx % tilts.length];

            return (
              <span
                key={`${char}-${idx}`}
                className={`inline-block transition-transform duration-300 transform hover:scale-125 hover:text-emerald-400 cursor-default ${tilt} ${
                  isLast ? 'animate-bounce' : ''
                }`}
                style={{
                  textShadow: '0 0 25px rgba(255, 255, 255, 0.25)',
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            );
          })}
          {/* Animated cursor */}
          <span className="inline-block w-2.5 sm:w-3.5 h-10 sm:h-14 bg-emerald-400 ml-1 animate-pulse" />
        </h1>
      </div>

      {/* Subtitle Lines */}
      <div className="min-h-[5rem] sm:min-h-[4.5rem] mt-3 sm:mt-4 flex flex-col items-center justify-center space-y-1 sm:space-y-1.5 px-4">
        {/* Line 1: 'Birinchi miyam band.' */}
        <p
          className={`text-neutral-400 text-base sm:text-lg md:text-xl font-medium tracking-wide transition-all duration-700 transform ${
            stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}
        >
          “Birinchi miyam band.”
        </p>

        {/* Line 2: 'Ikkinchisini ishlatyapman. 😂' */}
        {stage >= 4 && (
          <p className="text-emerald-400 text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight animate-bounce flex items-center gap-2">
            <span>“Ikkinchisini ishlatyapman.”</span>
            <span className="inline-block text-2xl sm:text-3xl transform hover:rotate-12 transition-transform">
              😂
            </span>
          </p>
        )}
      </div>
    </div>
  );
};
