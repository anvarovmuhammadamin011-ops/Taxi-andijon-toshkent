# Backend vazifalari (TASKS)

Bu fayl backend'ning bajarishi kerak bo'lgan vazifalarni tavsiflaydi.
Har bir bo'lim — alohida modul/funksiya. Shuni asos qilib kod yozing.

---

## 1. Telegram ulanishi (`telegram.ts`)
- `connectBot()`: BOT_TOKEN orqali bot'ni ulaydi.
- Ulanish flood'ga uchsa (FloodWaitError) → avtomatik qayta urinish,
  serverni bloklamasdan (background `setTimeout`, backoff).
- `connectUser()` (ixtiyoriy): user-session orqali kanal kuzatuvchi.
- `isConnected()` → health uchun.

## 2. Postlarni qabul qilish (`telegram.ts` -> `setupBotHandler`)
- `UpdateNewMessage`: foydalanuvchi botga forward qilganda.
  - `fwd_from.fromId.channelId` dan kanal id/title olinadi.
- `UpdateNewChannelMessage`: bot kanalga admin qo'shilganda (har bir yangi post).
  - `message.peerId.channelId` dan kanal olinadi.
- Matn bo'sh bo'lsa ham (faqat rasm/vedyo) — postni tashlamaslik.

## 3. Media (`extractMediaInfo`)
- `message.media` borligini tekshiradi (photo / video / document).
- Rasmni yuklab `uploads/<id>.jpg` ga saqlaydi.
- Qaytaradi: `{ type, url }`. Caption yo'qsa placeholder matn.

## 4. Tasniflash (`classifier.ts` + `text.ts`)
- `classifyMessage(text)` → `passenger` | `driver` | `unknown`.
- `detectRoute(text)` → `toshkent_andijon` | `andijon_toshkent` | `unknown`.
- `extractPhone`, `extractUsername`, `extractPassengerCount`.
- `generateFingerprint(text)` → duplikat kaliti.

## 5. Saqlash (`storage.ts`)
- `addPost(post)`: boshiga qo'shadi, **limit 50** (ortig'ini kesib tashlaydi).
- `findPostByFingerprint` / `findPostByPhone` → duplikat tekshiruvi.
- `getPosts`, `removePost`, `updatePost`.
- Kanallar, foydalanuvchilar, bildirishnomalar, saqlangan postlar.

## 6. Real-time (`socket.ts`)
- `broadcastNewPost(post)`: Socket.IO orqali `new-post` event yuboradi.
- Frontend: toast + lenta yangilanishi.

## 7. API (`routes/`)
- `GET  /api/health`            → `{ status, telegram }`
- `GET  /api/posts`             → postlar
- `POST /api/channels`          → kanal qo'shish + **backfill**
- `PATCH /api/channels/:id`     → pause/resume
- `POST /api/auth/login`
- `GET  /api/me`
- `GET  /api/admin/...`
- `POST /api/debug/inject-post` → test (Telegramsiz)

## 8. Backfill (`backfillChannel`)
- Kanal qo'shilganda bot kanal tarixidan oxirgi 50 ta xabarni oladi
  va saqlaydi (broadcast SIZ, shovqin bo'lmasin).

## 9. Foydalanuvchi / Auth (`auth.ts`, `localAuth`)
- Login: `admin/admin` (admin), `test/test` (user).
- Obuna muddati tekshiriladi.

## Cheklovlar
- Saqlash: **max 50 post** (FIFO).
- Media yuklanadi, frontend'da ko'rsatiladi.
- Duplikatlar saqlanmaydi.

## Deploy eslatmasi
- Bot doimiy ulanish talab qiladi → Vercel(serverless) yaramaydi.
- Local yoki doimiy server (Render/Railway) + umumiy baza kerak.
