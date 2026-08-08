import { Router, Request, Response, NextFunction } from "express";
import { store } from "../services/store";
import { sendTelegramMessage } from "../services/delivery";

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const tgId = req.header("x-telegram-id");
  const tgUsername = req.header("x-telegram-username");
  if (store.isAdmin(tgId, tgUsername)) {
    return next();
  }
  return res.status(403).json({ error: "Ruxsat yo'q" });
};

const router = Router();
router.use(requireAdmin);

router.get("/dashboard", (_req, res) => {
  res.json(store.getDashboard());
});

router.get("/channels", (_req, res) => {
  res.json(store.getChannels());
});

router.post("/channels", (req, res) => {
  const { title, url } = req.body ?? {};
  if (!title || !url) return res.status(400).json({ error: "title va url kerak" });
  const ch = store.addChannel(String(title), String(url));
  res.status(201).json(ch);
});

router.patch("/channels/:id", (req, res) => {
  const ch = store.setChannelActive(req.params.id, Boolean(req.body?.isActive));
  if (!ch) return res.status(404).json({ error: "Kanal topilmadi" });
  res.json(ch);
});

router.delete("/channels/:id", (req, res) => {
  store.deleteChannel(req.params.id);
  res.json({ ok: true });
});

router.get("/users", (_req, res) => {
  res.json(store.getUsers());
});

router.patch("/users/:id", (req, res) => {
  const u = store.setUserBlocked(req.params.id, Boolean(req.body?.isBlocked));
  if (!u) return res.status(404).json({ error: "Foydalanuvchi topilmadi" });
  res.json(u);
});

router.get("/posts", (req, res) => {
  const q = req.query.q as string | undefined;
  const route = req.query.route as string | undefined;
  const channel = req.query.channel as string | undefined;
  res.json(store.getPosts(q, route, channel));
});

router.delete("/posts/:id", (req, res) => {
  const ok = store.deletePost(req.params.id);
  if (!ok) return res.status(404).json({ error: "Post topilmadi" });
  res.json({ ok: true });
});

router.get("/revenue", (_req, res) => {
  res.json(store.getRevenue());
});

router.get("/keywords", (_req, res) => {
  res.json(store.getKeywords());
});

router.post("/keywords", (req, res) => {
  store.addKeyword(String(req.body?.keyword ?? ""));
  res.status(201).json(store.getKeywords());
});

router.delete("/keywords/:kw", (req, res) => {
  store.removeKeyword(req.params.kw);
  res.json(store.getKeywords());
});

router.patch("/config", (req, res) => {
  if (typeof req.body?.postLimit === "number") {
    store.setPostLimit(req.body.postLimit);
  }
  res.json({ postLimit: store.getPostLimit() });
});

router.post("/simulate", (_req, res) => {
  const result = store.simulateIncoming();
  res.status(result.status === "new" ? 201 : 200).json(result);
});

router.get("/delivery/targets", (_req, res) => {
  res.json(store.getDeliveryTargets());
});

router.post("/delivery/targets", (req, res) => {
  const { telegramId, channelUsername, channelTitle, tier } = req.body ?? {};
  if (!telegramId || !channelUsername) {
    return res.status(400).json({ error: "telegramId va channelUsername kerak" });
  }
  const target = store.addDeliveryTarget({
    telegramId: Number(telegramId),
    channelUsername: String(channelUsername),
    channelTitle: channelTitle ? String(channelTitle) : undefined,
    tier: tier === "priority" || tier === "vip" || tier === "regular" ? tier : "regular",
  });
  res.status(201).json(target);
});

router.patch("/delivery/targets/:id", (req, res) => {
  const target = store.setDeliveryTarget(req.params.id, {
    channelUsername: req.body?.channelUsername,
    channelTitle: req.body?.channelTitle,
    tier: req.body?.tier,
    isActive: req.body?.isActive,
  });
  if (!target) return res.status(404).json({ error: "Target topilmadi" });
  res.json(target);
});

router.delete("/delivery/targets/:id", (req, res) => {
  store.deleteDeliveryTarget(req.params.id);
  res.json({ ok: true });
});

router.post("/delivery/targets/:id/test", async (req, res) => {
  const target = store.getDeliveryTargets().find((t) => t.id === req.params.id);
  if (!target) return res.status(404).json({ error: "Target topilmadi" });
  if (!target.channelUsername) {
    return res.status(400).json({ error: "Kanal username o'rnatilmagan" });
  }
  const result = await sendTelegramMessage(
    target.channelUsername,
    `🔔 Test xabar: "${target.channelTitle}" kanaliga ulanish ishlayapti!\nBot: @ilyosakataxibot`
  );
  res.status(result.ok ? 200 : 400).json(result);
});

router.get("/delivery/tasks", (_req, res) => {
  res.json(store.getDeliveryTasks(100));
});

router.patch("/delivery/tasks/:id/send", (req, res) => {
  const task = store.forceSendTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Vazifa topilmadi" });
  res.json(task);
});

router.get("/delivery/config", (_req, res) => {
  res.json({ ...store.getDeliveryConfig(), hasToken: Boolean(process.env.BOT_TOKEN) });
});

router.patch("/delivery/config", (req, res) => {
  const cfg = store.setDeliveryConfig({
    vipDelayMin: req.body?.vipDelayMin,
    regularDelayMin: req.body?.regularDelayMin,
    priorityDelaySec: req.body?.priorityDelaySec,
  });
  res.json(cfg);
});

router.delete("/delivery/tasks/finished", (_req, res) => {
  store.clearFinishedTasks();
  res.json({ ok: true });
});

export default router;
