import { Router } from "express";
import { store } from "../services/store";

const router = Router();

router.get("/", (req, res) => {
  const tgId = req.query.telegram_id as string | undefined;
  const tgUsername = req.query.telegram_username as string | undefined;
  res.json(store.getConfig(tgId, tgUsername));
});

export default router;
