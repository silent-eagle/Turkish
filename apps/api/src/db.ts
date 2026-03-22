import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { ProgressPatchBody, ProgressRow, ProgressStatus } from "@turkish/shared";

export function openDatabase(dbPath: string): Database.Database {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS progress (
      content_id TEXT PRIMARY KEY NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_started',
      last_opened_at TEXT,
      completed_at TEXT,
      notes TEXT
    );
  `);
  return db;
}

export function listProgress(db: Database.Database): ProgressRow[] {
  const rows = db
    .prepare(
      `SELECT content_id, status, last_opened_at, completed_at, notes FROM progress ORDER BY content_id`
    )
    .all() as Array<{
      content_id: string;
      status: string;
      last_opened_at: string | null;
      completed_at: string | null;
      notes: string | null;
    }>;
  return rows.map((r) => ({
    contentId: r.content_id,
    status: r.status as ProgressStatus,
    lastOpenedAt: r.last_opened_at,
    completedAt: r.completed_at,
    notes: r.notes,
  }));
}

export function getProgress(db: Database.Database, contentId: string): ProgressRow | undefined {
  const r = db
    .prepare(
      `SELECT content_id, status, last_opened_at, completed_at, notes FROM progress WHERE content_id = ?`
    )
    .get(contentId) as
    | {
        content_id: string;
        status: string;
        last_opened_at: string | null;
        completed_at: string | null;
        notes: string | null;
      }
    | undefined;
  if (!r) return undefined;
  return {
    contentId: r.content_id,
    status: r.status as ProgressStatus,
    lastOpenedAt: r.last_opened_at,
    completedAt: r.completed_at,
    notes: r.notes,
  };
}

export function upsertProgress(
  db: Database.Database,
  contentId: string,
  patch: ProgressPatchBody
): ProgressRow {
  const now = new Date().toISOString();
  const existing = getProgress(db, contentId);
  let status: ProgressStatus = existing?.status ?? "not_started";
  let lastOpenedAt = existing?.lastOpenedAt ?? null;
  let completedAt = existing?.completedAt ?? null;
  let notes = existing?.notes ?? null;

  if (patch.touch) {
    lastOpenedAt = now;
    if (status === "not_started") status = "in_progress";
  }
  if (patch.status !== undefined) {
    status = patch.status;
    if (patch.status === "completed") {
      completedAt = now;
    } else {
      completedAt = null;
    }
  }
  if (patch.notes !== undefined) {
    notes = patch.notes;
  }

  db.prepare(
    `INSERT INTO progress (content_id, status, last_opened_at, completed_at, notes)
     VALUES (@content_id, @status, @last_opened_at, @completed_at, @notes)
     ON CONFLICT(content_id) DO UPDATE SET
       status = excluded.status,
       last_opened_at = excluded.last_opened_at,
       completed_at = excluded.completed_at,
       notes = excluded.notes`
  ).run({
    content_id: contentId,
    status,
    last_opened_at: lastOpenedAt,
    completed_at: completedAt,
    notes,
  });

  return getProgress(db, contentId)!;
}
