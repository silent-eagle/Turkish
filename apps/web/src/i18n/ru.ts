import type { ProgressStatus } from "@turkish/shared";

function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function chaptersCountLabel(n: number): string {
  return `${n} ${pluralRu(n, "глава", "главы", "глав")}`;
}

export function filesCountLabel(n: number): string {
  return `${n} ${pluralRu(n, "файл", "файла", "файлов")}`;
}

/** «month-01» → «Месяц 1» */
export function monthTitle(monthId: string): string {
  const m = /^month-(\d+)$/.exec(monthId);
  if (m) return `Месяц ${parseInt(m[1], 10)}`;
  return monthId;
}

export function formatProgressStatus(status: ProgressStatus | string): string {
  switch (status) {
    case "completed":
      return "Завершено";
    case "in_progress":
      return "В процессе";
    case "not_started":
    default:
      return "Не начато";
  }
}

export const ui = {
  appTitle: "Курс турецкого",
  navMainAria: "Основная навигация",
  nav: {
    course: "Курс",
    exercises: "Упражнения",
    resources: "Ресурсы",
    progress: "Прогресс",
  },
  loading: "Загрузка…",
  loadingCourse: "Загрузка курса…",
  loadManifestError: "Не удалось загрузить оглавление.",
  loadPageError: "Не удалось загрузить страницу.",
  missingMonth: "Месяц не указан.",
  missingContent: "Материал не найден.",

  home: {
    title: "Карта курса",
    chaptersProgress: (done: number, total: number) =>
      `Главы: ${done} из ${total} отмечены как завершённые`,
    loadingProgress: " · загрузка прогресса…",
    openMonth: "Открыть месяц",
    moreInMonth: (n: number) =>
      `Ещё ${n} ${pluralRu(n, "глава", "главы", "глав")} в `,
    thisMonth: "этом месяце",
    chaptersForMonthAria: (month: string) => `Главы — ${monthTitle(month)}`,
  },

  month: {
    backToMap: "← Карта курса",
  },

  reader: {
    backToMap: "Вернуться к карте курса",
    courseMap: "Карта курса",
    progressToolbarAria: "Прогресс по материалу",
    markComplete: "Завершить",
    inProgress: "В процессе",
    reset: "Сброс",
    statusPrefix: "Статус",
    notesLabel: "Заметки к этой главе",
    notesPlaceholder: "Личные заметки (сохраняются при уходе из поля)…",
    savingNotes: "Сохранение заметок…",
  },

  exercises: {
    title: "Упражнения",
  },

  resources: {
    title: "Ресурсы",
  },

  progress: {
    title: "Прогресс",
    intro:
      "Доля завершённых глав по курсу (данные хранятся локально на сервере в SQLite).",
    overall: "Всего",
    byMonth: "По месяцам",
    chaptersDone: (done: number, total: number) =>
      `${done} из ${total} глав завершено`,
    inProgressSection: "В процессе",
    inProgressEmpty:
      "Пока нет глав со статусом «В процессе». Отметьте статус на странице главы.",
    completedSection: "Завершено",
    completedEmpty: "Пока нет глав, отмеченных как завершённые.",
  },

  grammar: {
    introTitle: "О тестах",
    selectTest: "Выберите тест",
    progressAnswered: (answered: number, total: number) =>
      `Ответов: ${answered} из ${total}`,
    scoreLine: (correct: number, total: number, pct: number) =>
      `Верно: ${correct} из ${total} (${pct}%)`,
    resetTest: "Сбросить тест",
    showAllAnswers: "Показать все ответы",
    hideAllAnswers: "Скрыть все ответы",
    correctAnswer: "Правильный ответ",
    yourAnswer: "Ваш ответ",
    optionLabel: (letter: string) => `Вариант ${letter.toUpperCase()}`,
    freePlaceholder: "Введите ответ…",
    checkResult: "Проверка",
    resultOk: "верно",
    resultBad: "неверно",
    notAnswered: "Нет ответа",
    partPoints: (n: number) => `(${n} баллов)`,
    staticSectionHint: "Задание без интерактивной проверки — выполняйте по тексту ниже (ответы в конце раздела в пособии).",
  },
} as const;
