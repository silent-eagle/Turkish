import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repo root when running from apps/api (src or dist). */
export function defaultContentRoot(): string {
  return resolve(__dirname, "..", "..", "..");
}

export function resolveContentRoot(envPath: string | undefined): string {
  if (envPath?.trim()) {
    return resolve(envPath);
  }
  return defaultContentRoot();
}

export function resolveDatabasePath(envPath: string | undefined, contentRoot: string): string {
  if (envPath?.trim()) {
    return resolve(envPath);
  }
  return join(contentRoot, "data", "app.db");
}

export function resolveWebDist(contentRoot: string): string {
  return join(contentRoot, "apps", "web", "dist");
}
