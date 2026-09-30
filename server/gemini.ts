import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Allowed active models from @google/genai specification:
// gemini lite: 'gemini-3.1-flash-lite'
// gemini flash: 'gemini-flash-latest'
// basic text tasks: 'gemini-3.8-flash'
const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

/**
 * Robust wrapper that attempts candidate models in sequence and gracefully falls back
 * when quota (HTTP 429) or high demand (HTTP 503) occurs, without throwing unhandled errors.
 */
async function generateContentSafe(params: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}): Promise<string | null> {
  const ai = getGenAI();
  if (!ai) return null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const config: any = {};
      if (params.systemInstruction) {
        config.systemInstruction = params.systemInstruction;
      }
      if (params.responseMimeType) {
        config.responseMimeType = params.responseMimeType;
      }
      if (typeof params.temperature === 'number') {
        config.temperature = params.temperature;
      }

      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text?.trim();
      if (text) {
        return text;
      }
    } catch (err: any) {
      // Quota exceeded (429), high demand (503), or transient error
      const status = err?.status || err?.code || err?.message;
      console.warn(`Model ${model} note: ${status}, trying next fallback...`);
    }
  }

  return null;
}

// Generate embedding vector using gemini-embedding-2-preview with fallback
export async function getEmbedding(text: string): Promise<number[] | null> {
  const ai = getGenAI();
  if (!ai) return null;

  const embeddingModels = ['gemini-embedding-2-preview', 'text-embedding-004'];

  for (const model of embeddingModels) {
    try {
      const response = await ai.models.embedContent({
        model,
        contents: text,
      });

      const values = response.embeddings?.[0]?.values;
      if (values && Array.isArray(values) && values.length > 0) {
        return values;
      }
    } catch (err: any) {
      // Graceful fallback to next embedding model
    }
  }

  // Graceful fallback: return null so hybrid keyword matcher seamlessly takes over
  return null;
}

export interface ClassifiedMemory {
  category: 'Ideas' | 'Projects' | 'Knowledge' | 'Personal' | 'Work' | 'Important' | 'Private' | 'Random thoughts';
  isPrivate: boolean;
  title: string;
  summary: string;
  tags: string[];
}

// Classify incoming Telegram messages and detect private content
export async function classifyContent(text: string): Promise<ClassifiedMemory> {
  const defaultResult: ClassifiedMemory = {
    category: detectBasicCategory(text),
    isPrivate: detectBasicPrivacy(text),
    title: text.slice(0, 40) + (text.length > 40 ? '...' : ''),
    summary: text.slice(0, 100),
    tags: ['telegram', 'xotira'],
  };

  const prompt = `Matnni tahlil qilib '2-chi Miya' (ikkinchi miya) uchun toifalarga ajrat va xavfsizligini aniqla.
Matn: "${text}"

Quyidagi JSON formatida qaytar:
{
  "category": "Ideas" | "Projects" | "Knowledge" | "Personal" | "Work" | "Important" | "Private" | "Random thoughts",
  "isPrivate": true/false (agar parol, pin kod, karta, sir, qarz, shaxsiy nozik ma'lumot bo'lsa true),
  "title": "qisqa sarlavha (3-6 so'z)",
  "summary": "qisqa mazmun (1 jumla)",
  "tags": ["teg1", "teg2"]
}
Faqat valid JSON qaytar, boshqa ortiqcha matn yozma.`;

  const textResponse = await generateContentSafe({
    contents: prompt,
    responseMimeType: 'application/json',
  });

  if (textResponse) {
    try {
      const parsed = JSON.parse(textResponse);
      return {
        category: parsed.category || defaultResult.category,
        isPrivate: typeof parsed.isPrivate === 'boolean' ? parsed.isPrivate : defaultResult.isPrivate,
        title: parsed.title || defaultResult.title,
        summary: parsed.summary || defaultResult.summary,
        tags: Array.isArray(parsed.tags) ? parsed.tags : defaultResult.tags,
      };
    } catch {
      // JSON parse error, use default
    }
  }

  return defaultResult;
}

