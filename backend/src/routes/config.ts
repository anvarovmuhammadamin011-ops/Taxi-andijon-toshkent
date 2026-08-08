import { Router } from "express";
import { store } from "../services/store";

const router = Router();

router.get("/", (req, res) => {
  const tgId = req.query.telegram_id as string | undefined;
  res.json(store.getConfig(tgId));
});

export default router;
