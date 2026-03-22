export type ContentKind = "chapter" | "exercise" | "resource";

export interface ContentItem {
  id: string;
  /** Relative path without leading slash, e.g. course/month-01/chapter-01-01.md */
  path: string;
  title: string;
  kind: ContentKind;
  /** e.g. month-01 for chapters */
  month?: string;
}

export interface ManifestResponse {
  items: ContentItem[];
  generatedAt: string;
}

export type ProgressStatus = "not_started" | "in_progress" | "completed";

export interface ProgressRow {
  contentId: string;
  status: ProgressStatus;
  lastOpenedAt: string | null;
  completedAt: string | null;
  notes: string | null;
}

export interface ProgressPatchBody {
  status?: ProgressStatus;
  notes?: string | null;
  /** When true, sets lastOpenedAt to now (e.g. on chapter open) */
  touch?: boolean;
}

export interface ProgressListResponse {
  items: ProgressRow[];
}
