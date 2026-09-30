import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { answerQuestion, chatWithAmirTemur } from './server/gemini.js';
import { handleTelegramWebhook, processIncomingMessage, startTelegramPolling } from './server/telegram.js';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json());

// API Routes

// 1. Health check & Brain status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'Miya online. Hozircha ishlayapti.',
    timestamp: Date.now(),
  });
});

// 2. Semantic Search Endpoint
app.post('/api/search', async (req, res) => {
  try {
    const { query, password } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Qidiruv so‘rovi bo‘sh bo‘lishi mumkin emas.' });
    }

    const trimmed = query.trim();

    // Check if password provided unlocks private memories
    let isPrivateUnlocked = false;
    if (password) {
      const verify = db.verifyPrivatePassword(password);
      isPrivateUnlocked = verify.success;
    }

    // Perform hybrid semantic vector search
    const results = await db.search(trimmed, 4);

    if (results.length === 0) {
      return res.json({
        found: false,
        answer: "Bu narsa miyamda yo‘q ekan 😂 Buni hech qachon yozmagansan shekilli.",
        wittyRemark: "Eski xotiralarni titkiladim, lekin topolmadim.",
        primaryMemory: null,
        similarMemories: [],
        relevanceConfidence: 0,
        isPrivate: false,
      });
    }

    const topResult = results[0];
    const isTopPrivate = topResult.memory.isPrivate;

    // If top result is private and NOT unlocked
    if (isTopPrivate && !isPrivateUnlocked) {
      return res.json({
        found: true,
        isPrivate: true,
        isUnlocked: false,
        category: topResult.memory.category,
        date: topResult.memory.date,
        source: topResult.memory.source,
        score: topResult.score,
        memoryId: topResult.memory.id,
        answer: "🚨 EI, EI... Bu joyga ruxsatsiz kirish mumkin emas 😂",
        wittyRemark: "Bu ma’lumot MAXFIY. Ko‘rish uchun parolni kiriting!",
        highlightedQuote: "🔒 [MAXFIY SHAXSIY MA'LUMOT]",
        similarMemories: results.slice(1).map((r) => ({
          id: r.memory.id,
          title: r.memory.title,
          category: r.memory.category,
          date: r.memory.date,
          score: r.score,
          isPrivate: r.memory.isPrivate,
          content: r.memory.isPrivate ? "🔒 [MAXFIY]" : r.memory.content,
        })),
      });
    }

    // Prepare context memories for Gemini synthesis
    const memoriesContext = results.map((r) => ({
      id: r.memory.id,
      title: r.memory.title,
      content: r.memory.content,
      category: r.memory.category,
      date: r.memory.date,
      isPrivate: r.memory.isPrivate,
    }));

    // AI synthesis
    const aiAnswer = await answerQuestion(trimmed, memoriesContext, isPrivateUnlocked);

    return res.json({
      found: true,
      isPrivate: isTopPrivate,
      isUnlocked: true,
      answer: aiAnswer.answer,
      wittyRemark: aiAnswer.wittyRemark,
      highlightedQuote: aiAnswer.highlightedQuote,
      relevanceConfidence: topResult.score || aiAnswer.relevanceConfidence,
      primaryMemory: {
        id: topResult.memory.id,
        title: topResult.memory.title,
        content: topResult.memory.content,
        category: topResult.memory.category,
        date: topResult.memory.date,
        source: topResult.memory.source,
        tags: topResult.memory.tags,
        score: topResult.score,
        isPrivate: topResult.memory.isPrivate,
      },
      similarMemories: results.slice(1).map((r) => ({
        id: r.memory.id,
        title: r.memory.title,
        category: r.memory.category,
        date: r.memory.date,
        score: r.score,
        isPrivate: r.memory.isPrivate,
        content: r.memory.isPrivate && !isPrivateUnlocked ? "🔒 [MAXFIY]" : r.memory.content,
      })),
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Miya biroz yiqilib tushdi.',
      wittyRemark: 'Miyadagi neyronlar biroz chalkashib ketdi. Yana urintirib ko‘r 😂',
    });
  }
});

// 3. Verify Private Vault Password
app.post('/api/verify-private', (req, res) => {
  const { password, memoryId } = req.body;
  const result = db.verifyPrivatePassword(password);

  if (!result.success) {
    return res.status(401).json({
      success: false,
      message: result.message,
    });
  }

  let memoryData = null;
  if (memoryId) {
    memoryData = db.getById(memoryId, true);
  }

  res.json({
    success: true,
    message: result.message,
    memory: memoryData,
  });
});

