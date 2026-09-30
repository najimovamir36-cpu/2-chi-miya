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

// Generate embedding vector using gemini-embedding-2-preview
export async function getEmbedding(text: string): Promise<number[] | null> {
  const ai = getGenAI();
  if (!ai) return null;
  try {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2-preview',
      contents: text,
    });

    const values = response.embeddings?.[0]?.values;
    if (values && Array.isArray(values) && values.length > 0) {
      return values;
    }
    return null;
  } catch (error) {
    console.warn('Embedding error with gemini-embedding-2-preview, falling back:', error);
    try {
      // Fallback attempt with text-embedding-004
      const fallbackResponse = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
      });
      return fallbackResponse.embeddings?.[0]?.values || null;
    } catch (e2) {
      console.error('All embedding attempts failed:', e2);
      return null;
    }
  }
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
  const ai = getGenAI();
  const defaultResult: ClassifiedMemory = {
    category: detectBasicCategory(text),
    isPrivate: detectBasicPrivacy(text),
    title: text.slice(0, 40) + (text.length > 40 ? '...' : ''),
    summary: text.slice(0, 100),
    tags: ['telegram', 'xotira'],
  };

  if (!ai) return defaultResult;

  try {
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      category: parsed.category || defaultResult.category,
      isPrivate: typeof parsed.isPrivate === 'boolean' ? parsed.isPrivate : defaultResult.isPrivate,
      title: parsed.title || defaultResult.title,
      summary: parsed.summary || defaultResult.summary,
      tags: Array.isArray(parsed.tags) ? parsed.tags : defaultResult.tags,
    };
  } catch (error) {
    console.warn('Gemini classification error, using fallback:', error);
    return defaultResult;
  }
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
  const ai = getGenAI();

  // If no memories found
  if (!memories.length) {
    return {
      answer: "Bu narsa miyamda yo‘q ekan 😂 Buni hech qachon yozmagansan shekilli.",
      wittyRemark: "Eski xotiralarni titkiladim, lekin hech narsa chiqmadi.",
      matchedId: '',
      relevanceConfidence: 0.1,
      highlightedQuote: '',
    };
  }

  const primaryMemory = memories[0];

  // If memory is private and not unlocked, do not generate answer using its secret contents
  if (primaryMemory.isPrivate && !unlockedPrivate) {
    return {
      answer: "🚨 EI, EI... Bu joyga ruxsatsiz kirish mumkin emas 😂 Bu ma’lumot MAXFIY!",
      wittyRemark: "Parolni kiritmasang birorta ham harf aytmayman!",
      matchedId: primaryMemory.id,
      relevanceConfidence: 0.95,
      highlightedQuote: "🔒 [MAXFIY SHAXSIY MA'LUMOT]",
    };
  }

  if (!ai) {
    // Graceful offline fallback
    return {
      answer: `Ha-a, mana bu ekan 😂: ${primaryMemory.content}`,
      wittyRemark: "Birinchi miyang unutgan bo'lsa ham, ikkinchi miyang doim yodda tutadi!",
      matchedId: primaryMemory.id,
      relevanceConfidence: 0.88,
      highlightedQuote: primaryMemory.content.slice(0, 80),
    };
  }

  try {
    const memoriesContext = memories
      .map(
        (m, idx) =>
          `[Xotira ${idx + 1} - ID: ${m.id} | Toifa: ${m.category} | Sana: ${m.date}]\n"${m.content}"`
      )
      .join('\n\n');

    const prompt = `Sen "2-chi Miya" (Second Brain) deb nomlangan o'zbekona aqlli va nihoyatda quvnoq, samimiy, hazilkash shaxsiy xotiralar qidiruv tizimisan.
Foydalanuvchi o'zining "birinchi miyasi" unutib qo'ygan narsalarini sendan so'ramoqda.

Foydalanuvchi so'rovi: "${query}"

Miyada saqlangan tegishli xotiralar:
${memoriesContext}

Vazifang:
1. Foydalanuvchi savoliga bevosita va aniq javob ber (o'xshash ma'nolarni tushunib, semantik bog'la: masalan 'MobiCom logo ranglari' va 'MobiCom telefon aksessuarlar brendi' bir narsa ekanini bil).
2. O'zbek tilida quvnoq, lutfli, hazilkash ohangda javob yoz (masalan: "E-e, esladim!", "Ha-a, mana bu ekan 😂", "Birinchi miyang bandligini bilardim-a!").
3. Asosiy javobni ajratib ko'rsat.
4. Qaysi xotira eng mos kelganini ko'rsat.

Quyidagi JSON formatida javob ber:
{
  "answer": "To'liq quvnoq va aniq javob matni (1-3 jumla)",
  "wittyRemark": "Kichik kulgili luqma yoki maslahat (masalan: 'Yana unutib qo'ymaslik uchun bir joyga yozib qo'y 😂')",
  "matchedId": "${primaryMemory.id}",
  "relevanceConfidence": 0.95,
  "highlightedQuote": "Xotiradagi eng muhim kalit jumla"
}
Faqat valid JSON qaytar.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      answer: parsed.answer || `Topdim! 🧠: ${primaryMemory.content}`,
      wittyRemark: parsed.wittyRemark || "Ikkinchi miyang doim xizmatingda!",
      matchedId: parsed.matchedId || primaryMemory.id,
      relevanceConfidence: parsed.relevanceConfidence || 0.9,
      highlightedQuote: parsed.highlightedQuote || primaryMemory.content.slice(0, 100),
    };
  } catch (error) {
    console.error('Gemini answer generation error:', error);
    return {
      answer: `TOPDIM! 🧠 ${primaryMemory.content}`,
      wittyRemark: "Miya biroz qizib ketdi, lekin baribir topib berdim 😂",
      matchedId: primaryMemory.id,
      relevanceConfidence: 0.85,
      highlightedQuote: primaryMemory.content,
    };
  }
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
  if (lower.includes('ish') || lower.includes('shartnoma') || lower.includes('uchrashuv') || lower.includes('klient')) {
    return 'Work';
  }
  if (lower.includes('retsept') || lower.includes('osh') || lower.includes('kitob') || lower.includes('qoida')) {
    return 'Knowledge';
  }
  if (lower.includes('muhim') || lower.includes('tezkor') || lower.includes('eslatma')) {
    return 'Important';
  }
  if (lower.includes('zal') || lower.includes('sport') || lower.includes('salomatlik') || lower.includes('uy')) {
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
  const ai = getGenAI();
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

  if (!ai) {
    if (isGrok) {
      return {
        reply: `E Amir Temurxon, o'zim! "${trimmed}" dedingmi? 😂 Ikkinchi miyang doim yoningda! Qani, bahonani yig'ishtirib harakatni boshlaylik!`,
        mode: 'grok',
      };
    }
    return {
      reply: `Salom o'zim! Savolingni qabul qildim: "${trimmed}". 2-chi Miyang sifatida shuni aytamanki, har bir maqsadimizga intizom va aniq reja bilan erishamiz!`,
      mode: 'gemini',
    };
  }

  try {
    // Format contents with conversation history
    const contents: any[] = [];
    
    // Add history (max 8 past messages)
    const recentHistory = history.slice(-8);
    for (const h of recentHistory) {
      contents.push({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: trimmed }],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: isGrok ? 1.0 : 0.7,
      },
    });

    const reply = response.text?.trim() || (isGrok
      ? "E o‘zim (Amir Temurxon), internet bir oz chalg‘idi, lekin 2-chi miyang doim sen bilan! 😂"
      : "Amir Temurxon, 2-chi Miyang sifatida shuni aytamanki: barcha rejalarimizni intizom bilan amalga oshiramiz!");

    return {
      reply,
      mode,
    };
  } catch (error) {
    console.error('Amir Temur chat error:', error);
    return {
      reply: isGrok
        ? `Xullas, Amir Temurxon: "${trimmed}" dedingmi? 😂 Dangasalikni yig'ishtirib, o'ylagan ishimizni oxiriga yetkazaylik!`
        : `Amir Temurxon, 2-chi Miyang doim yoningda. Har bir qadamni puxta o'ylab, maqsadga qarab yuramiz!`,
      mode,
    };
  }
}

