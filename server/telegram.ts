import fs from 'fs';
import path from 'path';
import { db, Memory } from './db.js';
import { classifyContent } from './gemini.js';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
    caption?: string;
  };
}

const BOT_CONFIG_PATH = path.resolve(process.cwd(), 'data/bot-config.json');

export function getBotToken(): string {
  if (process.env.TELEGRAM_BOT_TOKEN) {
    return process.env.TELEGRAM_BOT_TOKEN.trim();
  }
  try {
    if (fs.existsSync(BOT_CONFIG_PATH)) {
      const raw = fs.readFileSync(BOT_CONFIG_PATH, 'utf-8');
      const cfg = JSON.parse(raw);
      if (cfg.botToken) {
        return cfg.botToken.trim();
      }
    }
  } catch (err) {
    console.warn('Could not read bot config:', err);
  }
  return '8893800681:AAHZjQDQIkuKNZEUROpbTBoOn28Jv3jHgH4';
}

export async function sendTelegramMessage(chatId: number | string, text: string, replyToMessageId?: number) {
  const token = getBotToken();
  if (!token) return;

  try {
    const payload: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    };
    if (replyToMessageId) {
      payload.reply_to_message_id = replyToMessageId;
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Telegram sendMessage failed:', errText);
    }
  } catch (err) {
    console.error('Error sending message to Telegram:', err);
  }
}

export async function processIncomingMessage(
  rawText: string,
  source: string = 'Telegram Bot'
): Promise<{
  memory: Memory;
  botReply: string;
}> {
  const text = rawText.trim();
  if (!text) {
    throw new Error('Matn bo‘sh bo‘lishi mumkin emas.');
  }

  // 1. AI Content Classification and Privacy Detection
  const classified = await classifyContent(text);

  // 2. Format today's date in Uzbek
  const now = new Date();
  const monthsUz = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
  ];
  const dateStr = `${now.getDate()}-${monthsUz[now.getMonth()]}, ${now.getFullYear()}`;

  // 3. Save to knowledge base (automatically syncs to Firestore)
  const memory = await db.add({
    title: classified.title,
    content: text,
    category: classified.category,
    isPrivate: classified.isPrivate,
    source,
    tags: classified.tags,
    date: dateStr,
  });

  // 4. Generate funny Uzbek Telegram bot confirmation
  const funnyReplies = [
    `Xotirangiz ikkinchi miyaga muvaffaqiyatli saqlandi! 🧠\n📂 <b>Toifa:</b> [${classified.category}]\n🔒 <b>Holati:</b> ${classified.isPrivate ? 'MAXFIY (Parol ostida)' : 'Ochiq'}\n\n<i>"Birinchi miyangiz bemalol dam olsin, ikkinchisi eslab qoldi! 😂"</i>`,
    `Ha-a, yozib oldim! ✍️\n📂 <b>Kategoriya:</b> [${classified.category}]\n🔒 <b>Maxfiylik:</b> ${classified.isPrivate ? '🔐 Maxfiy' : '🔓 Ochiq'}\n\nEndi saytdan: <i>"Miyamdan nima kerak edi?.."</i> deb bemalol qidiraverasiz! 🧠`,
    `Qabul qilindi va neyronlarga muhrlandi! ⚡️\n📂 <b>Papka:</b> [${classified.category}]\n🏷 <b>Teglar:</b> ${classified.tags.join(', ')}\n\nKerak bo‘lganida darrov topib beraman. 😂`,
  ];
  const botReply = funnyReplies[Math.floor(Math.random() * funnyReplies.length)];

  return { memory, botReply };
}

