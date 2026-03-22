/** Parses exercises/grammar-tests.md into structured tests for the interactive UI. */

export type McqOption = { key: string; text: string };

export type GrammarQuestion =
  | {
      type: "mcq";
      num: number;
      prompt: string;
      options: McqOption[];
      correct: string;
    }
  | {
      type: "free";
      num: number;
      prompt: string;
      correct: string;
    };

export type GrammarPart = {
  id: string;
  title: string;
  questions: GrammarQuestion[];
};

export type GrammarTest = {
  id: string;
  title: string;
  parts: GrammarPart[];
  /** When the section has no auto-gradable questions, show this as read-only markdown. */
  staticMarkdown?: string;
};

export type GrammarTestSuite = {
  introMarkdown: string;
  tests: GrammarTest[];
};

const Q_START = /^\s*(\d+)\.\s+(.+)$/;
const MCQ_OPT = /^\s*-\s+([a-z])\)\s*(.*)$/i;
const FREE_ANS = /^\s*-\s*Правильный ответ:\s*(.+)$/i;
const ANSWERS_LINE = /^\*\*Ответы:\*\*\s*(.+)$/i;

function parseAnswersLine(line: string): Map<number, string> {
  const m = line.match(ANSWERS_LINE);
  if (!m) return new Map();
  const map = new Map<number, string>();
  for (const piece of m[1].split(/,\s*/)) {
    const p = piece.trim().match(/^(\d+)\s*-\s*([a-z])/i);
    if (p) map.set(Number(p[1]), p[2].toLowerCase());
  }
  return map;
}

export function slugTitle(title: string, index: number): string {
  const s = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return s || `test-${index}`;
}

type Wip = {
  num: number;
  prompt: string;
  options: McqOption[];
};

/** Parses one exercise block (optionally with #### subparts). Exported for vocabulary and other exercise pages. */
export function parseExerciseContentLines(contentLines: string[]): GrammarPart[] {
  const byNum = new Map<number, GrammarQuestion>();
  const parts: GrammarPart[] = [];

  let partTitle = "";
  let partQuestions: GrammarQuestion[] = [];
  let partIndex = 0;
  let wip: Wip | null = null;

  const flushWip = () => {
    if (!wip) return;
    if (wip.options.length >= 2) {
      const q: GrammarQuestion = {
        type: "mcq",
        num: wip.num,
        prompt: wip.prompt.trim(),
        options: wip.options,
        correct: wip.options[0]?.key ?? "a",
      };
      partQuestions.push(q);
      byNum.set(wip.num, q);
    }
    wip = null;
  };

  const startPart = (title: string) => {
    flushWip();
    if (partTitle && partQuestions.length) {
      parts.push({
        id: `part-${partIndex}`,
        title: partTitle,
        questions: partQuestions,
      });
      partIndex += 1;
    }
    partTitle = title;
    partQuestions = [];
  };

  for (const line of contentLines) {
    if (/^\*\*Итого:\*\*/i.test(line)) continue;

    if (line.startsWith("#### ") && !line.startsWith("#####")) {
      startPart(line.replace(/^####\s+/, "").trim());
      continue;
    }

    const al = line.match(ANSWERS_LINE);
    if (al) {
      flushWip();
      const map = parseAnswersLine(line);
      for (const [num, letter] of map) {
        const q = byNum.get(num);
        if (q && q.type === "mcq") q.correct = letter;
      }
      continue;
    }

    const qm = line.match(Q_START);
    if (qm) {
      flushWip();
      wip = { num: Number(qm[1]), prompt: qm[2], options: [] };
      continue;
    }

    const freeM = line.match(FREE_ANS);
    if (freeM && wip) {
      let ans = freeM[1].trim();
      if (ans.startsWith('"') && ans.endsWith('"')) ans = ans.slice(1, -1);
      const fq: GrammarQuestion = {
        type: "free",
        num: wip.num,
        prompt: wip.prompt.trim(),
        correct: ans,
      };
      partQuestions.push(fq);
      byNum.set(wip.num, fq);
      wip = null;
      continue;
    }

    const om = line.match(MCQ_OPT);
    if (om && wip) {
      wip.options.push({ key: om[1].toLowerCase(), text: om[2].trim() });
    }
  }

  flushWip();
  if (partTitle && partQuestions.length) {
    parts.push({
      id: `part-${partIndex}`,
      title: partTitle,
      questions: partQuestions,
    });
  }

  return parts.filter((p) => p.questions.length > 0);
}

function splitIntoTestBlocks(lines: string[]): string[][] {
  const blocks: string[][] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith("### ") && !l.startsWith("####") && /Тест|Итоговый/i.test(l)) {
      const start = i;
      i += 1;
      while (i < lines.length) {
        const l2 = lines[i];
        if (l2.trim() === "---") {
          i += 1;
          break;
        }
        if (
          l2.startsWith("### ") &&
          !l2.startsWith("####") &&
          i > start &&
          /Тест|Итоговый/i.test(l2)
        ) {
          break;
        }
        i += 1;
      }
      blocks.push(lines.slice(start, i));
      continue;
    }
    i += 1;
  }
  return blocks;
}

export function parseGrammarTestsMarkdown(fullMarkdown: string): GrammarTestSuite {
  const cut = fullMarkdown.search(/^##\s+Ключи\s/i);
  const md = cut >= 0 ? fullMarkdown.slice(0, cut) : fullMarkdown;

  const lines = md.split(/\r?\n/);
  const firstTestIdx = lines.findIndex(
    (l) => l.startsWith("### ") && !l.startsWith("####") && /Тест|Итоговый/i.test(l)
  );
  const introMarkdown =
    firstTestIdx > 0 ? lines.slice(0, firstTestIdx).join("\n").trim() : "";

  const fromIdx = firstTestIdx >= 0 ? firstTestIdx : 0;
  const blocks = splitIntoTestBlocks(lines.slice(fromIdx));

  const tests: GrammarTest[] = [];
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    if (!block.length) continue;
    const title = block[0].replace(/^###\s+/, "").trim();
    const slug = slugTitle(title, bi);
    const contentLines = block.slice(1);
    const parts = parseExerciseContentLines(contentLines).map((p, j) => ({
      ...p,
      id: `${slug}-part-${j}`,
    }));
    if (!parts.length) continue;
    tests.push({ id: slug, title, parts });
  }

  return { introMarkdown, tests };
}

export function countQuestions(test: GrammarTest): number {
  return test.parts.reduce((s, p) => s + p.questions.length, 0);
}

export function normalizeFreeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:«»"""'''`]/g, "")
    .trim();
}

export function scoreFreeAnswer(user: string, correct: string): boolean {
  const u = normalizeFreeText(user);
  const c = normalizeFreeText(correct);
  if (!u || !c) return false;
  if (u === c) return true;
  return c.includes(u) || u.includes(c);
}
