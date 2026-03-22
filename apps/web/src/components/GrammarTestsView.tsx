import { useCallback, useMemo, useState } from "react";
import type { GrammarQuestion, GrammarTest, GrammarTestSuite } from "../grammar/parseGrammarTests";
import {
  countQuestions,
  parseGrammarTestsMarkdown,
  scoreFreeAnswer,
} from "../grammar/parseGrammarTests";
import { parseVocabularyExercisesMarkdown } from "../grammar/parseVocabularyExercises";
import {
  clearAnswersForTest,
  loadAllAnswers,
  questionKey,
  saveAllAnswers,
  type GrammarAnswersBlob,
} from "../grammar/grammarTestStorage";
import { ui } from "../i18n/ru";
import { MarkdownView } from "./MarkdownView";

function scoreTest(test: GrammarTest, answers: GrammarAnswersBlob): {
  correct: number;
  total: number;
  pct: number;
} {
  let correct = 0;
  let total = 0;
  for (const part of test.parts) {
    for (const q of part.questions) {
      total += 1;
      const k = questionKey(test.id, part.id, q.num);
      const v = (answers[k] ?? "").trim();
      if (q.type === "mcq") {
        if (v === q.correct) correct += 1;
      } else if (q.type === "free" && v) {
        if (scoreFreeAnswer(v, q.correct)) correct += 1;
      }
    }
  }
  return { correct, total, pct: total ? Math.round((correct / total) * 100) : 0 };
}

function countAnswered(test: GrammarTest, answers: GrammarAnswersBlob): number {
  let n = 0;
  for (const part of test.parts) {
    for (const q of part.questions) {
      const k = questionKey(test.id, part.id, q.num);
      if ((answers[k] ?? "").trim()) n += 1;
    }
  }
  return n;
}

interface InteractiveExerciseSuiteProps {
  markdown: string;
  contentId: string;
  parseSuite: (md: string) => GrammarTestSuite;
}

