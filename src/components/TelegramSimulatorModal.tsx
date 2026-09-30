import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, CheckCheck, X, Sparkles, Copy, Check, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';

interface TelegramMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  category?: string;
  isPrivate?: boolean;
}

interface TelegramSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryAdded?: () => void;
}

export const TelegramSimulatorModal: React.FC<TelegramSimulatorModalProps> = ({
  isOpen,
  onClose,
  onMemoryAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'webhook'>('chat');
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<TelegramMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: "Salom! Men sizning “2-chi Miya” Telegram botingizman 🧠\n\nMenga istalgan fikr, eslatma, g‘oya, uchrashuv yoki parollarni yozing. Men ularni tahlil qilib, toifaga ajratib, saytda qidiriladigan qilib saqlayman! 😂",
      time: '09:41',
    },
  ]);
  const [webhookInfo, setWebhookInfo] = useState<{ webhookUrl: string; instructions: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/telegram/info')
        .then((r) => r.json())
        .then((data) => setWebhookInfo(data))
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const userMsgText = inputText.trim();
    setInputText('');
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message immediately
    const userMsgId = 'usr-' + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: userMsgText,
        time: nowTime,
      },
    ]);

    setIsSending(true);

    try {
      const res = await fetch('/api/telegram/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: userMsgText,
          sender: 'Mening_Hisobim',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-' + Date.now(),
            sender: 'bot',
            text: data.botReply,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            category: data.memory?.category,
            isPrivate: data.memory?.isPrivate,
          },
        ]);
        if (onMemoryAdded) onMemoryAdded();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: 'bot-err-' + Date.now(),
            sender: 'bot',
            text: 'Xatolik: Xabarni qabul qilishda bot biroz chalkashdi 😂 Qaytadan urinib ko‘ring.',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-err-' + Date.now(),
          sender: 'bot',
          text: 'Server bilan aloqa uzildi.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyWebhook = () => {
    if (!webhookInfo?.webhookUrl) return;
    navigator.clipboard.writeText(webhookInfo.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleTelegramPrompts = [
    'Bugun MobiCom uchun qora-qizil branding g‘oyasi yoqdi.',
    'Ertaga soat 16:00 da Jamshid bilan uchrashuv bor.',
    'Yangi bank kartasi paroli: 6729 (Maxfiy saqla!).',
    'Osh uchun dumba yog‘ini eritib zira solish esdan chiqmasin.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0c0d12] border border-neutral-800 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-850 bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">2 miya</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Jonli ulandi
                </span>
              </div>
              <a
                href="https://t.me/miya22bot"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-400 hover:underline font-mono flex items-center gap-1"
              >
                <span>@miya22bot</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeTab === 'chat' ? 'bg-sky-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Simulyator
              </button>
              <button
                onClick={() => setActiveTab('webhook')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeTab === 'webhook' ? 'bg-sky-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Webhook
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real Bot Active Banner */}
        <div className="px-5 py-2.5 bg-sky-950/30 border-b border-sky-850/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>Bot faol va ulandi! Istalgan vaqtda Telegramdan xabar yozishingiz mumkin:</span>
          </div>
          <a
            href="https://t.me/miya22bot"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-xs transition-colors shrink-0 shadow-sm"
          >
            <span>@miya22bot ni ochish</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Tab 1: Chat Simulator */}
        {activeTab === 'chat' ? (
          <>
            {/* Message feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#08090c] min-h-[300px]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-sky-600 text-white rounded-br-none shadow-md'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-bl-none shadow-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>

                    {m.category && (
                      <div className="mt-2 pt-2 border-t border-neutral-800 flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-sky-400">📂 {m.category}</span>
                        {m.isPrivate && <span className="text-red-400">🔒 Maxfiy</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-neutral-400 font-mono">
                      <span>{m.time}</span>
                      {m.sender === 'user' && <CheckCheck className="w-3.5 h-3.5 text-sky-200" />}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Test Prompt suggestions */}
            <div className="px-4 py-2 bg-neutral-950/80 border-t border-neutral-850 flex items-center gap-2 overflow-x-auto text-[11px] font-mono text-neutral-400 select-none">
              <span className="shrink-0 text-sky-400">Sinash:</span>
              {sampleTelegramPrompts.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setInputText(p)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:text-white transition-colors"
                >
                  {p.slice(0, 26)}...
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-neutral-900/90 border-t border-neutral-850 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Telegram orqali fikr yuboring..."
                disabled={isSending}
                className="flex-1 bg-black/70 border border-neutral-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500 transition-colors font-medium"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-black font-bold disabled:opacity-50 transition-all shrink-0"
              >
                {isSending ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </>
        ) : (
          /* Tab 2: Live Webhook & Integration info */
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-mono">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-neutral-400 text-xs">
                <span>Webhook URL manzili (Jonli qabul qiluvchi):</span>
                <button
                  onClick={handleCopyWebhook}
                  className="flex items-center gap-1 text-sky-400 hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Nusxa olindi!' : 'Nusxalash'}</span>
                </button>
              </div>

              <div className="p-2.5 rounded-xl bg-black border border-neutral-800 text-emerald-400 select-all break-all">
                {webhookInfo?.webhookUrl || 'Yuklanmoqda...'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <Terminal className="w-4 h-4 text-sky-400" />
                <span>Haqiqiy BotFather botini qanday ulash mumkin?</span>
              </div>

              <ol className="list-decimal list-inside space-y-2 text-neutral-300 leading-relaxed">
                <li>Telegramda <b>@BotFather</b> ga o‘ting va <code className="text-sky-400">/newbot</code> buyrug‘ini bering.</li>
                <li>Bot nomi va username'ini tanlang (masalan, <i>MeningMiyam_bot</i>).</li>
                <li>Olingan <b>HTTP API Token</b>'ni saqlab qo‘ying.</li>
                <li>
                  Quyidagi havolani brauzerda oching:
                  <div className="mt-1 p-2 rounded bg-black text-[11px] text-yellow-400 break-all select-all">
                    https://api.telegram.org/bot&lt;SIZNING_TOKENINGIZ&gt;/setWebhook?url={encodeURIComponent(webhookInfo?.webhookUrl || '')}
                  </div>
                </li>
                <li>Bo‘ldi! Endi Telegram botingizga yozgan har bir xabar avtomatik 2-chi Miyangizga saqlanadi.</li>
              </ol>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Har bir xabar AI yordamida avtomatik tahlil qilinadi va maxfiyligi himoyalanadi!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
