import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Zap, Shield, Flame, Trash2, UserCheck } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  mode?: 'gemini' | 'grok';
  time: string;
}

interface AmirTemurModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AmirTemurModal: React.FC<AmirTemurModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'gemini' | 'grok'>('gemini');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Salom, o‘zim! 👋 Men sening raqamli 2-chi Miyangman — Amir Temurxon Najimovning AI nusxasiman! Sen bilan huddi o‘zingdek — ochiq, samimiy va erkin gaplashamiz. Barcha xotiralarimiz, biznes g‘oyalarimiz (masalan, MobiCom) va rejalarimiz yodimda. Bugun nimalarni muhokama qilamiz?",
      mode: 'gemini',
      time: 'Hozir',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    if (!customText) {
      setInput('');
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = 'usr-' + Date.now();
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        text: textToSend,
        time: nowTime,
      },
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const historyPayload = newMessages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/chat/amir-temur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          mode,
        }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'temur-' + Date.now(),
            role: 'model',
            text: data.reply,
            mode: data.mode || mode,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'err-' + Date.now(),
            role: 'model',
            text: mode === 'grok'
              ? "E Amir Temurxon, internet bir lahzaga chalg‘idi, lekin ikkinchi miyang doim sen bilan! Qaytadan yozib ko‘r! 😂"
              : "Amir Temurxon, aloqada kichik to‘siq bo‘ldi. Yana bir bor takrorla, darrov javob beraman!",
            mode,
            time: nowTime,
          },
        ]);
      }
    } catch (err) {
      console.error('Amir Temur chat network error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const starterChips = [
    'MobiCom brendini qanday rivojlantiramiz?',
    mode === 'grok' ? 'O‘zimga bir o‘tkir hazil va motivatsiya ber! 😂' : 'Bugun o‘zimga bir kuchli motivatsiya ber!',
    '2-chi Miyamdagi eng asosiy rejalarim nima?',
    mode === 'grok' ? 'Dangasalik qilayotgan bo‘lsam o‘tkir so‘z ayt! 😂' : 'Dangasalikni qanday yengamiz, o‘zim?',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0b0c10] border border-cyan-500/30 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Glow Ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-neutral-900/60 to-black">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.35)]">
              <div className="w-full h-full bg-[#121318] rounded-[14px] flex items-center justify-center text-cyan-300 font-bold font-mono tracking-wider text-base">
                AT
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-white text-base tracking-tight">
                  Amir Temurxon Najimov
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold">
                  AI Nusxam
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>2-chi Miya • Huddi o‘zingizdek gaplashadi</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Engine Switcher: Gemini vs Grok */}
            <div className="flex items-center bg-black/80 p-1 rounded-2xl border border-neutral-800 text-xs font-mono">
              <button
                onClick={() => setMode('gemini')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  mode === 'gemini'
                    ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Gemini AI: Amir Temurxonning mulohazali, strategik va aqlli AI nusxasi"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gemini</span>
              </button>

              <button
                onClick={() => setMode('grok')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  mode === 'grok'
                    ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Grok Mode: Amir Temurxonning o'tkir tilli, hazilkash va dangal AI nusxasi"
              >
                <Flame className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grok</span>
              </button>
            </div>

            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome',
                    role: 'model',
                    text: mode === 'grok'
                      ? "E Amir Temurxon, suhbatni yangiladik! Nima gaplar, qanday g‘oyalarni titkilaymiz? 😂"
                      : "Suhbat yangilandi, o‘zim. Qanday reja yoki savoling bor?",
                    mode,
                    time: 'Hozir',
                  },
                ]);
              }}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-300 hover:bg-neutral-850 transition-colors"
              title="Suhbatni tozalash"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Mode Sub-banner */}
        <div className="px-5 py-2 bg-neutral-950/90 border-b border-neutral-850 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2">
            {mode === 'gemini' ? (
              <>
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-cyan-300">Rejim: Mulohazali & Strategik (Gemini AI)</span>
                <span className="text-neutral-600">•</span>
                <span className="text-neutral-400 italic">“Intizom va aniq reja g‘alabaga eltadi”</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-orange-300 font-bold">Rejim: Grok Mode (xAI Style)</span>
                <span className="text-neutral-600">•</span>
                <span className="text-neutral-400 italic">O‘tkir hazil, chapanicha va dangal! 😂</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-neutral-500 hidden sm:inline">
            Amir Temurxon Najimov xotiralariga ulangan
          </span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#07080a] min-h-[320px]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[80%]">
                {m.role === 'model' && (
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold font-mono text-xs shrink-0 mt-1">
                    AT
                  </div>
                )}

                <div
                  className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-neutral-800 text-white rounded-br-none border border-neutral-700 shadow-md'
                      : m.mode === 'grok'
                      ? 'bg-gradient-to-br from-neutral-900 to-orange-950/40 border border-orange-500/30 text-neutral-100 rounded-bl-none shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                      : 'bg-neutral-900/90 border border-cyan-500/25 text-neutral-100 rounded-bl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-sans">{m.text}</p>

                  <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-neutral-400 font-mono">
                    {m.mode && (
                      <span className={m.mode === 'grok' ? 'text-orange-400 font-semibold' : 'text-cyan-400 font-semibold'}>
                        {m.mode === 'grok' ? '⚡️ Grok AI' : '🧠 Gemini AI'}
                      </span>
                    )}
                    <span>•</span>
                    <span>{m.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-xs text-cyan-400 font-mono animate-pulse pl-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-[10px] font-bold">AT</span>
              <span>Amir Temurxon (AI nusxam) javob tayyorlamoqda...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick starter chips */}
        <div className="px-4 py-2 bg-neutral-950/90 border-t border-neutral-850 flex items-center gap-2 overflow-x-auto text-xs font-mono text-neutral-400 select-none">
          <span className="shrink-0 text-cyan-400 font-bold">Mavzular:</span>
          {starterChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/40 hover:text-white transition-all text-[11px]"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-[#0c0d12] border-t border-neutral-850 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'grok'
                ? "Grok uslubidagi AI nusxangga yoz... Masalan: 'E o‘zim, bugun nima qilamiz?' 😂"
                : "Amir Temurxon (AI nusxangizga) xabar yozing..."
            }
            disabled={isLoading}
            className="flex-1 bg-black/80 border border-neutral-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-3 rounded-2xl font-bold transition-all shrink-0 ${
              mode === 'grok'
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:brightness-110 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
            } disabled:opacity-40`}
          >
            {isLoading ? (
              <Sparkles className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
