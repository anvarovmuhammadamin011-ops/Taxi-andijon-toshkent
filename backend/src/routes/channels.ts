import { Router, Request, Response } from "express";
import { store } from "../services/store";
import { fetchChannelTitle } from "../services/monitor";

const router = Router();

router.get("/", (req: Request, res) => {
  const ownerId = (req.header("x-user-id") ?? "").trim() || undefined;
  res.json(store.getChannelsForOwner(ownerId));
});

router.post("/", async (req, res: Response) => {
  const ownerId = (req.header("x-user-id") ?? "").trim() || undefined;
  if (!ownerId) {
    return res.status(400).json({ error: "Foydalanuvchi aniqlanmadi" });
  }
  const raw = String(req.body?.link ?? req.body?.url ?? "").trim();
  const match = raw.match(/(?:t\.me\/|https?:\/\/t\.me\/|tg:\/\/resolve\?domain=|@)([A-Za-z0-9_]{3,})/);
  if (!match) {
    return res.status(400).json({ error: "Kanal havolasini kiriting (masalan: t.me/kanal_nomi)" });
  }
  const username = match[1];
  if (username.toLowerCase() === "joinchat" || raw.includes("joinchat")) {
    return res.status(400).json({ error: "Yopiq (shaxsiy) kanallarni qo'shib bo'lmaydi" });
  }
  const url = `https://t.me/${username}`;
  const existing = store.findChannelByUrl(url);
  if (existing && (!existing.ownerId || existing.ownerId === ownerId)) {
    return res.status(409).json({ error: "Bu kanal allaqachon qo'shilgan" });
  }
  const title = (await fetchChannelTitle(username)) ?? username;
  const channel = store.addChannel(title, url, ownerId);
  store.resetMonitorLastId(username);
  res.status(201).json(channel);
});

router.delete("/:id", (req, res: Response) => {
  const ownerId = (req.header("x-user-id") ?? "").trim();
  if (!ownerId) {
    return res.status(400).json({ error: "Foydalanuvchi aniqlanmadi" });
  }
  if (!store.deleteOwnedChannel(req.params.id, ownerId)) {
    return res.status(403).json({ error: "Bu kanalni o'chira olmaysiz" });
  }
  res.json({ ok: true });
});

export default router;
