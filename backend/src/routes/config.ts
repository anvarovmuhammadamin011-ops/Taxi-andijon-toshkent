import { Router } from "express";
import { store } from "../services/store";
import { verifyToken } from "../services/auth";

const router = Router();

router.get("/", (req, res) => {
  const isAdmin = verifyToken(req.header("x-admin-token"));
  res.json(store.getConfig(isAdmin));
});

export default router;
