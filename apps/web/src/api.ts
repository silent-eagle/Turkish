import type { ManifestResponse, ProgressListResponse, ProgressPatchBody, ProgressRow } from "@turkish/shared";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function fetchManifest(): Promise<ManifestResponse> {
  const res = await fetch("/api/manifest");
  return json<ManifestResponse>(res);
}

export async function fetchMarkdown(id: string): Promise<string> {
  const res = await fetch(`/api/content/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.text();
}

export async function fetchProgress(): Promise<ProgressListResponse> {
  const res = await fetch("/api/progress");
  return json<ProgressListResponse>(res);
}

export async function patchProgress(contentId: string, body: ProgressPatchBody): Promise<ProgressRow> {
  const res = await fetch(`/api/progress/${encodeURIComponent(contentId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return json<ProgressRow>(res);
}
