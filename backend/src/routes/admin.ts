import { Router, Request, Response, NextFunction } from "express";
import { store } from "../services/store";

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const tgId = req.header("x-telegram-id");
  if (store.isAdmin(tgId)) {
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

export default router;
