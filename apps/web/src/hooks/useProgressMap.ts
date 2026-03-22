import { useQuery } from "@tanstack/react-query";
import type { ProgressRow } from "@turkish/shared";
import { fetchProgress } from "../api";
import { formatProgressStatus } from "../i18n/ru";

export function useProgressMap() {
  const q = useQuery({
    queryKey: ["progress"],
    queryFn: fetchProgress,
  });

  const map = new Map<string, ProgressRow>();
  for (const row of q.data?.items ?? []) {
    map.set(row.contentId, row);
  }

  return { ...q, map };
}

export function statusLabel(status: ProgressRow["status"]): string {
  return formatProgressStatus(status);
}
