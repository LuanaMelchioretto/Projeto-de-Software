export const OPTION_LABELS = ["A", "B", "C", "D"];

export function createQuestionDraft(question) {
  return {
    text: question?.text ?? "",
    options: question ? [...question.options] : OPTION_LABELS.map(() => ""),
    answer: question?.answer ?? null,
  };
}

export function validateQuestion(draft) {
  const errors = {};
  if (!draft.text.trim()) errors.text = "Informe o enunciado da questão.";

  if (draft.options.length !== OPTION_LABELS.length) {
    errors.options = "Preencha as quatro alternativas.";
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

function normalizeSearch(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "")
    .toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();
}

export function filterQuestions(questions, search) {
  const query = normalizeSearch(search);
  return questions.filter((question) => normalizeSearch(question.text).includes(query));
}

// Mantém os mocks originais intactos e preserva o identificador na edição.
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
  };
  return {
    question,
    questions: existing
      ? questions.map((item) => item.id === questionId ? question : item)
      : [question, ...questions],
  };
}
