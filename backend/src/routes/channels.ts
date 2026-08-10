import { Router, Request, Response, NextFunction } from "express";
import { store } from "../services/store";
import { fetchChannelTitle } from "../services/monitor";
import { verifyToken } from "../services/auth";

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (verifyToken(req.header("x-admin-token"))) {
    return next();
  }
  return res.status(403).json({ error: "Ruxsat yo'q" });
};

const router = Router();

router.get("/", (_req, res) => {
  res.json(store.getChannels());
});

router.post("/", requireAdmin, async (req, res) => {
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
  if (store.findChannelByUrl(url)) {
    return res.status(409).json({ error: "Bu kanal allaqachon qo'shilgan" });
  }
  const title = (await fetchChannelTitle(username)) ?? username;
  const channel = store.addChannel(title, url);
  store.resetMonitorLastId(username);
  res.status(201).json(channel);
});

export default router;
