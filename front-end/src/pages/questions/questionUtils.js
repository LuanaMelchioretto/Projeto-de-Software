export const OPTION_LABELS = ["A", "B", "C", "D", "E"];
export const PREVIEW_LENGTH = 320;
export const COMPACT_OPTION_LENGTH = 48;

export function buildStatementPreview(text, limit = PREVIEW_LENGTH) {
  const statement = text.trim();

  if (statement.length <= limit) return statement;

  const lastSpace = statement.slice(0, limit + 1).lastIndexOf(" ");
  const cut = lastSpace > limit * 0.6 ? lastSpace : limit;

  return `${statement.slice(0, cut).replace(/[\s,;:.]+$/, "")}…`;
}

export function isCompactOptionList(options) {
  return options.every((option) => option.trim().length <= COMPACT_OPTION_LENGTH);
}

export function filterQuestions(questions, search) {
  const normalize = (text) => text.normalize("NFD").replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();
  const query = normalize(search);
  return questions.filter((question) => normalize(question.text).includes(query));
}