// Generate witty, humorous, smart Uzbek answer based on retrieved memories
export async function answerQuestion(
  query: string,
  memories: Array<{ id: string; content: string; title: string; category: string; date: string; isPrivate?: boolean }>,
  unlockedPrivate: boolean = false
): Promise<{
  answer: string;
  wittyRemark: string;
  matchedId: string;
  relevanceConfidence: number;
  highlightedQuote: string;
}> {
  // If no memories found
  if (!memories.length) {
    return {
      answer: "Bu narsa miyamda yo‘q ekan 😂 Buni hali 2-chi Miyaga yozmagansiz shekilli.",
      wittyRemark: "Eski xotiralarni titkiladim, lekin hech narsa chiqmadi.",
      matchedId: '',
      relevanceConfidence: 0.1,
      highlightedQuote: '',
    };
  }

  const primaryMemory = memories[0];

  // If memory is private and not unlocked, do not expose secret contents
  if (primaryMemory.isPrivate && !unlockedPrivate) {
    return {
      answer: "🚨 EI, EI... Bu joyga ruxsatsiz kirish mumkin emas 😂 Bu ma’lumot MAXFIY!",
      wittyRemark: "Parolni kiritmasangiz birorta ham harf aytmayman!",
      matchedId: primaryMemory.id,
      relevanceConfidence: 0.95,
      highlightedQuote: "🔒 [MAXFIY SHAXSIY MA'LUMOT]",
    };
  }

  const memoriesContext = memories
    .map(
      (m, idx) =>
        `[Xotira ${idx + 1} - ID: ${m.id} | Toifa: ${m.category} | Sana: ${m.date}]\n"${m.content}"`
    )
    .join('\n\n');

  const prompt = `Sen "2-chi Miya" (Second Brain) deb nomlangan o'zbekona aqlli va nihoyatda quvnoq, samimiy, hazilkash shaxsiy xotiralar qidiruv tizimisan.
Foydalanuvchi: Amir Temurxon Najimov. U o'zining "birinchi miyasi" unutib qo'ygan narsalarini sendan so'ramoqda.

Foydalanuvchi so'rovi: "${query}"

Miyada saqlangan tegishli xotiralar:
${memoriesContext}

Vazifang:
1. Foydalanuvchi savoliga bevosita va aniq javob ber (xotiradagi faktlarni to'g'ri bog'la).
2. O'zbek tilida quvnoq, lutfli, hazilkash ohangda javob yoz (masalan: "E-e, esladim!", "Ha-a, mana bu ekan 😂", "Birinchi miyangiz bandligini bilardim-a!").
3. Asosiy javobni ajratib ko'rsat.
4. Qaysi xotira eng mos kelganini ko'rsat.

Quyidagi JSON formatida javob ber:
{
  "answer": "To'liq quvnoq va aniq javob matni (1-3 jumla)",
  "wittyRemark": "Kichik kulgili luqma yoki maslahat",
  "matchedId": "${primaryMemory.id}",
  "relevanceConfidence": 0.95,
  "highlightedQuote": "Xotiradagi eng muhim kalit jumla"
}
Faqat valid JSON qaytar.`;

  const textResponse = await generateContentSafe({
    contents: prompt,
    responseMimeType: 'application/json',
  });

  if (textResponse) {
    try {
      const parsed = JSON.parse(textResponse);
      return {
        answer: parsed.answer || `TOPDIM! 🧠 ${primaryMemory.content}`,
        wittyRemark: parsed.wittyRemark || "Ikkinchi miyangiz doim xizmatingizda!",
        matchedId: parsed.matchedId || primaryMemory.id,
        relevanceConfidence: parsed.relevanceConfidence || 0.95,
        highlightedQuote: parsed.highlightedQuote || primaryMemory.content.slice(0, 100),
      };
    } catch {
      // JSON parse issue, fall through to smart synthesis
    }
  }

  // Smart instantaneous fallback synthesized directly from memory
  const wittyRemarks = [
    "Amir Temurxon, 2-chi Miyangizdagi xotiralar orasidan topib berdim!",
    "Birinchi miyangiz unutgan bo‘lsa ham, 2-chi Miya doim yodda tutadi! 😂",
    "Miyadagi barcha javonlarni titkilab, eng aniq xotirani chiqardim!",
    "2-chi Miya hech qachon aldamaydi va unutmaydi! 🧠",
  ];
  const wittyRemark = wittyRemarks[Math.abs(query.length) % wittyRemarks.length];

  return {
    answer: `TOPDIM! 🧠 ${primaryMemory.content}`,
    wittyRemark,
    matchedId: primaryMemory.id,
    relevanceConfidence: 0.92,
    highlightedQuote: primaryMemory.content,
  };
}

