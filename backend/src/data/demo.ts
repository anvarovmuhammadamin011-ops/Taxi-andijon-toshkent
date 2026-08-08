import { AppUser, Channel, Post, RevenueStats, VipPlan } from "../types";

const now = Date.now();
const mins = (m: number) => new Date(now - m * 60_000).toISOString();
const days = (d: number) => new Date(now - d * 86_400_000).toISOString();

export const demoChannels: Channel[] = [
  { id: "ch1", title: "Norin Toshkent Taxi", url: "https://t.me/norintoshkenttaxi", postCount: 156, isActive: true, addedAt: days(40) },
  { id: "ch2", title: "Chinozod Toshkent Taxi", url: "https://t.me/chinozodtoshkent", postCount: 98, isActive: true, addedAt: days(35) },
  { id: "ch3", title: "Taxi Andijon", url: "https://t.me/taxiandijon", postCount: 76, isActive: true, addedAt: days(28) },
  { id: "ch4", title: "Toshkent Andijon Taxi", url: "https://t.me/toshkentandijontaxi", postCount: 73, isActive: false, addedAt: days(20) },
  { id: "ch5", title: "Taxi 24/7", url: "https://t.me/taxi247", postCount: 45, isActive: true, addedAt: days(12) },
];

const mk = (
  id: string,
  channel: Channel,
  text: string,
  from: string,
  to: string,
  messageId: number,
  postedAt: string,
  phone?: string,
  seats?: number
): Post => ({
  id,
  channelId: channel.id,
  channelTitle: channel.title,
  channelUrl: channel.url,
  text,
  route: `${from} -> ${to}`,
  from,
  to,
  phone,
  seats,
  postedAt,
  messageId,
  alsoIn: [],
});

const ch = (id: string) => demoChannels.find((c) => c.id === id)!;

export const demoPosts: Post[] = [
  mk("p1", ch("ch1"), "Toshkentga 4 ta odam bor tez tel 992028222", "Toshkent", "Andijon", 1204, mins(6), "992028222", 4),
  mk("p2", ch("ch2"), "Andijondan Toshkentga 3 ta joy bor. Bugun soat 16:00 da yo'lga chiqamiz. Tel 901234567", "Andijon", "Toshkent", 2210, mins(18), "901234567", 3),
  mk("p3", ch("ch3"), "Toshkentdan Haqqulobodga 5 ta odam ketadi. Qo'ng'iroq qiling: 998901112233", "Toshkent", "Haqqulobod", 4401, mins(32), "998901112233", 5),
  mk("p4", ch("ch4"), "Haqquloboddan Toshkentga 2 ta joy. Ertalab 08:00 chiqish. Tel 933334455", "Haqqulobod", "Toshkent", 3102, mins(45), "933334455", 2),
  mk("p5", ch("ch5"), "Toshkentdan Andijonga tez yo'l. 1 ta joy qoldi. Tel 977778899", "Toshkent", "Andijon", 9003, mins(61), "977778899", 1),
  mk("p6", ch("ch1"), "Andijondan Toshkentga 4 ta odam bor tez tel 992028222", "Andijon", "Toshkent", 1198, mins(75), "992028222", 4),
  mk("p7", ch("ch2"), "Andijonga 6 ta odam bor. Qo'shimcha qo'ng'iroq: 908877665", "Toshkent", "Andijon", 2195, mins(88), "908877665", 6),
  mk("p8", ch("ch3"), "Тошкентга 4 та одам бор. Тез қўнғироқ қилинг! Тел 900112233", "Andijon", "Toshkent", 4390, mins(112), "900112233", 4),
  mk("p9", ch("ch4"), "Toshkentdan Haqqulobodga 3 ta joy bor. 934556677 tel", "Toshkent", "Haqqulobod", 3087, mins(140), "934556677", 3),
  mk("p10", ch("ch5"), "Toshkentdan Andijonga ertaga erta yo'l. 2 ta joy. Tel 995556677", "Toshkent", "Andijon", 8990, mins(166), "995556677", 2),
  mk("p11", ch("ch2"), "Haqquloboddan Toshkentga 5 ta odam. Tel 912223344", "Haqqulobod", "Toshkent", 2188, mins(190), "912223344", 5),
  mk("p12", ch("ch3"), "Тошкентдан Андижонга 2 та жой бор, шошилинч. Тел 977554433", "Toshkent", "Andijon", 4377, mins(214), "977554433", 2),
];

export const rawSamples: string[] = [
  "Тошкентга 3 та одам бор тез тел 998901234567",
  "Toshkentdan Andijonga 4 ta joy. Tel 901112233",
  "Андижондан Тошкентга 2 та одам кетади. 912223344",
  "Toshkentga 5 ta odam bor, tez qo'ng'iroq qiling 933334455",
  "Andijondan Toshkentga 6 ta joy bor. Tel 944556677",
  "Тошкентдан Андижонга 1 та одам. Тел 998901234567",
];

export const demoUsers: AppUser[] = [
  { id: "u1", telegramId: 100000001, name: "Muhammadamin", username: "muhammadamin", registeredAt: days(30), vip: true, vipUntil: days(-20), savedPosts: 12, isBlocked: false, lastActiveAt: mins(20) },
  { id: "u2", telegramId: 100000002, name: "Ali", username: "ali_dev", registeredAt: days(25), vip: false, savedPosts: 3, isBlocked: false, lastActiveAt: mins(120) },
  { id: "u3", telegramId: 100000003, name: "Vali", username: "vali_uz", registeredAt: days(18), vip: true, vipUntil: days(-35), savedPosts: 8, isBlocked: false, lastActiveAt: mins(300) },
  { id: "u4", telegramId: 100000004, name: "Sardor", username: "sardor", registeredAt: days(10), vip: false, savedPosts: 1, isBlocked: true, lastActiveAt: days(3) },
  { id: "u5", telegramId: 100000005, name: "Zarina", username: "zarina_aa", registeredAt: days(5), vip: true, vipUntil: days(-50), savedPosts: 21, isBlocked: false, lastActiveAt: mins(5) },
];

export const demoRevenue: RevenueStats = {
  today: 1095000,
  month: 8450000,
  total: 24500000,
  vipUsers: 73,
  payments: 142,
  history: Array.from({ length: 30 }, (_, i) => ({
    date: days(29 - i).slice(0, 10),
    amount: 150_000 + Math.round(Math.random() * 350_000),
  })),
};

export const demoPlans: VipPlan[] = [
  { id: "p1m", period: "1 oy", price: 15000 },
  { id: "p3m", period: "3 oy", price: 35000 },
  { id: "p6m", period: "6 oy", price: 60000 },
];

export const demoKeywords: string[] = ["Toshkent", "Andijon", "Haqqulobod", "taxi", "taksi"];