function InteractiveExerciseSuite({ markdown, contentId, parseSuite }: InteractiveExerciseSuiteProps) {
  const suite = useMemo(() => parseSuite(markdown), [markdown, parseSuite]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<GrammarAnswersBlob>(() => loadAllAnswers(contentId));
  const [revealAll, setRevealAll] = useState(false);

  const activeTest = suite.tests[activeIdx];
  const totalQ = activeTest ? countQuestions(activeTest) : 0;
  const isStaticOnly = Boolean(activeTest?.staticMarkdown) && totalQ === 0;
  const score = activeTest && totalQ > 0 ? scoreTest(activeTest, answers) : null;
  const answered = activeTest && totalQ > 0 ? countAnswered(activeTest, answers) : 0;

  const setAnswer = useCallback(
    (key: string, value: string) => {
      setAnswers((prev) => {
        const next = { ...prev, [key]: value };
        saveAllAnswers(contentId, next);
        return next;
      });
    },
    [contentId]
  );

  const resetCurrent = useCallback(() => {
    if (!activeTest) return;
    setAnswers((prev) => clearAnswersForTest(contentId, activeTest.id, prev));
  }, [activeTest, contentId]);

  return (
    <div className="grammar-tests">
      {suite.introMarkdown ? (
        <section className="grammar-intro card">
          <MarkdownView markdown={suite.introMarkdown} />
        </section>
      ) : null}

      {suite.tests.length === 0 ? (
        <p className="muted">Не удалось разобрать упражнения в этом файле.</p>
      ) : (
        <>
          <div className="grammar-test-tabs" role="tablist" aria-label={ui.grammar.selectTest}>
            {suite.tests.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={i === activeIdx}
                className={`grammar-tab ${i === activeIdx ? "grammar-tab--active" : ""}`}
                onClick={() => setActiveIdx(i)}
                title={t.title}
              >
                {t.title.length > 56 ? `${t.title.slice(0, 54)}…` : t.title}
              </button>
            ))}
          </div>

          {activeTest && isStaticOnly && activeTest.staticMarkdown ? (
            <section className="grammar-part card">
              <p className="muted" style={{ marginTop: 0 }}>
                {ui.grammar.staticSectionHint}
              </p>
              <MarkdownView markdown={activeTest.staticMarkdown} />
            </section>
          ) : null}

          {activeTest && !isStaticOnly && score && totalQ > 0 ? (
            <>
              <div className="grammar-toolbar card" role="region" aria-label="Прогресс по тесту">
                <div className="grammar-toolbar-stats">
                  <span>{ui.grammar.progressAnswered(answered, totalQ)}</span>
                  <span className="grammar-toolbar-score">{ui.grammar.scoreLine(score.correct, score.total, score.pct)}</span>
                </div>
                <div className="grammar-toolbar-actions">
                  <button type="button" onClick={resetCurrent}>
                    {ui.grammar.resetTest}
                  </button>
                  <button type="button" className="primary" onClick={() => setRevealAll((r) => !r)}>
                    {revealAll ? ui.grammar.hideAllAnswers : ui.grammar.showAllAnswers}
                  </button>
                </div>
              </div>

              {activeTest.parts.map((part) => (
                <section key={part.id} className="grammar-part card">
                  <h3 className="grammar-part-title">{part.title}</h3>
                  <div className="grammar-part-body">
                    {part.questions.map((q) => (
                      <QuestionBlock
                        key={questionKey(activeTest.id, part.id, q.num)}
                        test={activeTest}
                        partId={part.id}
                        question={q}
                        answers={answers}
                        setAnswer={setAnswer}
                        revealAll={revealAll}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

function QuestionBlock({
  test,
  partId,
  question,
  answers,
  setAnswer,
  revealAll,
}: {
  test: GrammarTest;
  partId: string;
  question: GrammarQuestion;
  answers: GrammarAnswersBlob;
  setAnswer: (k: string, v: string) => void;
  revealAll: boolean;
}) {
  const k = questionKey(test.id, partId, question.num);
  const val = answers[k] ?? "";

  let correctLabel = "";
  if (question.type === "mcq") {
    const opt = question.options.find((o) => o.key === question.correct);
    correctLabel = opt ? `${question.correct}) ${opt.text}` : question.correct;
  } else {
    correctLabel = question.correct;
  }

  const isCorrect =
    question.type === "mcq"
      ? val === question.correct
      : val.trim()
        ? scoreFreeAnswer(val, question.correct)
        : false;

  return (
    <div className={`grammar-q ${val && question.type === "mcq" ? (isCorrect ? "grammar-q--ok" : "grammar-q--bad") : ""}`}>
      <p className="grammar-q-prompt">
        <span className="grammar-q-num">{question.num}.</span> {question.prompt}
      </p>
      {question.type === "mcq" ? (
        <fieldset className="grammar-q-mcq">
          <legend className="sr-only">
            Вопрос {question.num}: варианты ответа
          </legend>
          {question.options.map((o) => (
            <label key={o.key} className="grammar-q-opt">
              <input
                type="radio"
                name={k}
                value={o.key}
                checked={val === o.key}
                onChange={() => setAnswer(k, o.key)}
              />
              <span>
                {o.key}) {o.text}
              </span>
            </label>
          ))}
        </fieldset>
      ) : (
        <textarea
          className="grammar-q-free"
          rows={3}
          placeholder={ui.grammar.freePlaceholder}
          value={val}
          onChange={(e) => setAnswer(k, e.target.value)}
        />
      )}

      <details className="grammar-details" open={revealAll ? true : undefined} key={`${k}-rev-${revealAll}`}>
        <summary>{ui.grammar.correctAnswer}</summary>
        <div className="grammar-details-body">
          <p>{correctLabel}</p>
          {question.type === "free" && val.trim() ? (
            <p className={isCorrect ? "grammar-ok" : "grammar-bad"}>
              {ui.grammar.checkResult}: {isCorrect ? ui.grammar.resultOk : ui.grammar.resultBad}
            </p>
          ) : null}
        </div>
      </details>
    </div>
  );
}

type SuiteProps = Omit<InteractiveExerciseSuiteProps, "parseSuite">;

export function GrammarTestsView(props: SuiteProps) {
  return <InteractiveExerciseSuite {...props} parseSuite={parseGrammarTestsMarkdown} />;
}

export function VocabularyExercisesView(props: SuiteProps) {
  return <InteractiveExerciseSuite {...props} parseSuite={parseVocabularyExercisesMarkdown} />;
}