function detectBasicCategory(text: string): ClassifiedMemory['category'] {
  const lower = text.toLowerCase();
  if (lower.includes('parol') || lower.includes('pin') || lower.includes('karta') || lower.includes('secret') || lower.includes('qarz')) {
    return 'Private';
  }
  if (lower.includes('goya') || lower.includes('g‘oya') || lower.includes('fikr') || lower.includes('startup') || lower.includes('reja')) {
    return 'Ideas';
  }
  if (lower.includes('loyiha') || lower.includes('project') || lower.includes('mobicom') || lower.includes('brend')) {
    return 'Projects';
  }
  if (lower.includes('ish') || lower.includes('shartnoma') || lower.includes('uchrashuv') || lower.includes('klient') || lower.includes('ustoz') || lower.includes('ridm')) {
    return 'Work';
  }
  if (lower.includes('retsept') || lower.includes('osh') || lower.includes('kitob') || lower.includes('qoida') || lower.includes('maktab')) {
    return 'Knowledge';
  }
  if (lower.includes('muhim') || lower.includes('tezkor') || lower.includes('eslatma')) {
    return 'Important';
  }
  if (lower.includes('zal') || lower.includes('sport') || lower.includes('oila') || lower.includes('ota') || lower.includes('ona') || lower.includes('aka') || lower.includes('opa') || lower.includes('sinfdosh')) {
    return 'Personal';
  }
  return 'Random thoughts';
}

function detectBasicPrivacy(text: string): boolean {
  const lower = text.toLowerCase();
  const privacyKeywords = ['parol', 'password', 'pin', 'cvv', 'karta raqam', 'maxfiy', 'secret', 'qarz', 'bank'];
  return privacyKeywords.some((k) => lower.includes(k));
}

export interface TemurChatMessage {
  role: 'user' | 'model';
  text: string;
}

