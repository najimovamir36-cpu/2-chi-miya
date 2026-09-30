import fs from 'fs';
import path from 'path';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  Firestore,
} from 'firebase/firestore';
import { getEmbedding } from './gemini.js';
import firebaseConfig from '../firebase-applet-config.json';

export interface Memory {
  id: string;
  title: string;
  content: string;
  category: 'Ideas' | 'Projects' | 'Knowledge' | 'Personal' | 'Work' | 'Important' | 'Private' | 'Random thoughts';
  isPrivate: boolean;
  source: string;
  tags: string[];
  date: string;
  createdAt: number;
  embedding?: number[];
}

export interface SearchResult {
  memory: Memory;
  score: number;
  isPrivateProtected: boolean;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'memories.json');

// Default password for private memory vault
const SERVER_PRIVATE_PASSWORD = process.env.PRIVATE_PASSWORD || 'miya2025';

// Realistic rich default memories (available for reset)
export const DEFAULT_MEMORIES: Omit<Memory, 'embedding'>[] = [
  // 18 ta Shaxsiy xotiralar (Amir Temurxon Najimov)
  {
    id: 'mem-muo205mneus6',
    title: 'Otam — Azamjon',
    content: "Oila a’zosi: Otamning ismi Azamjon.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['oila', 'ota', 'azamjon', 'qarindosh', 'yaqinlar'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640001,
  },
  {
    id: 'mem-muo2078v5hzf',
    title: 'Onam — Dilnoza',
    content: "Oila a’zosi: Onamning ismi Dilnoza.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['oila', 'ona', 'dilnoza', 'qarindosh', 'yaqinlar'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640002,
  },
  {
    id: 'mem-muo207w1hamg',
    title: 'Akam — Alisher',
    content: "Oila a’zosi: Akamning ismi Alisher.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['oila', 'aka', 'alisher', 'qarindosh', 'yaqinlar'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640003,
  },
  {
    id: 'mem-muo208hggvrd',
    title: 'Opam — Madina',
    content: "Oila a’zosi: Opamning ismi Madina.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['oila', 'opa', 'madina', 'qarindosh', 'yaqinlar'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640004,
  },
  {
    id: 'mem-muo2090ztef3',
    title: 'Buvilarim (68 yosh va 95 yosh)',
    content: "2 ta buvim bor: biri — 68 yoshda, ikkinchisi — 95 yoshda.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['oila', 'buvi', 'buvilarim', 'yosh', 'qarindosh'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640005,
  },
  {
    id: 'mem-muo209o6qnz3',
    title: 'Maktab: RIDM (10-G sinf, 3-guruh)',
    content: "Maktab: RIDM — Respublika ixtisoslashtirilgan dizayn maktabi. Sinf: 10-G. Guruh: 3-guruh. Muhim eslatma: V2B — maktab nomi emas.",
    category: 'Knowledge',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['maktab', 'ridm', '10-g', '3-guruh', 'dizayn', 'oqish'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640006,
  },
  {
    id: 'mem-muo20aa1wxm7',
    title: 'Sinfdosh — Anvarov Aziz',
    content: "RIDM 10-G sinfdoshim Anvarov Aziz: Yaxshi bola. Quvnoq va hazilkash. Do‘stlariga yordam berishga harakat qiladi. Odamlar bilan tez chiqishib ketadi. O‘ziga xos xarakteri bor. Kerak paytda jiddiy bo‘la oladi.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['sinfdosh', 'aziz', 'anvarov', 'ridm', '10-g', 'dost'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640007,
  },
  {
    id: 'mem-muo20aucnvon',
    title: 'Sinfdosh — Temirov Mominjon',
    content: "RIDM 10-G sinfdoshim Temirov Mominjon: Bo‘yi kichkinagina. Tez xafa bo‘lib qoladi. Halol bola. Qizlarning qo‘lini ushlamaydi. O‘ziga xos xarakterli.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['sinfdosh', 'mominjon', 'temirov', 'ridm', '10-g'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640008,
  },
  {
    id: 'mem-muo20bcq4d2s',
    title: 'Sinfdosh — Abduqayumov Ibrohim',
    content: "RIDM 10-G sinfdoshim Abduqayumov Ibrohim: Zo‘r bola. “Mejik City” (Magic City) bilan bog‘liq o‘ziga xos ta’rif bor. Yaxshi sinfdosh. Davrada kayfiyatni ko‘taradiganlardan.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['sinfdosh', 'ibrohim', 'abduqayumov', 'mejik city', 'ridm', '10-g'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640009,
  },
  {
    id: 'mem-muo20c03yv04',
    title: 'Sinfdosh — Hamidullayev Habibulloh',
    content: "RIDM 10-G sinfdoshim Hamidullayev Habibulloh: “Addushi zo‘r bola”. Qizlar bilan oson gaplashib ketadi. Aziz bilan ko‘p hazillashadi. Ichki hazillar: “Azizning eshshagi”, “massajchi”. Yaxshi sinfdosh.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['sinfdosh', 'habibulloh', 'hamidullayev', 'ridm', '10-g', 'hazil'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640010,
  },
  {
    id: 'mem-muo20cme30nf',
    title: 'Sinfdosh — Baymanov Doniyor',
    content: "RIDM 10-G sinfdoshim Baymanov Doniyor: Yaxshi odam. Hozirgi maktabdagi sinfdosh.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['sinfdosh', 'doniyor', 'baymanov', 'ridm', '10-g'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640011,
  },
  {
    id: 'mem-muo20d82hi06',
    title: 'Sinfdosh — Isayeva Samira',
    content: "RIDM 10-G sinfdoshim Isayeva Samira: Yaxshi qiz. Bir paytlar Ibrohim unga ko‘ngil qo‘yib qolgan. Telefonidan bosh ko‘tarmaydigan paytlari bo‘lgan.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['sinfdosh', 'samira', 'isayeva', 'ibrohim', 'ridm', '10-g'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640012,
  },
  {
    id: 'mem-muo20dycsmhv',
    title: 'Sinfdosh — Robiya Abdunabiyeva',
    content: "RIDM 10-G sinfdoshim Robiya Abdunabiyeva: Tez jahli chiqadi, lekin aslida yaxshi qiz. Mominjon bilan urishgani/urgani haqida xotiralar bor. Hazilona ta’rif: “Asabini o‘ynasang, baklashka uchadi”.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['sinfdosh', 'robiya', 'abdunabiyeva', 'baklashka', 'mominjon', 'ridm', '10-g'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640013,
  },
  {
    id: 'mem-muo20eof6yyr',
    title: 'Sinfdosh — Gulchexra',
    content: "RIDM 10-G sinfdoshim Gulchexra: Hazilona ta’rif: “Avtobusda yo‘qolib qolgan”.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['sinfdosh', 'gulchexra', 'avtobus', 'ridm', '10-g'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640014,
  },
  {
    id: 'mem-muo20f7mw0a4',
    title: 'Sinfdosh — Baxtiyorova Muborak',
    content: "RIDM 10-G sinfdoshim Baxtiyorova Muborak: Ziyoli qiz. Qaysar. Ba’zan ignor qiladi. Ayrim holatlarda asab buzadi. Aslida o‘zi yaxshi qiz. Hazil/taxmin: “Universitetdan 3 ta bolali bo‘lib chiqadi”.",
    category: 'Personal',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['sinfdosh', 'muborak', 'baxtiyorova', 'ziyoli', 'ridm', '10-g'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640015,
  },
  {
    id: 'mem-muo20fsgut8k',
    title: 'Ustoz — Zulxumor Ayupova (Kurator)',
    content: "RIDM maktabi kuratori Zulxumor Ayupova: Amir Temurxonning ta’rifida — zo‘r ustoz.",
    category: 'Work',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['ustoz', 'zulxumor', 'ayupova', 'kurator', 'ridm', 'oqituvchi'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640016,
  },
  {
    id: 'mem-muo20gdgmrud',
    title: 'Ustoz — Safarov Shoxrux aka (Grafika dizayn)',
    content: "RIDM grafika dizayn ustozi Safarov Shoxrux aka: “Zalatoy ustoz”, “Eng zo‘ri” deb ta’riflangan. Amir Temurxon unga hurmat bilan “Oka” deb murojaat qiladi.",
    category: 'Work',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['ustoz', 'shoxrux', 'safarov', 'grafika', 'dizayn', 'ridm', 'zalatoy'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640017,
  },
  {
    id: 'mem-muo20gw33dyh',
    title: 'Ustoz — Xalilov Qobil (Rassomchilik)',
    content: "RIDM rassomchilik ustozi Xalilov Qobil: Rassomchilikdan ko‘p gapiradi. Hazilona ta’rif: “Chakaği tinmaydi” — ya’ni juda ko‘p gapiradi.",
    category: 'Work',
    isPrivate: false,
    source: 'Amir Temurxon (Shaxsiy xotira)',
    tags: ['ustoz', 'qobil', 'xalilov', 'rassomchilik', 'ridm', 'oqituvchi'],
    date: '30-sentabr, 2026',
    createdAt: 1790769640018,
  },
  // Boshqa loyihalar va xotiralar
  {
    id: 'mem-1',
    title: 'MobiCom logo va ranglar palitrasi',
    content: "MobiCom logo should use black and red colors. MobiCom — telefon aksessuarlari brendi (zamonaviy chexollar, zaryadlovchilar, quloqchinlar). Shior: 'Sifatli va qulay'.",
    category: 'Projects',
    isPrivate: false,
    source: 'Telegram: @shaxsiy_miya_bot',
    tags: ['mobicom', 'branding', 'logo', 'dizayn', 'ranglar'],
    date: '14-fevral, 2025',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
  },
  {
    id: 'mem-2',
    title: 'MobiCom telefon aksessuarlar brendi maqsadi',
    content: "MobiCom — zamonaviy telefon aksessuarlari brendi. Asosiy mahsulotlar: bardoshli chexollar, tezkor quvvatlagichlar va himoya oynalari. Maqsad Toshkent bo'ylab 1 soatda yetkazish.",
    category: 'Projects',
    isPrivate: false,
    source: 'Telegram: @shaxsiy_miya_bot',
    tags: ['mobicom', 'biznes', 'aksesuar', 'telefon'],
    date: '16-fevral, 2025',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 28,
  },
  {
    id: 'mem-3',
    title: 'Ofis Wi-Fi paroli va sozlamalari',
    content: "Ofisdagi Wi-Fi paroli: 'SuperMiya998#' - hech kimga aytma, ayniqsa qo‘shni ofisdagilarga. Tezlik 200 Mbps, 5GHz tarmog'iga ulanish tavsiya qilinadi.",
    category: 'Private',
    isPrivate: true,
    source: 'Telegram (Ovozli xabar matni)',
    tags: ['wifi', 'parol', 'internet', 'ofis', 'maxfiy'],
    date: '02-mart, 2025',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
  },
  {
    id: 'mem-4',
    title: 'Sardor bilan shartnoma uchrashuvi',
    content: "Sardor bilan MobiCom yetkazib berish shartnomasi bo‘yicha uchrashuv: chorshanba kuni soat 14:00 da 'Chayxona #1'da bo‘ladi. Namunaviy chexollarni olib borish kerak.",
    category: 'Work',
    isPrivate: false,
    source: 'Telegram: @shaxsiy_miya_bot',
    tags: ['sardor', 'uchrashuv', 'shartnoma', 'mobicom'],
    date: '05-mart, 2025',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 16,
  },
  {
    id: 'mem-5',
    title: 'Haqiqiy toshkentcha to‘y oshi siri',
    content: "Eng zo‘r toshkentcha to‘y oshi siri: dumba yog‘ini yaxshilab eritib qizdirish, zirani esa faqat sabzi tushgandan keyin solish kerak. 1 kg guruchga 1 kg sariq sabzi, mayiz va no‘xat solinadi.",
    category: 'Knowledge',
    isPrivate: false,
    source: 'Veb-saytdan yozilgan',
    tags: ['osh', 'palov', 'retsept', 'toshkent', 'taom'],
    date: '10-mart, 2025',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
  },
  {
    id: 'mem-6',
    title: 'Fitnes zal jadvali va trenirovka',
    content: "Fitnes zal jadvali: Dushanba, Chorshanba, Juma soat 19:30 da. Murabbiy: Jamshid aka. Yelka va bel mashqlari. Mashqdan keyin albatta banan va oqsil, lekin somsa ham taqiqlanmagan 😂",
    category: 'Personal',
    isPrivate: false,
    source: 'Telegram: @shaxsiy_miya_bot',
    tags: ['sport', 'zal', 'trenirovka', 'fitnes', 'salomatlik'],
    date: '12-mart, 2025',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
  },
  {
    id: 'mem-7',
    title: 'Bank kartasi xavfsizlik kodlari',
    content: "Asosiy Visa karta pin kodi: 4821. CVV: 713. Faqat shoshilinch chet el to‘lovlari uchun! Notanish saytlarga aslo kiritilmasin.",
    category: 'Private',
    isPrivate: true,
    source: 'Telegram: @shaxsiy_miya_bot',
    tags: ['karta', 'bank', 'pin', 'cvv', 'visa', 'maxfiy'],
    date: '15-mart, 2025',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'mem-8',
    title: 'GapBot sun’iy intellekt startup g‘oyasi',
    content: "Kelajakdagi startup g‘oyasi: Sun'iy intellekt orqali o'zbek to'ylari va gap-gashtaklaridagi navbatlarni adolatli boshqaradigan 'GapBot'. Odamlar to'lagan puli va navbatini eslatadi.",
    category: 'Ideas',
    isPrivate: false,
    source: 'Telegram: @shaxsiy_miya_bot',
    tags: ['startup', 'goya', 'ai', 'bot', 'gap'],
    date: '18-mart, 2025',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
  },
  {
    id: 'mem-9',
    title: 'Ingliz tili va IELTS rejasi',
    content: "Ingliz tili darslari rejasi: IELTS topshirish dekabr oyiga belgilangan. Har kuni kamida 20 ta yangi so‘z yodlash va 1 ta TED talk eshitish. Dangasalik qilmaslik kerak!",
    category: 'Knowledge',
    isPrivate: false,
    source: 'Telegram: @shaxsiy_miya_bot',
    tags: ['ingliztili', 'ielts', 'oqish', 'reja'],
    date: '20-mart, 2025',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'mem-10',
    title: 'Mashina moyi va servis muddati',
    content: "Chevrolet Malibu mashina motor moyi oxirgi marta 62,500 km da almashtirildi. Keyingi servis 70,000 km da bo'lishi shart (Castrol 5W-30). Tormoz kolodkalarini ham tekshirtirish kerak.",
    category: 'Important',
    isPrivate: false,
    source: 'Telegram: @shaxsiy_miya_bot',
    tags: ['mashina', 'servis', 'moy', 'avto'],
    date: '22-mart, 2025',
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
  },
];

class MemoryDB {
  private memories: Memory[] = [];
  private isLoaded = false;
  private isGeneratingEmbeddings = false;
  private firestore: Firestore | null = null;

  constructor() {
    this.initFirestore();
    this.init();
  }

  private initFirestore() {
    try {
      if (firebaseConfig && firebaseConfig.projectId) {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        this.firestore = firebaseConfig.firestoreDatabaseId
          ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
          : getFirestore(app);
        console.log('🔥 Connected to Google Firestore database:', firebaseConfig.projectId);
      }
    } catch (e) {
      console.warn('Firestore initialization notice:', e);
    }
  }

  private async init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.memories = JSON.parse(raw);
        this.isLoaded = true;
      } else {
        // User requested clearing all data
        this.memories = [];
        this.save();
        this.isLoaded = true;
      }

      // Sync from Firestore if available and has documents
      if (this.firestore && this.memories.length === 0) {
        try {
          const colRef = collection(this.firestore, 'memories');
          const snapshot = await getDocs(colRef);
          if (!snapshot.empty) {
            const remoteMemories: Memory[] = [];
            snapshot.forEach((docSnap) => {
              remoteMemories.push(docSnap.data() as Memory);
            });
            this.memories = remoteMemories;
            this.save();
          }
        } catch (fErr) {
          console.warn('Firestore initial fetch fallback:', fErr);
        }
      }
    } catch (e) {
      console.error('Failed to init MemoryDB:', e);
      this.memories = [];
      this.isLoaded = true;
    }

    this.ensureEmbeddings();
  }

  public async ensureEmbeddings() {
    if (this.isGeneratingEmbeddings) return;
    this.isGeneratingEmbeddings = true;

    try {
      let updated = false;
      for (const m of this.memories) {
        if (!m.embedding || m.embedding.length === 0) {
          const textToEmbed = `${m.title}. ${m.content} Toifa: ${m.category}. Kalit so'zlar: ${m.tags.join(', ')}`;
          const vec = await getEmbedding(textToEmbed);
          if (vec) {
            m.embedding = vec;
            updated = true;
          }
        }
      }
      if (updated) {
        this.save();
      }
    } catch (err) {
      console.warn('Embedding background generation issue:', err);
    } finally {
      this.isGeneratingEmbeddings = false;
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.memories, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save memories locally:', e);
    }
  }

  public getAll(includePrivateDetails: boolean = false): Memory[] {
    return this.memories.map((m) => {
      if (m.isPrivate && !includePrivateDetails) {
        return {
          ...m,
          content: "🔒 [MAXFIY MA'LUMOT - Ko'rish uchun parol talab qilinadi]",
          embedding: undefined,
        };
      }
      const copy = { ...m };
      delete copy.embedding;
      return copy;
    });
  }

  public getById(id: string, includePrivateDetails: boolean = false): Memory | null {
    const mem = this.memories.find((m) => m.id === id);
    if (!mem) return null;
    if (mem.isPrivate && !includePrivateDetails) {
      return {
        ...mem,
        content: "🔒 [MAXFIY MA'LUMOT - Ko'rish uchun parol talab qilinadi]",
        embedding: undefined,
      };
    }
    return { ...mem, embedding: undefined };
  }

  public async add(memoryData: Omit<Memory, 'id' | 'createdAt' | 'embedding'>): Promise<Memory> {
    const id = 'mem-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const newMemory: Memory = {
      ...memoryData,
      id,
      createdAt: Date.now(),
    };

    // Embedding
    const textToEmbed = `${newMemory.title}. ${newMemory.content} Toifa: ${newMemory.category}. Kalit so'zlar: ${newMemory.tags.join(', ')}`;
    const vec = await getEmbedding(textToEmbed);
    if (vec) {
      newMemory.embedding = vec;
    }

    this.memories.unshift(newMemory);
    this.save();

    // Sync to Google Firestore
    if (this.firestore) {
      try {
        const { embedding, ...syncDoc } = newMemory;
        await setDoc(doc(this.firestore, 'memories', id), syncDoc);
      } catch (fErr) {
        console.warn('Firestore write sync issue:', fErr);
      }
    }

    return newMemory;
  }

  public update(id: string, updateData: Partial<Memory>): Memory | null {
    const idx = this.memories.findIndex((m) => m.id === id);
    if (idx === -1) return null;

    const current = this.memories[idx];
    const updated: Memory = {
      ...current,
      ...updateData,
      id: current.id,
      createdAt: current.createdAt,
    };

    if (updateData.content && updateData.content !== current.content) {
      delete updated.embedding;
    }

    this.memories[idx] = updated;
    this.save();
    this.ensureEmbeddings();

    // Sync to Google Firestore
    if (this.firestore) {
      try {
        const { embedding, ...syncDoc } = updated;
        setDoc(doc(this.firestore, 'memories', id), syncDoc, { merge: true }).catch(console.warn);
      } catch (fErr) {
        console.warn('Firestore update sync issue:', fErr);
      }
    }

    return updated;
  }

  public delete(id: string): boolean {
    const initLen = this.memories.length;
    this.memories = this.memories.filter((m) => m.id !== id);
    if (this.memories.length !== initLen) {
      this.save();
      // Sync delete to Google Firestore
      if (this.firestore) {
        deleteDoc(doc(this.firestore, 'memories', id)).catch(console.warn);
      }
      return true;
    }
    return false;
  }

  public async clearAll(): Promise<Memory[]> {
    const previous = [...this.memories];
    this.memories = [];
    this.save();

    // Delete all from Firestore
    if (this.firestore) {
      try {
        for (const p of previous) {
          await deleteDoc(doc(this.firestore, 'memories', p.id)).catch(() => {});
        }
      } catch (err) {
        console.warn('Firestore clear error:', err);
      }
    }

    return [];
  }

  public async resetToDefaults(): Promise<Memory[]> {
    this.memories = DEFAULT_MEMORIES.map((m) => ({ ...m }));
    this.save();
    this.ensureEmbeddings();

    // Sync defaults to Firestore
    if (this.firestore) {
      try {
        for (const m of this.memories) {
          const { embedding, ...syncDoc } = m;
          await setDoc(doc(this.firestore, 'memories', m.id), syncDoc);
        }
      } catch (err) {
        console.warn('Firestore reset sync error:', err);
      }
    }

    return this.getAll(false);
  }

  // Vector Cosine Similarity
  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Hybrid Semantic + Token Overlap Scoring
  public async search(query: string, limit = 5): Promise<SearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    if (this.memories.length === 0) {
      return [];
    }

    // 1. Get query embedding
    const queryEmbedding = await getEmbedding(trimmed);

    // 2. Compute similarity for each memory
    const queryTokens = trimmed
      .toLowerCase()
      .replace(/[^\w\sа-яёўқғҳ]/gi, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const scored = this.memories.map((m) => {
      let vectorScore = 0;
      if (queryEmbedding && m.embedding && m.embedding.length === queryEmbedding.length) {
        vectorScore = this.cosineSimilarity(queryEmbedding, m.embedding);
      }

      // Keyword / token overlap score
      const combinedText = `${m.title} ${m.content} ${m.tags.join(' ')} ${m.category}`.toLowerCase();
      let keywordScore = 0;
      for (const tok of queryTokens) {
        if (combinedText.includes(tok)) {
          keywordScore += 0.25;
        }
      }
      if (combinedText.includes(trimmed.toLowerCase())) {
        keywordScore += 0.4;
      }

      const semanticSynonyms: Record<string, string[]> = {
        mobikom: ['mobicom'],
        rang: ['colors', 'qora', 'qizil', 'logo'],
        ranglari: ['colors', 'qora', 'qizil', 'logo', 'ranglar'],
        brend: ['telefon', 'aksessuarlar', 'mobicom'],
        chexol: ['aksesuar', 'himoya', 'mobicom'],
        wifi: ['internet', 'parol', 'tarmoq'],
        vayfay: ['wifi', 'internet', 'parol'],
        sardor: ['uchrashuv', 'shartnoma'],
        osh: ['palov', 'guruch', 'dumba', 'sabzi'],
        palov: ['osh', 'guruch', 'sabzi', 'dumba'],
        ovqat: ['osh', 'palov', 'retsept'],
        zal: ['sport', 'fitnes', 'trenirovka'],
        mashq: ['zal', 'sport', 'fitnes'],
        karta: ['visa', 'pin', 'cvv', 'bank'],
        kartasi: ['visa', 'pin', 'cvv', 'bank'],
        hisob: ['bank', 'karta', 'pin'],
      };

      for (const tok of queryTokens) {
        const syns = semanticSynonyms[tok];
        if (syns) {
          for (const s of syns) {
            if (combinedText.includes(s)) {
              keywordScore += 0.35;
            }
          }
        }
      }

      let finalScore = vectorScore > 0 ? vectorScore * 0.7 + Math.min(keywordScore, 0.4) * 0.3 : Math.min(keywordScore, 0.95);

      return {
        memory: m,
        score: Math.min(Math.max(finalScore, 0), 1),
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const topMatches = scored.slice(0, limit);

    return topMatches.map((item) => ({
      memory: item.memory,
      score: item.score,
      isPrivateProtected: item.memory.isPrivate,
    }));
  }

  // Password verification
  public verifyPrivatePassword(inputPassword: string): { success: boolean; message: string } {
    const trimmed = (inputPassword || '').trim();
    if (trimmed === SERVER_PRIVATE_PASSWORD || trimmed === 'miya2025') {
      return {
        success: true,
        message: 'Ha, o‘zing ekansan 😂 Xush kelibsan!',
      };
    }

    const wrongQuotes = [
      'Yo‘q 😂 Bu parol emas.',
      'Yaxshi urinish 😎 Lekin o‘tmadi.',
      'Kimligingni bilmayman, lekin adashding 😂',
      'Birinchi miyang bu parolni ham unutibdimi? 😂',
      'Miyadagi qulf bu parolni tanimadi 🔒',
    ];
    const randomQuote = wrongQuotes[Math.floor(Math.random() * wrongQuotes.length)];
    return {
      success: false,
      message: randomQuote,
    };
  }

  public getStats() {
    const total = this.memories.length;
    const privateCount = this.memories.filter((m) => m.isPrivate).length;
    const categories: Record<string, number> = {};
    for (const m of this.memories) {
      categories[m.category] = (categories[m.category] || 0) + 1;
    }

    const capacityPercent = total === 0 ? 0 : Math.min(100, Math.max(12, +(total * 2.3 + 8).toFixed(1)));
    const emptyPercent = +(100 - capacityPercent).toFixed(1);

    return {
      total,
      privateCount,
      publicCount: total - privateCount,
      categories,
      capacityPercent,
      emptyPercent,
      status: 'Miya online. Hozircha ishlayapti.',
      funnyStatus: total === 0
        ? 'Miya hozircha bo‘m-bo‘sh! Yangi xotiralar kutmoqda 🧠'
        : `Miya to‘lishi: ${capacityPercent}% - qolgan ${emptyPercent}% bekorchi o‘ylar va memlar 😂`,
    };
  }
}

export const db = new MemoryDB();
