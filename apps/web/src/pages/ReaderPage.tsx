import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchManifest, fetchMarkdown, patchProgress } from "../api";
import { GrammarTestsView, VocabularyExercisesView } from "../components/GrammarTestsView";
import { MarkdownView } from "../components/MarkdownView";
import { formatProgressStatus, monthTitle, ui } from "../i18n/ru";
import { useProgressMap } from "../hooks/useProgressMap";

export function ReaderPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const id = contentId ? decodeURIComponent(contentId) : "";
  const qc = useQueryClient();

  const manifest = useQuery({ queryKey: ["manifest"], queryFn: fetchManifest });
  const md = useQuery({
    queryKey: ["content", id],
    queryFn: () => fetchMarkdown(id),
    enabled: Boolean(id),
  });
  const { map: progress } = useProgressMap();

  const setStatus = useMutation({
    mutationFn: (status: "not_started" | "in_progress" | "completed") =>
      patchProgress(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["progress"] }),
  });

  const saveNotes = useMutation({
    mutationFn: (notes: string | null) => patchProgress(id, { notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["progress"] }),
  });

  const meta = manifest.data?.items.find((i) => i.id === id);
  const row = progress.get(id);
  const status = row?.status ?? "not_started";
  const primaryMarkComplete = status === "completed";
  const primaryInProgress = status === "in_progress";

  if (!contentId || !id) {
    return <p role="alert">{ui.missingContent}</p>;
  }

  if (md.isLoading) {
    return <p className="muted">{ui.loading}</p>;
  }
  if (md.isError) {
    return (
      <div>
        <p role="alert">{ui.loadPageError}</p>
        <Link to="/">{ui.reader.backToMap}</Link>
      </div>
    );
  }

  return (
    <div>
      <p className="muted" style={{ marginTop: 0 }}>
        <Link to="/">{ui.reader.courseMap}</Link>
        {meta?.month ? (
          <>
            {" · "}
            <Link to={`/month/${meta.month}`}>{monthTitle(meta.month)}</Link>
          </>
        ) : null}
      </p>
      <h1 className="page-title">{meta?.title ?? id}</h1>

      <div className="toolbar" role="group" aria-label={ui.reader.progressToolbarAria}>
        <button
          type="button"
          className={primaryMarkComplete ? "primary" : undefined}
          aria-pressed={primaryMarkComplete}
          disabled={setStatus.isPending}
          onClick={() => setStatus.mutate("completed")}
        >
          {ui.reader.markComplete}
        </button>
        <button
          type="button"
          className={primaryInProgress ? "primary" : undefined}
          aria-pressed={primaryInProgress}
          disabled={setStatus.isPending}
          onClick={() => setStatus.mutate("in_progress")}
        >
          {ui.reader.inProgress}
        </button>
        <button type="button" disabled={setStatus.isPending} onClick={() => setStatus.mutate("not_started")}>
          {ui.reader.reset}
        </button>
        <span className="badge">
          {ui.reader.statusPrefix}: {formatProgressStatus(status)}
        </span>
      </div>

      <label className="sr-only" htmlFor="notes">
        {ui.reader.notesLabel}
      </label>
      <textarea
        key={id}
        id="notes"
        className="notes"
        defaultValue={row?.notes ?? ""}
        placeholder={ui.reader.notesPlaceholder}
        onBlur={(e) => {
          const v = e.target.value.trim();
          saveNotes.mutate(v.length ? v : null);
        }}
      />
      {saveNotes.isPending ? <p className="muted">{ui.reader.savingNotes}</p> : null}

      {id === "course/exercises/grammar-tests" ? (
        <GrammarTestsView markdown={md.data ?? ""} contentId={id} />
      ) : id === "course/exercises/vocabulary-exercises" ? (
        <VocabularyExercisesView markdown={md.data ?? ""} contentId={id} />
      ) : (
        <MarkdownView markdown={md.data ?? ""} />
      )}
    </div>
  );
}
