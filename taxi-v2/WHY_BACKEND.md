# Loyiha: Taxi Post Collector — Backend uchun tavsif (handoff)

> Bu hujjat boshqa dasturchiga loyihaning backend qismini tushuntirish va
> topshirish uchun yozilgan. O'qib bo'lgach, backend'ni boshqadan yozishi mumkin.

---

## 1. Loyiha nima?
Telegram'dagi taxi kanallaridan e'lonlar (yo'lovchi yoki haydovchi) avtomatik
yig'ilib, veb-saytda real vaqtda ko'rsatiladi. Foydalanuvchi yangi e'lon
chiqishi bilanoq bildirishnoma oladi va lentadan ko'radi.

Oddiy oqim:
```
Telegram kanal → post → backend (yig'ish + tasnif) → saqlash → Socket → Frontend
```

---

## 2. Nega backend kerak? (asosiy sabablar)

1. **Frontend Telegram'ga kira olmaydi.**
   Telegram API (MTProto) maxfiy kalitlar va doimiy ulanish talab qiladi.
   Buni brauzerda (frontend) qilish: CORS, maxfiy token xavfsizligi,
   ulanish uzilishi sababli imkonsiz. Shuning uchun oraliq server — backend — kerak.

2. **Doimiy ulanish (persistent connection) kerak.**
   Yangi postlar "push" tarzda keladi (Telegram eventlari). Buni qabul qilish
   uchun server doim ishlab turishi shart. Serverless (Vercel) bunga yaramaydi.

3. **Ma'lumotlarni saqlash kerak.**
   Postlar, kanallar, foydalanuvchilar, obuna holati — barchasi saqlanishi kerak.
   Brauzerda saqlansa, boshqa foydalanuvchilar ko'ra olmaydi.

4. **Real vaqt (real-time) kerak.**
   Yangi post darhol frontenda paydo bo'lishi uchun WebSocket (Socket.IO) orqali
   xabar yuborish backend vazifasi.

5. **Autentifikatsiya va ruxsatlar.**
   Admin va oddiy foydalanuvchi (obuna) farqi backend'da tekshiriladi.

---

## 3. Backend qanday vazifalarni bajaradi?

### A. Telegram ulanishi
- Bot token orqali bot'ni ulaydi (`@ilyosakataxibot`).
- Flood'ga uchsa avtomatik qayta ulanadi (serverni to'xtatmasdan).
- Sababi: postlar shu ulanish orqali keladi.

### B. Postlarni qabul qilish
- Foydalanuvchi botga kanal postini **forward** qilganda.
- Bot kanalga **admin** qo'shilganda — har bir yangi post avtomatik keladi.
- Matn bo'lmasa ham (faqat rasm/vedyo) post yo'qotilmaydi.
- Sababi: foydalanuvchi qo'lda yoki avtomatik post berishi mumkin.

### C. Media va matn qayta ishlash
- Rasm/vedyo yuklab olinadi va serverda saqlanadi.
- Caption bo'lmasa placeholder yoziladi.
- Sababi: kanal postlari ko'pincha rasm shaklida bo'ladi.

### D. Tasniflash
- Post yo'lovchi (passenger) yoki haydovchi (driver) ekanligi aniqlanadi.
- Yo'nalish (Toshkent↔Andijon), telefon, kishi soni ajratib olinadi.
- Sababi: foydalanuvchi kerakli e'lonlarni filtrlab ko'rishi uchun.

### E. Saqlash
- Postlar ro'yxatda saqlanadi, **ko'pi bilan 50 ta** (eng yangisi).
- Duplikatlar (bir xil telefon/fingerprint) saqlanmaydi.
- Sababi: eski ma'lumotlar lentani iflos qilmasligi va xotira cheklangan bo'lishi.

### F. Real-time hamda xabardor qilish
- Yangi post Socket.IO orqali `new-post` event sifatida yuboriladi.
- Frontend'da "🔔 Yangi e'lon" toast chiqadi.
- Sababi: foydalanuvchi yangilashsiz darhol ko'rishi kerak.

### G. API endpointlar
- `GET  /api/health`        — bot ulanganmi?
- `GET  /api/posts`         — postlar ro'yxati
- `POST /api/channels`      — kanal qo'shish + tarixdan 50 ta olish (backfill)
- `PATCH /api/channels/:id` — kanalni to'xtatish/davom ettirish
- `POST /api/auth/login`    — kirish (admin/admin, test/test)
- `GET  /api/me`            — joriy foydalanuvchi
- `POST /api/debug/inject-post` — test uchun (Telegramsiz ishlaydi)

### H. Backfill
- Yangi kanal qo'shilganda uning oxirgi 50 ta posti yig'ib olinadi.
- Sababi: kanal bo'sh boshlanmasin, darhol ma'lumot bo'lsin.

---

## 4. Texnologiya tavsiyasi
- **Til:** Node.js + TypeScript
- **Framework:** Express
- **Real-time:** Socket.IO
- **Telegram:** `telegram` (gramjs) kutubxonasi
- **Saqlash:** hozircha JSON fayl; keyinroq MongoDB/Postgres (deploy uchun)
- **Hosting:** doimiy server (Render / Railway), Vercel emas

---

## 5. Muhim cheklovlar (qattiq qoidalar)
- Postlar soni **50 tadan oshmasligi** kerak (FIFO).
- Backend **doim ishlab turishi** kerak (bot uchun).
- Maxfiy kalitlar (BOT_TOKEN, API_ID, API_HASH) `.env` da bo'lishi kerak,
  repo'ga tushmasligi kerak.

---

## 6. Qisqacha xulosa
Backend — bu loyihaning "miyasi". U Telegram'dan postlarni oladi, ularni
tushunadi (tasniflaydi), saqlaydi va frontenga real vaqtda yetkazadi.
Frontend faqat ko'rsatish uchun; barcha og'ir ish backend'da bo'ladi.
