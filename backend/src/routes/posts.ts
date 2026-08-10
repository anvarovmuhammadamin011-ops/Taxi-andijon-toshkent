import { Router, Request } from "express";
import { store } from "../services/store";
import { pollIfStale } from "../services/monitor";

const router = Router();

function ownerIdOf(req: Request): string | undefined {
  const v = req.header("x-user-id") ?? "";
  return v.trim() || undefined;
}

router.get("/", async (req, res) => {
  const q = req.query.q as string | undefined;
  const route = req.query.route as string | undefined;
  const channel = req.query.channel as string | undefined;
  const since = req.query.since as string | undefined;
  await pollIfStale(30_000);
  res.json(store.getPosts(q, route, channel, since, ownerIdOf(req)));
});

router.get("/:id", (req, res) => {
  const post = store.getPost(req.params.id, ownerIdOf(req));
  if (!post) return res.status(404).json({ error: "Post topilmadi" });
  res.json(post);
});

export default router;
