import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { ContentItem } from "@turkish/shared";
import { fetchManifest } from "../api";
import { chaptersCountLabel, formatProgressStatus, monthTitle, ui } from "../i18n/ru";
import { useProgressMap } from "../hooks/useProgressMap";

function groupByMonth(items: ContentItem[]) {
  const chapters = items.filter((i) => i.kind === "chapter");
  const byMonth = new Map<string, ContentItem[]>();
  for (const c of chapters) {
    const m = c.month ?? "other";
    const list = byMonth.get(m) ?? [];
    list.push(c);
    byMonth.set(m, list);
  }
  return [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
}

export function HomePage() {
  const manifest = useQuery({ queryKey: ["manifest"], queryFn: fetchManifest });
  const { map: progress, isLoading: progLoading } = useProgressMap();

  if (manifest.isLoading) {
    return <p className="muted">{ui.loadingCourse}</p>;
  }
  if (manifest.isError || !manifest.data) {
    return <p role="alert">{ui.loadManifestError}</p>;
  }

  const groups = groupByMonth(manifest.data.items);
  const totalChapters = manifest.data.items.filter((i) => i.kind === "chapter").length;
  const completed = manifest.data.items.filter(
    (i) => i.kind === "chapter" && progress.get(i.id)?.status === "completed"
  ).length;

  return (
    <div>
      <h1 className="page-title">{ui.home.title}</h1>
      <p className="muted">
        {ui.home.chaptersProgress(completed, totalChapters)}
        {progLoading ? ui.home.loadingProgress : null}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.25rem" }}>
        {groups.map(([month, list]) => (
          <section key={month} className="card">
            <h2 style={{ marginTop: 0 }}>{monthTitle(month)}</h2>
            <p className="muted" style={{ marginTop: "-0.35rem" }}>
              {chaptersCountLabel(list.length)} · <Link to={`/month/${month}`}>{ui.home.openMonth}</Link>
            </p>
            <ul className="chapter-list" aria-label={ui.home.chaptersForMonthAria(month)}>
              {list.slice(0, 5).map((item) => {
                const st = progress.get(item.id)?.status ?? "not_started";
                return (
                  <li key={item.id}>
                    <Link to={`/read/${encodeURIComponent(item.id)}`}>{item.title}</Link>
                    <span
                      className={`badge ${st === "completed" ? "badge--done" : st === "in_progress" ? "badge--active" : ""}`}
                    >
                      {formatProgressStatus(st)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {list.length > 5 ? (
              <p className="muted" style={{ marginBottom: 0 }}>
                {ui.home.moreInMonth(list.length - 5)}
                <Link to={`/month/${month}`}>{ui.home.thisMonth}</Link>
              </p>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
