import express from "express";
import cors from "cors";
import postsRouter from "./routes/posts";
import channelsRouter from "./routes/channels";
import routesRouter from "./routes/routes";
import adminRouter from "./routes/admin";
import configRouter from "./routes/config";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "taxi-collector-backend", demo: true });
});

app.use("/api/posts", postsRouter);
app.use("/api/channels", channelsRouter);
app.use("/api/routes", routesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/config", configRouter);

app.listen(PORT, () => {
  console.log(`🚕 Taxi Collector backend running on http://localhost:${PORT}`);
});
