export const OPTION_LABELS = ["A", "B", "C", "D", "E"];
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = OPTION_LABELS.length;
export const DEFAULT_OPTION_COUNT = MAX_OPTIONS;

export const PREVIEW_LENGTH = 320;
export const COMPACT_OPTION_LENGTH = 48;

export function createQuestionDraft(question) {
  return {
    text: question?.text ?? "",
    options: question ? [...question.options] : Array.from({ length: DEFAULT_OPTION_COUNT }, () => ""),
    answer: question?.answer ?? null,
    image: question?.image ? { ...question.image } : null,
  };
}

export function validateQuestion(draft) {
  const errors = {};
  
  if (!draft.text.trim()) errors.text = "Informe o enunciado da questão.";

  if (draft.options.length < MIN_OPTIONS || draft.options.length > MAX_OPTIONS) {
    errors.options = `Informe de ${MIN_OPTIONS} a ${MAX_OPTIONS} alternativas.`;
  }

  const normalizedOptions = draft.options.map((option) =>
    option.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt-BR"),
  );

  normalizedOptions.forEach((option, index) => {
    if (!option) {
      errors[`option${index}`] = `Preencha a alternativa ${OPTION_LABELS[index]}.`;
    } else if (normalizedOptions.indexOf(option) !== index) {
      errors[`option${index}`] = "Use um texto diferente para cada alternativa.";
    }
  });

  if (!Number.isInteger(draft.answer) || draft.answer < 0 || draft.answer >= draft.options.length) {
    errors.answer = "Selecione uma única alternativa correta.";
  }
  return errors;
}

export function addOption(draft) {
  if (draft.options.length >= MAX_OPTIONS) return draft;
  return { ...draft, options: [...draft.options, ""] };
}

export function removeOption(draft, index) {
  if (draft.options.length <= MIN_OPTIONS) return draft;
  if (index < 0 || index >= draft.options.length) return draft;

  let answer = draft.answer;

  if (answer === index) answer = null;
  else if (Number.isInteger(answer) && answer > index) answer -= 1;

  return {
    ...draft,
    options: draft.options.filter((option, optionIndex) => optionIndex !== index),
    answer,
  };
}

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

function normalizeSearch(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();
}

export function filterQuestions(questions, search) {
  const query = normalizeSearch(search);
  return questions.filter((question) => normalizeSearch(question.text).includes(query));
}

export function saveQuestionInBank(questions, draft, questionId = null) {
  if (Object.keys(validateQuestion(draft)).length) {
    throw new Error("Não foi possível salvar. Revise os campos da questão.");
  }

  const existing = questions.find((question) => question.id === questionId);

  if (questionId !== null && !existing) {
    throw new Error("A questão não foi encontrada. Volte ao banco e tente novamente.");
  }
  const question = {
    ...existing,
    id: existing?.id ?? Math.max(0, ...questions.map((item) => item.id)) + 1,
    text: draft.text.trim(),
    options: draft.options.map((option) => option.trim()),
    answer: draft.answer,
    image: draft.image ? { ...draft.image } : null,
  };

  return {
    question,
    questions: existing
      ? questions.map((item) => item.id === questionId ? question : item)
      : [question, ...questions],
  };
}
