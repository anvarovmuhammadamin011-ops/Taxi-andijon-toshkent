import express from "express";
import cors from "cors";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import postsRouter from "./routes/posts";
import channelsRouter from "./routes/channels";
import routesRouter from "./routes/routes";
import adminRouter from "./routes/admin";
import configRouter from "./routes/config";
import { startDeliveryScheduler } from "./services/delivery";

function loadEnv(): void {
  try {
    const p = join(__dirname, "..", ".env");
    if (existsSync(p)) {
      for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
      }
    }
  } catch {
    /* noop */
  }
}
loadEnv();

const app = express();

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

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 4000;
  app.listen(PORT, () => {
    console.log(`🚕 Taxi Collector backend running on http://localhost:${PORT}`);
  });
  startDeliveryScheduler();
}

export default app;
