# Taxi Post Collector — Backend vazifalari (spec)

## Maqsad
Telegram kanallaridan taxi e'lonlarini (yo'lovchi / haydovchi) real vaqtda yig'ib olish,
tasniflab saqlash va foydalanuvchilarga darhol ko'rsatish.

## Asosiy oqim (flow)
1. Telegramdan post keladi
2. Backend qabul qiladi (handler)
3. Tasniflaydi (yo'lovchi/haydovchi, yo'nalish, tel, kishi soni)
4. Saqlaydi (limit 50, eng yangisi)
5. Socket orqali `new-post` yuboradi
6. Frontend toast + lenta boshiga qo'shadi

## Backend vazifalari

### 1. Telegram ulanishi
- Bot token orqali bot'ni ulash (`@ilyosakataxibot`).
- Qo'shimcha: user-session (kanal kuzatuvchi) ixtiyoriy.
- Ulanish flood'ga uchsa: avtomatik qayta urinish (backoff), serverni bloklamasdan.

### 2. Postlarni qabul qilish
- `UpdateNewMessage` — foydalanuvchi botga postni forward qilganda.
- `UpdateNewChannelMessage` — bot kanalga admin qo'shilganda (har bir yangi post).
- Matn bo'sh bo'lsa ham (faqat rasm/vedyo) postni tashlab yubormaslik.

### 3. Media
- Rasm/vedyo ni yuklab `uploads/` ga saqlash.
- Caption yo'qsa placeholder: "📷 Rasm e'loni" / "📎 Fayl e'loni".
- `mediaType`, `mediaUrl` ni postga yozish.

### 4. Tasniflash (`classifyMessage`)
- `passenger` (yo'lovchi) / `driver` (haydovchi) / `unknown`.
- `route`: toshkent_andijon | andijon_toshkent | unknown.
- `passengerCount`, `phone`, `username` ajratib olish.

### 5. Saqlash
- JSON fayl yoki DB. **Limit: 50 ta** (eng yangilari saqlanadi, eskilari o'chadi).
- Duplikat: `fingerprint` yoki `phone` bo'yicha tekshirish.

### 6. Real-time
- Socket.IO: yangi post'da `new-post` event'i broadcast.
- Frontend'da "🔔 Yangi e'lon" toast + lenta yangilanishi.

### 7. API endpointlar
- `GET /api/health` → `{ status, telegram }`
- `GET /api/posts` → postlar (yangi birinchi)
- `POST /api/channels` → kanal qo'shish + **backfill** (oxirgi 50 postni yig'ish)
- `PATCH /api/channels/:id` → pause/resume
- `POST /api/auth/login`, `GET /api/me`, `GET /api/admin/...`
- `POST /api/debug/inject-post` → test uchun (Telegramsiz)

### 8. Foydalanuvchi
- Login: `admin/admin` (admin), `test/test` (oddiy user, role=user).
- Obuna muddati tekshiriladi.
- Saqlangan postlar, bildirishnomalar.

### 9. Admin panel
- Kanallar: qo'shish (username orqali), ro'yxat, pause/resume.
- Qo'shilganda bot kanal tarixidan oxirgi 50 ta postni oladi (backfill).

## Cheklovlar
- Saqlash: **max 50 post** (FIFO).
- Media yuklanadi va frontend'da ko'rsatiladi.
- Duplikatlar saqlanmaydi.

## Muhim eslatma (deploy)
- Bot doimiy ulanish talab qiladi → Vercel(serverless) bot uchun yaramaydi.
- Local yoki doimiy server (Render/Railway) + umumiy baza kerak.