// Handler for single update (from webhook or long-polling)
export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;
  const fromName = message.from?.first_name || message.from?.username || 'Foydalanuvchi';
  const username = message.from?.username ? `@${message.from.username}` : fromName;
  const rawText = message.text || message.caption || '';
  const text = rawText.trim();

  if (!text) {
    await sendTelegramMessage(
      chatId,
      `Menga matnli fikr, g‘oya, eslatma yoki ma'lumot yuboring. Men uni xotiramga yozib olaman! 🧠`,
      message.message_id
    );
    return;
  }

  // Handle /start command
  if (text.startsWith('/start')) {
    const welcome = `Assalomu alaykum, <b>${fromName}</b>! 🧠\n\nMen sizning <b>2-chi Miya</b>ngizman (@miya22bot).\n\nMenga istalgan fikr, uchrashuv, parol, qiziq havola yoki biznes g‘oyalaringizni yozib yuboring.\n\n✨ <b>Qanday ishlaydi:</b>\n1. Menga shunchaki xabar yozasiz (masalan: <i>"MobiCom logo qora va qizil rangda bo'ladi"</i>)\n2. Men uni avtomatik toifalarga ajrataman va neyronlarga saqlayman.\n3. Saytga kirib, hatto noaniq savol bilan ham qidirsangiz (masalan: <i>"Mobikom ranglari nima edi?"</i>) — darhol topib beraman! 😂\n\nQani, birinchi fikringizni yozib ko‘ring! 👇`;
    await sendTelegramMessage(chatId, welcome, message.message_id);
    return;
  }

  // Handle /help command
  if (text.startsWith('/help')) {
    const help = `🧠 <b>2-chi Miya Bot Qo'llanmasi</b>\n\n• Menga to'g'ridan-to'g'ri istalgan gap yozing — men uni xotiraga qo'shaman.\n• Maxfiy so'zlar (parol, pin-kod, karta) avtomatik ravishda qulflangan holatda saqlanadi.\n• /stat — Miya statistikasi va xotiralar soni.\n• /clear — Barcha xotiralarni tozalash.`;
    await sendTelegramMessage(chatId, help, message.message_id);
    return;
  }

  // Handle /stat command
  if (text.startsWith('/stat')) {
    const stats = db.getStats();
    const statMsg = `📊 <b>Miya Statistikasi:</b>\n\n🧠 Jami xotiralar: <b>${stats.total} ta</b>\n🔒 Maxfiy: <b>${stats.privateCount} ta</b>\n🔓 Ochiq: <b>${stats.publicCount} ta</b>\n⚡️ ${stats.funnyStatus}`;
    await sendTelegramMessage(chatId, statMsg, message.message_id);
    return;
  }

  // Handle /clear command
  if (text === '/clear') {
    await db.clearAll();
    await sendTelegramMessage(chatId, `🧹 Barcha xotiralar o‘chirildi! Miya hozircha bo‘m-bo‘sh holatga keltirildi. Yangi fikrlaringizni kutmoqdaman! 🧠`, message.message_id);
    return;
  }

  // Normal text memory saving
  try {
    const source = `Telegram: ${username}`;
    const result = await processIncomingMessage(text, source);
    await sendTelegramMessage(chatId, result.botReply, message.message_id);
  } catch (err: any) {
    console.error('Failed to process message from Telegram:', err);
    await sendTelegramMessage(
      chatId,
      `Kechirasiz, xotirani saqlashda kutilmagan xatolik yuz berdi. Iltimos qaytadan urinib ko'ring.`,
      message.message_id
    );
  }
}

// Background Telegram Long Poller
let isPolling = false;
let pollingAbortController: AbortController | null = null;
let lastUpdateId = 0;

export function startTelegramPolling() {
  const token = getBotToken();
  if (!token) {
    console.warn('No Telegram Bot token provided, skipping polling.');
    return;
  }

  if (isPolling) {
    console.log('Telegram polling is already active.');
    return;
  }

  isPolling = true;
  pollingAbortController = new AbortController();
  console.log('🚀 Starting Telegram Bot polling for @miya22bot...');

  (async () => {
    while (isPolling) {
      try {
        const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`;
        const res = await fetch(url, {
          signal: pollingAbortController?.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn('getUpdates HTTP error:', res.status, errText);
          await new Promise((r) => setTimeout(r, 4000));
          continue;
        }

        const data = await res.json();
        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            lastUpdateId = Math.max(lastUpdateId, update.update_id);
            try {
              await handleTelegramUpdate(update);
            } catch (uErr) {
              console.error('Error handling Telegram update:', uErr);
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Telegram polling stopped cleanly.');
          break;
        }
        console.warn('Telegram polling network error, retrying in 3s...', err.message);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  })();
}

export function stopTelegramPolling() {
  isPolling = false;
  if (pollingAbortController) {
    pollingAbortController.abort();
    pollingAbortController = null;
  }
}

// Webhook compatibility
export async function handleTelegramWebhook(update: TelegramUpdate) {
  await handleTelegramUpdate(update);
  return { ok: true };
}
