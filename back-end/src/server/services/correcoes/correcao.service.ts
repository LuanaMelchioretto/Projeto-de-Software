import { ApiError } from '../../lib/api-error';

export type Answer = {
  numero: number;
  resposta: string;
  status: 'OK' | 'EM_BRANCO' | 'MULTIPLA' | 'ILEGIVEL';
};

export type ExamQuestion = {
  id?: number;
  questaoId?: number;
  enunciado: string;
  alternativas: { id: number; texto: string; ehCorreta: boolean }[];
};

export function calcularNota(questions: ExamQuestion[], answers: Answer[]) {
  if (!questions.length) throw new ApiError(400, 'A avaliação não possui questões.');

  if (
    answers.length !== questions.length ||
    new Set(answers.map((answer) => answer.numero)).size !== questions.length ||
    answers.some(
      (answer) =>
        !Number.isInteger(answer.numero) || answer.numero < 1 || answer.numero > questions.length,
    )
  ) {
    throw new ApiError(400, 'Confira as respostas de todas as questões antes de calcular a nota.');
  }

  const questoes = questions.map((question, index) => {
    const answer = answers.find((item) => item.numero === index + 1)!;
    const correctOptions = question.alternativas.filter((option) => option.ehCorreta);

    if (correctOptions.length !== 1)
      throw new ApiError(
        400,
        `A questão ${index + 1} não possui uma única resposta correta. Corrija o cadastro da questão.`,
      );

    const correct = question.alternativas.findIndex((option) => option.ehCorreta);
    const selected = answer.resposta.charCodeAt(0) - 65;

    if (
      answer.status === 'OK' &&
      (!/^[A-Z]$/.test(answer.resposta) || !question.alternativas[selected])
    ) {
      throw new ApiError(
        400,
        `Selecione uma alternativa válida ou marque em branco na questão ${index + 1}.`,
      );
    }

    if (answer.status === 'ILEGIVEL')
      throw new ApiError(400, `Confira a resposta ilegível da questão ${index + 1}.`);

    return {
      numero: index + 1,
      questaoId: question.questaoId ?? question.id!,
      enunciado: question.enunciado,
      marcada:
        answer.status === 'OK'
          ? answer.resposta
          : answer.status === 'EM_BRANCO'
            ? 'Branco'
            : 'Rasura',
      correta: String.fromCharCode(65 + correct),
      status: answer.status,
      acertou: answer.status === 'OK' && selected === correct,
      alternativaId: answer.status === 'OK' ? question.alternativas[selected]!.id : null,
    };
  });
  const acertos = questoes.filter((question) => question.acertou).length;

  return {
    nota: Math.round((acertos * 1000) / questions.length) / 100,
    acertos,
    erros: questions.length - acertos,
    total: questions.length,
    questoes,
  };
}
