import type { GrammarTest, GrammarTestSuite } from "./parseGrammarTests";
import { countQuestions, parseExerciseContentLines, slugTitle } from "./parseGrammarTests";

/**
 * Splits vocabulary-exercises.md into ### sections; each section is parsed with the same
 * rules as grammar tests (MCQ + free «Правильный ответ»). Sections without parseable
 * questions become static markdown tabs.
 */
export function parseVocabularyExercisesMarkdown(fullMarkdown: string): GrammarTestSuite {
  const cut = fullMarkdown.search(/^##\s+Рекомендации\s+по\s+изучению/i);
  const md = cut >= 0 ? fullMarkdown.slice(0, cut) : fullMarkdown;

  const lines = md.split(/\r?\n/);
  const firstSection = lines.findIndex((l) => l.startsWith("### ") && !l.startsWith("####"));
  const introMarkdown =
    firstSection > 0 ? lines.slice(0, firstSection).join("\n").trim() : "";

  const headerPositions: number[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("### ") && !lines[i].startsWith("####")) {
      headerPositions.push(i);
    }
  }

  const tests: GrammarTest[] = [];
  for (let bi = 0; bi < headerPositions.length; bi++) {
    const start = headerPositions[bi];
    const end = bi + 1 < headerPositions.length ? headerPositions[bi + 1] : lines.length;
    const title = lines[start].replace(/^###\s+/, "").trim();
    const bodyLines = lines.slice(start + 1, end);
    const slug = slugTitle(title, bi);
    const contentLines = [`#### ${title}`, ...bodyLines];
    const parts = parseExerciseContentLines(contentLines).map((p, j) => ({
      ...p,
      id: `${slug}-part-${j}`,
    }));

    const nq = countQuestions({ id: slug, title, parts });
    if (nq === 0) {
      tests.push({
        id: slug,
        title,
        parts: [],
        staticMarkdown: bodyLines.join("\n").trim(),
      });
    } else {
      tests.push({ id: slug, title, parts });
    }
  }

  return { introMarkdown, tests };
}
