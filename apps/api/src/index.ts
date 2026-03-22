import cors from "cors";
import express from "express";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import type { ProgressPatchBody } from "@turkish/shared";
import { buildManifest } from "./manifest.js";
import { openDatabase, listProgress, upsertProgress } from "./db.js";
import {
  resolveContentRoot,
  resolveDatabasePath,
  resolveWebDist,
} from "./paths.js";

const PORT = Number(process.env.PORT ?? 3001);
const contentRoot = resolveContentRoot(process.env.CONTENT_ROOT);
const databasePath = resolveDatabasePath(process.env.DATABASE_PATH, contentRoot);
const webDist = resolveWebDist(contentRoot);
const serveStatic = process.env.SERVE_STATIC !== "0";

const db = openDatabase(databasePath);
const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

let cachedManifest: Awaited<ReturnType<typeof buildManifest>> | null = null;

async function getManifest() {
  if (!cachedManifest) {
    cachedManifest = await buildManifest(contentRoot);
  }
  return cachedManifest;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, contentRoot, databasePath });
});

app.get("/api/manifest", async (_req, res, next) => {
  try {
    const manifest = await getManifest();
    res.json(manifest);
  } catch (e) {
    next(e);
  }
});

app.post("/api/manifest/refresh", async (_req, res, next) => {
  try {
    cachedManifest = null;
    const manifest = await getManifest();
    res.json(manifest);
  } catch (e) {
    next(e);
  }
});

/** GET raw markdown for a content id (path without .md), e.g. course/month-01/chapter-01-01 */
app.get("/api/content/:id", async (req, res, next) => {
  try {
    const id = decodeURIComponent(req.params.id);
    if (!id || id.includes("..")) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const relPath = id.endsWith(".md") ? id : `${id}.md`;
    const abs = join(contentRoot, relPath);
    const text = await readFile(abs, "utf8");
    res.type("text/markdown; charset=utf-8").send(text);
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      res.status(404).json({ error: "Not found" });
      return;
    }
    next(e);
  }
});

app.get("/api/progress", (_req, res) => {
  res.json({ items: listProgress(db) });
});

app.patch("/api/progress/:contentId", (req, res) => {
  const raw = req.params.contentId;
  if (!raw || raw.includes("..")) {
    res.status(400).json({ error: "Invalid content id" });
    return;
  }
  const contentId = decodeURIComponent(raw);
  const body = req.body as ProgressPatchBody;
  const row = upsertProgress(db, contentId, body);
  res.json(row);
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

if (serveStatic && existsSync(webDist)) {
  app.use(express.static(webDist, { index: false }));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.sendFile(join(webDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
  console.log(`CONTENT_ROOT=${contentRoot}`);
  console.log(`DATABASE_PATH=${databasePath}`);
  if (serveStatic) {
    console.log(`Static (if present): ${webDist}`);
  }
});
