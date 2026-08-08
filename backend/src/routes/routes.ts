import { Router } from "express";
import { store } from "../services/store";

const router = Router();

router.get("/", (_req, res) => {
  res.json(store.getRoutes());
});

export default router;
