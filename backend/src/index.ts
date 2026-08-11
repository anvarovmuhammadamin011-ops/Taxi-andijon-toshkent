import express from "express";
import cors from "cors";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import postsRouter from "./routes/posts";
import channelsRouter from "./routes/channels";
import routesRouter from "./routes/routes";
import configRouter from "./routes/config";
import { startDeliveryScheduler } from "./services/delivery";
import { startMonitor, pollIfStale, rescanChannels } from "./services/monitor";
import { store } from "./services/store";
import { kvDelete } from "./services/persistence";

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
  res.json({ status: "ok", service: "taxi-collector-backend", demo: false });
});

app.use("/api/posts", postsRouter);
app.use("/api/channels", channelsRouter);
app.use("/api/routes", routesRouter);
app.use("/api/config", configRouter);

app.get("/api/cron/poll", async (_req, res) => {
  try {
    const added = await pollIfStale(60_000);
    res.json({ ok: true, added });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/api/admin/rescan", async (_req, res) => {
  try {
    const token = process.env.ADMIN_TOKEN || "taxsipoll";
    if (_req.query.token !== token) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    const result = await rescanChannels();
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/api/admin/test-push", async (_req, res) => {
  try {
    const token = process.env.ADMIN_TOKEN || "taxsipoll";
    if (_req.query.token !== token) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    const { pushNotifyPhone } = await import("./services/notify");
    const testPost = {
      id: "ptest",
      channelId: "test",
      channelTitle: "Test Kanal",
      channelUrl: "https://t.me/test",
      text: "🚕 Test notification\n\nТошкентга юрамиз 2та кам\n\n📞 998901234567",
      route: "Toshkent -> Andijon",
      from: "Toshkent",
      to: "Andijon",
      phone: "998901234567",
      postedAt: new Date().toISOString(),
      messageId: 0,
      alsoIn: [],
    };
    pushNotifyPhone(testPost as any);
    res.json({ ok: true, message: "Push sent" });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/api/admin/reset", async (_req, res) => {
  try {
    const token = process.env.ADMIN_TOKEN || "taxsipoll";
    if (_req.query.token !== token) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    await store.ready();
    await kvDelete();
    store.clearAll();
    const result = await rescanChannels();
    res.json({ ok: true, reset: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 4000;
  app.listen(PORT, () => {
    console.log(`🚕 Taxi Collector backend running on http://localhost:${PORT}`);
  });
  startDeliveryScheduler();
  startMonitor();
}

export default app;