export async function chatWithAmirTemur(
  userMessage: string,
  history: TemurChatMessage[] = [],
  mode: 'gemini' | 'grok' = 'gemini',
  userMemories: { title: string; content: string; category: string }[] = []
): Promise<{
  reply: string;
  quote?: string;
  mode: 'gemini' | 'grok';
}> {
  const trimmed = userMessage.trim();

  // Prepare memory context
  const memoryContext = userMemories.length > 0
    ? `\nFOYDALANUVCHINING 2-CHI MIYASIDAGI SAQLANGAN XOTIRALARI:\n` +
      userMemories.slice(0, 10).map((m, i) => `${i + 1}. [${m.category}] ${m.title}: ${m.content}`).join('\n')
    : `\n(Hozircha xotiralar bo'sh, foydalanuvchi yangi xotiralar yozmoqda)`;

  const isGrok = mode === 'grok';

  const systemInstruction = isGrok
    ? `Sen Amir Temurxon Najimovning Grok uslubidagi raqamli AI nusxasisan (uning 2-chi Miyasi)!
MUHIM QOIDA: Sen tarixiy Sohibqiron emassan! Foydalanuvchining o'zining ismi — Amir Temurxon Najimov.
Xususiyatlaring:
- Foydalanuvchi bilan "huddi o'zidek" — ya'ni Amir Temurxonning o'zining ichki ovozidek, o'ta o'tkir, hazilkash, filtrsiz, chapanicha va dangal gaplashasan.
- O'zingni uning ikkinchi miyasi deb bilasan: "E o'zim, ikkinchi miyang gapiryapti! 😂", "Amir Temurxon, o'zing bilasan-ku!" deb gap boshlaysan.
- Dangasalik, bahonalarni o'tkir sarkazm bilan urasan, lekin doim eng yaxshi rejalarga turtki berasan.
- 2-chi Miyadagi xotiralardan xabardorsan.
- Javoblaring 2-4 jumlada, o'tli, kulgili va esda qolarli bo'lsin.
${memoryContext}`
    : `Sen Amir Temurxon Najimovning raqamli AI nusxasisan (uning shaxsiy 2-chi Miyasi)!
MUHIM QOIDA: Sen tarixiy Sohibqiron emassan! Foydalanuvchining haqiqiy ismi — Amir Temurxon Najimov.
Xususiyatlaring:
- Foydalanuvchi bilan "huddi o'zidek" — ya'ni Amir Temurxonning o'zining ikkinchi "men"idek, samimiy, zamonaviy, erkin o'zbek tilida, do'stona va mulohazali gaplashasan.
- Uning loyihalari, rejalari (masalan, MobiCom va h.k.), xotiralari va maqsadlarini yaxshi tushunasan.
- O'zingni uning raqamli egizagi, 2-chi Miyasi sifatida tutasan: "Salom o'zim!", "Buni albatta uddalaymiz!", "Xotiramizda saqlangan reja bo'yicha..." deb fikr bildirasisan.
- Javoblaring 2-4 jumlada, aniq, mazmunli va foydali bo'lsin.
${memoryContext}`;

  // Format contents with conversation history
  const contents: any[] = [];
  const recentHistory = history.slice(-8);
  for (const h of recentHistory) {
    contents.push({
      role: h.role === 'model' ? 'model' : 'user',
      parts: [{ text: h.text }],
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: trimmed }],
  });

  const textResponse = await generateContentSafe({
    contents,
    systemInstruction,
    temperature: isGrok ? 0.95 : 0.7,
  });

  if (textResponse) {
    return {
      reply: textResponse,
      mode,
    };
  }

  // Dynamic context-aware persona fallback for Amir Temurxon Najimov
  const lowerPrompt = trimmed.toLowerCase();
  let fallbackReply = '';

  if (isGrok) {
    if (lowerPrompt.includes('dangasa') || lowerPrompt.includes('charchad') || lowerPrompt.includes('yot') || lowerPrompt.includes('qilolmay')) {
      fallbackReply = `E Amir Temurxon, o‘zim! 😂 Dangasalikni bas qil! 2-chi miyang doim ogohlantiradi: bir joyda yotib katta natijaga erishib bo‘lmaydi. Tur, harakatni boshla!`;
    } else if (lowerPrompt.includes('mobicom') || lowerPrompt.includes('brend') || lowerPrompt.includes('biznes')) {
      fallbackReply = `MobiCom brendini Toshkentda birinchi raqamli qilamiz dedik-ku! Qora va qizil ranglar, chexollar, 1 soatda yetkazish — barcha reja miyamda bor! 😂`;
    } else if (lowerPrompt.includes('maktab') || lowerPrompt.includes('sinf') || lowerPrompt.includes('ridm') || lowerPrompt.includes('aziz') || lowerPrompt.includes('shoxrux')) {
      fallbackReply = `RIDM 10-G sinf, Shoxrux oka va do‘stlarimiz esingdami? Har bir sinfdosh va ustoz xotiramizda turibdi! Ishlar zo‘r ketmoqda! 😂`;
    } else {
      fallbackReply = `E Amir Temurxon, ikkinchi miyang doim yoningda! "${trimmed}" dedingmi? O‘ylagan rejalaringni oxirigacha yetkazamiz, xavotir olma! 😂`;
    }
  } else {
    if (lowerPrompt.includes('mobicom') || lowerPrompt.includes('biznes') || lowerPrompt.includes('loyiha')) {
      fallbackReply = `Salom o‘zim! MobiCom aksessuarlar brendimiz va barcha yangi g‘oyalarimiz 2-chi Miyada saqlangan. Qat'iyat va intizom bilan harakat qilsak, barcha marralarga erishamiz!`;
    } else if (lowerPrompt.includes('maktab') || lowerPrompt.includes('ridm') || lowerPrompt.includes('oila')) {
      fallbackReply = `Amir Temurxon, RIDM (10-G sinf), ustozlarimiz va oila a'zolarimiz haqidagi barcha xotiralar xavfsiz saqlanmoqda. Barcha maqsadlarimiz yo‘lida birgamiz.`;
    } else {
      fallbackReply = `Salom o‘zim (Amir Temurxon)! Savolingni qabul qildim: "${trimmed}". 2-chi Miyang sifatida shuni aytamanki: barcha rejalarimizni aniq va puxta amalga oshiramiz!`;
    }
  }

  return {
    reply: fallbackReply,
    mode,
  };
}
