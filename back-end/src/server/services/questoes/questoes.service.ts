import { ApiError } from "../../lib";
import { questoesRepository } from "../../repositories";
import { questoesSchemas } from "../../schemas";

const toQuestion = (question: NonNullable<Awaited<ReturnType<typeof questoesRepository.findById>>>) => ({
  id: question.id,
  text: question.enunciado,
  enunciado: question.enunciado,
  disciplina: question.disciplina.nome,
  options: question.alternativas.map((option) => option.texto),
  answer: question.alternativas.findIndex((option) => option.ehCorreta),
  alternativas: question.alternativas,
  image: question.imagemData && question.imagemNome
    ? { name: question.imagemNome, url: question.imagemData }
    : null,
});

export const list = async (professorId: number) =>
  (await questoesRepository.findAllByProfessor(professorId)).map(toQuestion);

export const getById = async (idInput: unknown, professorId: number) => {
  const id = questoesSchemas.questionIdSchema.parse(idInput);
  const question = await questoesRepository.findById(id, professorId);
  if (!question) throw new ApiError(404, "Questão não encontrada");
  return toQuestion(question);
};

export const create = async (input: unknown, professorId: number) => {
  const data = questoesSchemas.questionInputSchema.parse(input);
  const question = await questoesRepository.create(professorId, data);
  return toQuestion(question);
};

export const update = async (idInput: unknown, input: unknown, professorId: number) => {
  const id = questoesSchemas.questionIdSchema.parse(idInput);
  const data = questoesSchemas.questionInputSchema.parse(input);
  const question = await questoesRepository.update(id, professorId, data);
  if (!question) throw new ApiError(404, "Questão não encontrada");
  return toQuestion(question);
};

export const remove = async (idInput: unknown, professorId: number) => {
  const id = questoesSchemas.questionIdSchema.parse(idInput);
  if (!(await questoesRepository.deactivate(id, professorId))) {
    throw new ApiError(404, "Questão não encontrada");
  }
};
