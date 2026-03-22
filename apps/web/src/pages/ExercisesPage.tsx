import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchManifest } from "../api";
import { filesCountLabel, formatProgressStatus, ui } from "../i18n/ru";
import { useProgressMap } from "../hooks/useProgressMap";

export function ExercisesPage() {
  const manifest = useQuery({ queryKey: ["manifest"], queryFn: fetchManifest });
  const { map: progress } = useProgressMap();

  if (manifest.isLoading) {
    return <p className="muted">{ui.loading}</p>;
  }
  if (manifest.isError || !manifest.data) {
    return <p role="alert">{ui.loadManifestError}</p>;
  }

  const items = manifest.data.items.filter((i) => i.kind === "exercise");

  return (
    <div>
      <h1 className="page-title">{ui.exercises.title}</h1>
      <p className="muted">{filesCountLabel(items.length)}</p>
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
