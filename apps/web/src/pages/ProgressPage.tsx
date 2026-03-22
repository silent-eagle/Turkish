import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchManifest } from "../api";
import { formatProgressStatus, monthTitle, ui } from "../i18n/ru";
import { useProgressMap } from "../hooks/useProgressMap";

export function ProgressPage() {
  const manifest = useQuery({ queryKey: ["manifest"], queryFn: fetchManifest });
  const { map: progress, isLoading: progLoading } = useProgressMap();

  if (manifest.isLoading || progLoading) {
    return <p className="muted">{ui.loading}</p>;
  }
  if (manifest.isError || !manifest.data) {
    return <p role="alert">{ui.loadManifestError}</p>;
  }

  const chapters = manifest.data.items.filter((i) => i.kind === "chapter");
  const byMonth = new Map<string, { total: number; done: number }>();
  for (const c of chapters) {
    const m = c.month ?? "other";
    const cur = byMonth.get(m) ?? { total: 0, done: 0 };
    cur.total += 1;
    if (progress.get(c.id)?.status === "completed") cur.done += 1;
    byMonth.set(m, cur);
  }

  const total = chapters.length;
  const done = chapters.filter((c) => progress.get(c.id)?.status === "completed").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const inProgress = chapters.filter((c) => progress.get(c.id)?.status === "in_progress");
  const completed = chapters.filter((c) => progress.get(c.id)?.status === "completed");

  return (
    <div>
      <h1 className="page-title">{ui.progress.title}</h1>
      <p className="muted">{ui.progress.intro}</p>

      <div className="progress-grid" style={{ marginTop: "1.25rem" }}>
        <section className="card" aria-labelledby="overall-heading">
          <h2 id="overall-heading" style={{ marginTop: 0 }}>
            {ui.progress.overall}
          </h2>
          <p className="stat" aria-live="polite">
            {pct}%
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            {ui.progress.chaptersDone(done, total)}
          </p>
        </section>

        <section className="card" aria-labelledby="months-heading">
          <h2 id="months-heading" style={{ marginTop: 0 }}>
            {ui.progress.byMonth}
          </h2>
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {[...byMonth.entries()]
              .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
              .map(([month, s]) => {
                const p = s.total ? Math.round((s.done / s.total) * 100) : 0;
                return (
                  <li key={month}>
                    <Link to={`/month/${month}`}>{monthTitle(month)}</Link>: {p}% ({s.done}/{s.total})
                  </li>
                );
              })}
          </ul>
        </section>
      </div>

      <section className="card" style={{ marginTop: "1rem" }} aria-labelledby="active-heading">
        <h2 id="active-heading" style={{ marginTop: 0 }}>
          {ui.progress.inProgressSection}
        </h2>
        {inProgress.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            {ui.progress.inProgressEmpty}
          </p>
        ) : (
          <ul className="chapter-list">
            {inProgress.map((item) => (
              <li key={item.id}>
                <Link to={`/read/${encodeURIComponent(item.id)}`}>{item.title}</Link>
                <span className="badge badge--active">{formatProgressStatus(progress.get(item.id)!.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" style={{ marginTop: "1rem" }} aria-labelledby="done-heading">
        <h2 id="done-heading" style={{ marginTop: 0 }}>
          {ui.progress.completedSection}
        </h2>
        {completed.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>
            {ui.progress.completedEmpty}
          </p>
        ) : (
          <ul className="chapter-list">
            {completed.map((item) => (
              <li key={item.id}>
                <Link to={`/read/${encodeURIComponent(item.id)}`}>{item.title}</Link>
                <span className="badge badge--done">{formatProgressStatus(progress.get(item.id)!.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
