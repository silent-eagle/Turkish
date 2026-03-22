import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";
import type { ContentItem, ContentKind, ManifestResponse } from "@turkish/shared";

function kindFromPath(rel: string): ContentKind {
  if (rel.startsWith("course/month-")) return "chapter";
  if (rel.startsWith("course/exercises/")) return "exercise";
  if (rel.startsWith("course/resources/")) return "resource";
  return "resource";
}

function monthFromPath(rel: string): string | undefined {
  const m = /^course\/month-(\d+)/.exec(rel);
  return m ? `month-${m[1]}` : undefined;
}

async function firstHeadingTitle(absPath: string, fallback: string): Promise<string> {
  const raw = await readFile(absPath, "utf8");
  const lines = raw.split(/\r?\n/).slice(0, 20);
  for (const line of lines) {
    const m = /^#\s+(.+)$/.exec(line.trim());
    if (m) return m[1].trim();
  }
  return fallback;
}

export async function buildManifest(contentRoot: string): Promise<ManifestResponse> {
  const patterns = [
    "course/month-*/chapter-*.md",
    "course/exercises/*.md",
    "course/resources/*.md",
    "course/{content,plan,progress,development-plan}.md",
  ];
  const entries = await fg(patterns, {
    cwd: contentRoot,
    onlyFiles: true,
    unique: true,
  });

  const filtered = entries.filter((p) => {
    const base = p.split("/").pop() ?? "";
    if (base.toLowerCase() === "readme.md") return false;
    return true;
  });

  filtered.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const items: ContentItem[] = [];
  for (const rel of filtered) {
    const abs = join(contentRoot, rel);
    const title = await firstHeadingTitle(abs, rel);
    const id = rel.replace(/\.md$/i, "").replace(/\\/g, "/");
    const kind = kindFromPath(rel);
    items.push({
      id,
      path: rel.replace(/\\/g, "/"),
      title,
      kind,
      month: monthFromPath(rel),
    });
  }

  return {
    items,
    generatedAt: new Date().toISOString(),
  };
}
