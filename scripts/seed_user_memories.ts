import 'dotenv/config';
import { db } from '../server/db.js';

interface SeedItem {
  title: string;
  content: string;
  category: 'Ideas' | 'Projects' | 'Knowledge' | 'Personal' | 'Work' | 'Important' | 'Private' | 'Random thoughts';
  isPrivate: boolean;
  tags: string[];
  source: string;
}

const memoriesToSeed: SeedItem[] = [
  // 1. Oila - Otasi
  {
    title: 'Otam — Azamjon',
    content: "Oila a’zosi: Otamning ismi Azamjon.",
    category: 'Personal',
    isPrivate: false,
    tags: ['oila', 'ota', 'azamjon', 'qarindosh', 'yaqinlar'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 2. Oila - Onasi
  {
    title: 'Onam — Dilnoza',
    content: "Oila a’zosi: Onamning ismi Dilnoza.",
    category: 'Personal',
    isPrivate: false,
    tags: ['oila', 'ona', 'dilnoza', 'qarindosh', 'yaqinlar'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 3. Oila - Akasi
  {
    title: 'Akam — Alisher',
    content: "Oila a’zosi: Akamning ismi Alisher.",
    category: 'Personal',
    isPrivate: false,
    tags: ['oila', 'aka', 'alisher', 'qarindosh', 'yaqinlar'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 4. Oila - Opasi
  {
    title: 'Opam — Madina',
    content: "Oila a’zosi: Opamning ismi Madina.",
    category: 'Personal',
    isPrivate: false,
    tags: ['oila', 'opa', 'madina', 'qarindosh', 'yaqinlar'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 5. Oila - Buvilari
  {
    title: 'Buvilarim (68 yosh va 95 yosh)',
    content: "2 ta buvim bor: biri — 68 yoshda, ikkinchisi — 95 yoshda.",
    category: 'Personal',
    isPrivate: false,
    tags: ['oila', 'buvi', 'buvilarim', 'yosh', 'qarindosh'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 6. Maktab ma'lumoti
  {
    title: 'Maktab: RIDM (10-G sinf, 3-guruh)',
    content: "Maktab: RIDM — Respublika ixtisoslashtirilgan dizayn maktabi. Sinf: 10-G. Guruh: 3-guruh. Muhim eslatma: V2B — maktab nomi emas.",
    category: 'Knowledge',
    isPrivate: false,
    tags: ['maktab', 'ridm', '10-g', '3-guruh', 'dizayn', 'oqish'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 7. Sinfdosh - Anvarov Aziz
  {
    title: 'Sinfdosh — Anvarov Aziz',
    content: "RIDM 10-G sinfdoshim Anvarov Aziz: Yaxshi bola. Quvnoq va hazilkash. Do‘stlariga yordam berishga harakat qiladi. Odamlar bilan tez chiqishib ketadi. O‘ziga xos xarakteri bor. Kerak paytda jiddiy bo‘la oladi.",
    category: 'Personal',
    isPrivate: false,
    tags: ['sinfdosh', 'aziz', 'anvarov', 'ridm', '10-g', 'dost'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 8. Sinfdosh - Temirov Mominjon
  {
    title: 'Sinfdosh — Temirov Mominjon',
    content: "RIDM 10-G sinfdoshim Temirov Mominjon: Bo‘yi kichkinagina. Tez xafa bo‘lib qoladi. Halol bola. Qizlarning qo‘lini ushlamaydi. O‘ziga xos xarakterli.",
    category: 'Personal',
    isPrivate: false,
    tags: ['sinfdosh', 'mominjon', 'temirov', 'ridm', '10-g'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 9. Sinfdosh - Abduqayumov Ibrohim
  {
    title: 'Sinfdosh — Abduqayumov Ibrohim',
    content: "RIDM 10-G sinfdoshim Abduqayumov Ibrohim: Zo‘r bola. “Mejik City” (Magic City) bilan bog‘liq o‘ziga xos ta’rif bor. Yaxshi sinfdosh. Davrada kayfiyatni ko‘taradiganlardan.",
    category: 'Personal',
    isPrivate: false,
    tags: ['sinfdosh', 'ibrohim', 'abduqayumov', 'mejik city', 'ridm', '10-g'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 10. Sinfdosh - Hamidullayev Habibulloh
  {
    title: 'Sinfdosh — Hamidullayev Habibulloh',
    content: "RIDM 10-G sinfdoshim Hamidullayev Habibulloh: “Addushi zo‘r bola”. Qizlar bilan oson gaplashib ketadi. Aziz bilan ko‘p hazillashadi. Ichki hazillar: “Azizning eshshagi”, “massajchi”. Yaxshi sinfdosh.",
    category: 'Personal',
    isPrivate: false,
    tags: ['sinfdosh', 'habibulloh', 'hamidullayev', 'ridm', '10-g', 'hazil'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 11. Sinfdosh - Baymanov Doniyor
  {
    title: 'Sinfdosh — Baymanov Doniyor',
    content: "RIDM 10-G sinfdoshim Baymanov Doniyor: Yaxshi odam. Hozirgi maktabdagi sinfdosh.",
    category: 'Personal',
    isPrivate: false,
    tags: ['sinfdosh', 'doniyor', 'baymanov', 'ridm', '10-g'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 12. Qiz sinfdosh - Isayeva Samira
  {
    title: 'Sinfdosh — Isayeva Samira',
    content: "RIDM 10-G sinfdoshim Isayeva Samira: Yaxshi qiz. Bir paytlar Ibrohim unga ko‘ngil qo‘yib qolgan. Telefonidan bosh ko‘tarmaydigan paytlari bo‘lgan.",
    category: 'Personal',
    isPrivate: false,
    tags: ['sinfdosh', 'samira', 'isayeva', 'ibrohim', 'ridm', '10-g'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 13. Qiz sinfdosh - Robiya Abdunabiyeva
  {
    title: 'Sinfdosh — Robiya Abdunabiyeva',
    content: "RIDM 10-G sinfdoshim Robiya Abdunabiyeva: Tez jahli chiqadi, lekin aslida yaxshi qiz. Mominjon bilan urishgani/urgani haqida xotiralar bor. Hazilona ta’rif: “Asabini o‘ynasang, baklashka uchadi”.",
    category: 'Personal',
    isPrivate: false,
    tags: ['sinfdosh', 'robiya', 'abdunabiyeva', 'baklashka', 'mominjon', 'ridm', '10-g'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 14. Qiz sinfdosh - Gulchexra
  {
    title: 'Sinfdosh — Gulchexra',
    content: "RIDM 10-G sinfdoshim Gulchexra: Hazilona ta’rif: “Avtobusda yo‘qolib qolgan”.",
    category: 'Personal',
    isPrivate: false,
    tags: ['sinfdosh', 'gulchexra', 'avtobus', 'ridm', '10-g'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 15. Qiz sinfdosh - Baxtiyorova Muborak
  {
    title: 'Sinfdosh — Baxtiyorova Muborak',
    content: "RIDM 10-G sinfdoshim Baxtiyorova Muborak: Ziyoli qiz. Qaysar. Ba’zan ignor qiladi. Ayrim holatlarda asab buzadi. Aslida o‘zi yaxshi qiz. Hazil/taxmin: “Universitetdan 3 ta bolali bo‘lib chiqadi”.",
    category: 'Personal',
    isPrivate: false,
    tags: ['sinfdosh', 'muborak', 'baxtiyorova', 'ziyoli', 'ridm', '10-g'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 16. RIDM ustoz - Zulxumor Ayupova
  {
    title: 'Ustoz — Zulxumor Ayupova (Kurator)',
    content: "RIDM maktabi kuratori Zulxumor Ayupova: Amir Temurxonning ta’rifida — zo‘r ustoz.",
    category: 'Work',
    isPrivate: false,
    tags: ['ustoz', 'zulxumor', 'ayupova', 'kurator', 'ridm', 'oqituvchi'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 17. RIDM ustoz - Safarov Shoxrux aka
  {
    title: 'Ustoz — Safarov Shoxrux aka (Grafika dizayn)',
    content: "RIDM grafika dizayn ustozi Safarov Shoxrux aka: “Zalatoy ustoz”, “Eng zo‘ri” deb ta’riflangan. Amir Temurxon unga hurmat bilan “Oka” deb murojaat qiladi.",
    category: 'Work',
    isPrivate: false,
    tags: ['ustoz', 'shoxrux', 'safarov', 'grafika', 'dizayn', 'ridm', 'zalatoy'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
  // 18. RIDM ustoz - Xalilov Qobil
  {
    title: 'Ustoz — Xalilov Qobil (Rassomchilik)',
    content: "RIDM rassomchilik ustozi Xalilov Qobil: Rassomchilikdan ko‘p gapiradi. Hazilona ta’rif: “Chakaği tinmaydi” — ya’ni juda ko‘p gapiradi.",
    category: 'Work',
    isPrivate: false,
    tags: ['ustoz', 'qobil', 'xalilov', 'rassomchilik', 'ridm', 'oqituvchi'],
    source: 'Amir Temurxon (Shaxsiy xotira)',
  },
];

async function seed() {
  console.log(`🧠 Seeding ${memoriesToSeed.length} personal memories for Amir Temurxon Najimov...`);
  
  const now = new Date();
  const monthsUz = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'
  ];
  const dateStr = `${now.getDate()}-${monthsUz[now.getMonth()]}, ${now.getFullYear()}`;

  for (let i = 0; i < memoriesToSeed.length; i++) {
    const item = memoriesToSeed[i];
    try {
      const saved = await db.add({
        title: item.title,
        content: item.content,
        category: item.category,
        isPrivate: item.isPrivate,
        source: item.source,
        tags: item.tags,
        date: dateStr,
      });
      console.log(`[${i + 1}/${memoriesToSeed.length}] Saved: "${saved.title}" (ID: ${saved.id})`);
    } catch (err) {
      console.error(`Error saving ${item.title}:`, err);
    }
  }

  console.log('✅ Barcha 18 ta xotira 2-chi Miyaga alohida-alohida muvaffaqiyatli saqlandi!');
  process.exit(0);
}

seed();
