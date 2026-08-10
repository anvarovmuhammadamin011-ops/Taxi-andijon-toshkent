import { Router, Request } from "express";
import { store } from "../services/store";

const router = Router();

router.get("/", (req: Request, res) => {
  const ownerId = (req.header("x-user-id") ?? "").trim() || undefined;
  res.json(store.getRoutes(ownerId));
});

export default router;
