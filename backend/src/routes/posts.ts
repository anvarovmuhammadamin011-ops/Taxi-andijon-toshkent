import { Router } from "express";
import { store } from "../services/store";

const router = Router();

router.get("/", (req, res) => {
  const q = req.query.q as string | undefined;
  const route = req.query.route as string | undefined;
  const channel = req.query.channel as string | undefined;
  const since = req.query.since as string | undefined;
  res.json(store.getPosts(q, route, channel, since));
});

router.get("/:id", (req, res) => {
  const post = store.getPost(req.params.id);
  if (!post) return res.status(404).json({ error: "Post topilmadi" });
  res.json(post);
});

export default router;
