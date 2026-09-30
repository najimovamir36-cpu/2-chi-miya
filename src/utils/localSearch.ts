import { MemoryItem, SearchResultData } from '../components/ResultCard';

const SYNONYMS: Record<string, string[]> = {
  ota: ['otam', 'azamjon', 'dada'],
  otam: ['ota', 'azamjon', 'dada'],
  ona: ['onam', 'dilnoza', 'oyi'],
  onam: ['ona', 'dilnoza', 'oyi'],
  aka: ['akam', 'alisher'],
  akam: ['aka', 'alisher'],
  opa: ['opam', 'madina'],
  opam: ['opa', 'madina'],
  buvi: ['buvilarim', '68', '95'],
  buvilarim: ['buvi', '68', '95'],
  maktab: ['ridm', '10-g', '3-guruh'],
  ridm: ['maktab', 'dizayn', '10-g'],
  ustoz: ['shoxrux', 'qobil', 'zulxumor', 'safarov', 'xalilov', 'ayupova'],
  dizayn: ['grafika', 'shoxrux', 'safarov'],
  rassom: ['qobil', 'xalilov', 'chakaği'],
  mobicom: ['brend', 'chexol', 'aksessuar', 'qora', 'qizil'],
  baklashka: ['robiya', 'abdunabiyeva'],
  avtobus: ['gulchexra'],
  ziyoli: ['muborak', 'baxtiyorova'],
  mejik: ['ibrohim', 'magic'],
  massajchi: ['habibulloh', 'hamidullayev'],
};

export function localSearchMemories(
  query: string,
  memories: MemoryItem[],
  password?: string
): SearchResultData {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return {
      found: false,
      answer: "Qidirish uchun biror so'z yozing!",
      wittyRemark: "2-chi Miya sizning savolingizni kutmoqda.",
    };
  }

  const queryWords = trimmed
    .replace(/[^\w\sа-яёўқғҳ]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

  // Extend with synonyms
  const searchTerms = new Set<string>(queryWords);
  for (const w of queryWords) {
    if (SYNONYMS[w]) {
      SYNONYMS[w].forEach((s) => searchTerms.add(s));
    }
  }

  // Score memories
  const scored = memories.map((m) => {
    let score = 0;
    const text = `${m.title} ${m.content} ${m.category} ${(m.tags || []).join(' ')}`.toLowerCase();

    // Exact full query match
    if (text.includes(trimmed)) {
      score += 0.8;
    }

    // Term match
    searchTerms.forEach((term) => {
      if (text.includes(term)) {
        score += 0.35;
      }
    });

    return { memory: m, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best || best.score < 0.2) {
    return {
      found: false,
      answer: `Bu narsa miyamda yo‘q ekan 😂 Buni hali 2-chi Miyaga yozmagansiz shekilli.`,
      wittyRemark: `“${query}” bo‘yicha hech narsa topilmadi.`,
    };
  }

  const primary = best.memory;
  const isUnlocked = !primary.isPrivate || password === 'miya2025';

  if (primary.isPrivate && !isUnlocked) {
    return {
      found: true,
      isPrivate: true,
      isUnlocked: false,
      answer: `🚨 EI, EI... Bu joyga ruxsatsiz kirish mumkin emas 😂 Bu ma’lumot MAXFIY!`,
      wittyRemark: `Parolni kiritmasangiz birorta ham harf aytmayman!`,
      primaryMemory: {
        ...primary,
        content: "🔒 [MAXFIY SHAXSIY MA'LUMOT]",
      },
    };
  }

  return {
    found: true,
    isPrivate: primary.isPrivate,
    isUnlocked: true,
    answer: `TOPDIM! 🧠 ${primary.content}`,
    wittyRemark: "Amir Temurxon, 2-chi Miyangizdagi xotiralar orasidan topib berdim!",
    highlightedQuote: primary.content,
    relevanceConfidence: Math.min(0.98, 0.6 + best.score * 0.2),
    primaryMemory: primary,
  };
}

export function localAmirTemurChat(
  message: string,
  mode: 'gemini' | 'grok',
  memories: MemoryItem[]
): string {
  const lower = message.toLowerCase();
  const isGrok = mode === 'grok';

  if (isGrok) {
    if (lower.includes('dangasa') || lower.includes('charchad') || lower.includes('yotib') || lower.includes('qilolmay')) {
      return `E Amir Temurxon, o‘zim! 😂 Dangasalikni bas qil! 2-chi miyang doim ogohlantiradi: bir joyda yotib katta natijaga erishib bo‘lmaydi. Tur, harakatni boshla!`;
    }
    if (lower.includes('mobicom') || lower.includes('brend') || lower.includes('biznes')) {
      return `MobiCom brendini Toshkentda birinchi raqamli qilamiz dedik-ku! Qora va qizil ranglar, zo‘r chexollar va 1 soatda yetkazish — barcha reja miyamda bor! 😂`;
    }
    if (lower.includes('maktab') || lower.includes('ridm') || lower.includes('aziz') || lower.includes('shoxrux')) {
      return `RIDM 10-G sinf, Shoxrux oka va do‘stlarimiz esingdami? Har bir sinfdosh va ustoz xotiramizda turibdi! Ishlar zo‘r ketmoqda! 😂`;
    }
    return `E o‘zim, ikkinchi miyang gapiryapti! 😂 "${message}" dedingmi? O‘ylagan rejalaringni oxirigacha yetkazamiz, bahona yo‘q!`;
  } else {
    if (lower.includes('mobicom') || lower.includes('biznes') || lower.includes('loyiha')) {
      return `Salom o‘zim! MobiCom aksessuarlar brendimiz va barcha yangi g‘oyalarimiz 2-chi Miyada saqlangan. Qat'iyat va intizom bilan harakat qilsak, barcha marralarga erishamiz!`;
    }
    if (lower.includes('maktab') || lower.includes('ridm') || lower.includes('oila')) {
      return `Amir Temurxon, RIDM (10-G sinf), ustozlarimiz va oila a'zolarimiz haqidagi barcha xotiralar xavfsiz saqlanmoqda. Barcha maqsadlarimiz yo‘lida birgamiz.`;
    }
    return `Salom o‘zim (Amir Temurxon)! Savolingizni qabul qildim: "${message}". 2-chi Miyangiz sifatida barcha rejalaringizni intizom va puxtalik bilan amalga oshirishda doim birgamiz!`;
  }
}
