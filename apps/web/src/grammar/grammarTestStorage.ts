const PREFIX = "turkish-grammar:v1:";

/** All answers for one page: fullKey `${testId}::${partId}::${num}` → value */
export type GrammarAnswersBlob = Record<string, string>;

export function storageKeyForPage(contentId: string): string {
  return `${PREFIX}${contentId}`;
}

export function loadAllAnswers(contentId: string): GrammarAnswersBlob {
  try {
    const raw = localStorage.getItem(storageKeyForPage(contentId));
    if (!raw) return {};
    const p = JSON.parse(raw) as GrammarAnswersBlob;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

export function saveAllAnswers(contentId: string, answers: GrammarAnswersBlob): void {
  try {
    localStorage.setItem(storageKeyForPage(contentId), JSON.stringify(answers));
  } catch {
    /* ignore quota */
  }
}

/** Remove keys belonging to one test (prefix `testId::`) */
export function clearAnswersForTest(contentId: string, testId: string, all: GrammarAnswersBlob): GrammarAnswersBlob {
  const prefix = `${testId}::`;
  const next: GrammarAnswersBlob = {};
  for (const [k, v] of Object.entries(all)) {
    if (!k.startsWith(prefix)) next[k] = v;
  }
  saveAllAnswers(contentId, next);
  return next;
}

export function questionKey(testId: string, partId: string, num: number): string {
  return `${testId}::${partId}::${num}`;
}
