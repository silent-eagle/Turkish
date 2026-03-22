import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchManifest } from "../api";
import { chaptersCountLabel, formatProgressStatus, monthTitle, ui } from "../i18n/ru";
import { useProgressMap } from "../hooks/useProgressMap";

export function MonthPage() {
  const { monthId } = useParams<{ monthId: string }>();
  const manifest = useQuery({ queryKey: ["manifest"], queryFn: fetchManifest });
  const { map: progress } = useProgressMap();

  if (!monthId) {
    return <p role="alert">{ui.missingMonth}</p>;
  }

  if (manifest.isLoading) {
    return <p className="muted">{ui.loading}</p>;
  }
  if (manifest.isError || !manifest.data) {
    return <p role="alert">{ui.loadManifestError}</p>;
  }

  const items = manifest.data.items.filter((i) => i.kind === "chapter" && i.month === monthId);

  return (
    <div>
      <p className="muted" style={{ marginTop: 0 }}>
        <Link to="/">{ui.month.backToMap}</Link>
      </p>
      <h1 className="page-title">{monthTitle(monthId)}</h1>
      <p className="muted">{chaptersCountLabel(items.length)}</p>
      <ul className="chapter-list" style={{ marginTop: "1rem" }}>
        {items.map((item) => {
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
    </div>
  );
}