// 4. Memory Management Endpoints
app.get('/api/memories', (req, res) => {
  const password = req.headers['x-private-password'] as string;
  let includePrivate = false;
  if (password) {
    includePrivate = db.verifyPrivatePassword(password).success;
  }
  const memories = db.getAll(includePrivate);
  res.json(memories);
});

app.post('/api/memories', async (req, res) => {
  try {
    const { title, content, category, isPrivate, tags, source } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Mazmun bo‘sh bo‘lishi mumkin emas.' });
    }

    const now = new Date();
    const monthsUz = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
    const dateStr = `${now.getDate()}-${monthsUz[now.getMonth()]}, ${now.getFullYear()}`;

    const newMem = await db.add({
      title: title?.trim() || content.slice(0, 30),
      content: content.trim(),
      category: category || 'Random thoughts',
      isPrivate: Boolean(isPrivate),
      source: source || 'Veb-sayt',
      tags: Array.isArray(tags) ? tags : [],
      date: dateStr,
    });

    const { embedding, ...cleanMem } = newMem;
    res.json(cleanMem);
  } catch (error) {
    console.error('Create memory error:', error);
    res.status(500).json({ error: 'Xotirani saqlashda xatolik yuz berdi.' });
  }
});

app.put('/api/memories/:id', (req, res) => {
  const { id } = req.params;
  const updated = db.update(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Xotira topilmadi.' });
  }
  const { embedding, ...cleanUpdated } = updated;
  res.json(cleanUpdated);
});

app.delete('/api/memories/:id', (req, res) => {
  const { id } = req.params;
  const success = db.delete(id);
  if (!success) {
    return res.status(404).json({ error: 'Xotira topilmadi.' });
  }
  res.json({ success: true, message: 'Xotira muvaffaqiyatli o‘chirildi.' });
});

app.post('/api/memories/reset', (req, res) => {
  const resetMemories = db.resetToDefaults();
  res.json({ success: true, memories: resetMemories });
});

app.post('/api/memories/clear', (req, res) => {
  const emptyMemories = db.clearAll();
  res.json({ success: true, memories: emptyMemories });
});

// 5. Brain Statistics
app.get('/api/stats', (req, res) => {
  const stats = db.getStats();
  res.json(stats);
});

// 6. Telegram Bot Integration
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const result = await handleTelegramWebhook(req.body);
    res.json(result);
  } catch (err: any) {
    console.error('Telegram webhook error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Telegram Simulator Endpoint (for testing in UI)
app.post('/api/telegram/simulate', async (req, res) => {
  try {
    const { text, sender } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Xabar matnini kiriting.' });
    }
    const source = `Telegram: @${(sender || 'mening_hisobim').replace('@', '')}`;
    const result = await processIncomingMessage(text, source);
    const { embedding, ...cleanMemory } = result.memory;
    res.json({
      success: true,
      memory: cleanMemory,
      botReply: result.botReply,
    });
  } catch (err: any) {
    console.error('Telegram simulation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Amir Temur Interactive Chat (Gemini / Grok Mode)
app.post('/api/chat/amir-temur', async (req, res) => {
  try {
    const { message, history, mode } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Xabar kiritilmadi.' });
    }
    const memories = db.getAll(false).map((m) => ({
      title: m.title,
      content: m.content,
      category: m.category,
    }));
    const result = await chatWithAmirTemur(message, history || [], mode || 'gemini', memories);
    res.json(result);
  } catch (err: any) {
    console.error('Amir Temur chat endpoint error:', err);
    res.status(500).json({ error: err.message || 'Xatolik yuz berdi' });
  }
});

// Telegram Setup Info
app.get('/api/telegram/info', (req, res) => {
  const host = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const webhookUrl = `${host}/api/telegram/webhook`;
  res.json({
    webhookUrl,
    hasToken: true,
    botUsername: 'miya22bot',
    botFirstName: '2 miya',
    isPolling: true,
    botUrl: 'https://t.me/miya22bot',
    instructions: [
      "1. Telegramda @miya22bot botiga kiring.",
      "2. /start tugmasini bosing.",
      "3. Istalgan fikr, eslatma, uchrashuv yoki parolni yuboring.",
      "4. Bot xabaringizni avtomatik ravishda 2-chi Miya xotirasiga va Google Firestore bazasiga saqlaydi!",
    ],
  });
});

// Mount Vite or static server
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🧠 2-chi Miya server is running on http://0.0.0.0:${port}`);
    // Start Telegram Bot Long-Polling
    try {
      startTelegramPolling();
    } catch (botErr) {
      console.warn('Failed to auto-start Telegram bot polling:', botErr);
    }
  });
}

startServer();
