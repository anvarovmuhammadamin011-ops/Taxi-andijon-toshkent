import { Channel, Post, RouteInfo } from "../types";

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
  seats?: number,
  alsoIn: Post["alsoIn"] = []
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
  alsoIn,
});

const ch = (id: string) => demoChannels.find((c) => c.id === id)!;

export const demoPosts: Post[] = [
  mk("p1", ch("ch1"), "Toshkentga 4 ta odam bor tez tel 992028222", "Toshkent", "Andijon", 1204, mins(6), "992028222", 4, [{ channelId: "ch2", channelTitle: "Chinozod Toshkent Taxi" }]),
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

export const demoRoutes: RouteInfo[] = [
  { from: "Toshkent", to: "Andijon", color: "#FFC400", postCount: 85, emoji: "🟡" },
  { from: "Andijon", to: "Toshkent", color: "#B47CFF", postCount: 72, emoji: "🟣" },
  { from: "Toshkent", to: "Haqqulobod", color: "#34D399", postCount: 18, emoji: "🟢" },
  { from: "Haqqulobod", to: "Toshkent", color: "#60A5FA", postCount: 12, emoji: "🔵" },
];
