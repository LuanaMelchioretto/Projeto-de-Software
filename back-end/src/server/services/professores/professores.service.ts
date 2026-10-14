import { ApiError, hashPassword } from "../../lib";
import { professoresRepository } from "../../repositories";
import { professoresSchemas } from "../../schemas";

export const create = async (input: unknown) => {
  const { nome, email, senha, matricula } =
    professoresSchemas.createProfessorSchema.parse(input);
  const senhaHash = await hashPassword(senha);

  return professoresRepository.create({ nome, email, senhaHash, matricula });
};

export const getAll = async (input: unknown, professorId: number) => {
  const { page, limit } = professoresSchemas.listProfessoresSchema.parse(input);
  const professor = await professoresRepository.findById(professorId);

  const data = professor && page === 1 ? [professor] : [];
  const total = professor ? 1 : 0;

  return { data, total, page, limit };
};

export const getById = async (input: unknown) => {
  const id = professoresSchemas.professorIdSchema.parse(input);

  const professor = await professoresRepository.findById(id);

  if (!professor) throw new ApiError(404, "Professor não encontrado");

  return professor;
};

export const updateById = async (idInput: unknown, input: unknown) => {
  const id = professoresSchemas.professorIdSchema.parse(idInput);
  const { nome, email, senha, matricula } =
    professoresSchemas.updateProfessorSchema.parse(input);

  const data: {
    nome?: string;
    email?: string;
    senhaHash?: string;
    matricula?: string;
  } = {};

  if (nome !== undefined) data.nome = nome;
  if (email !== undefined) data.email = email;
  if (matricula !== undefined) data.matricula = matricula;
  if (senha !== undefined) {
    data.senhaHash = await hashPassword(senha);
  }

  return professoresRepository.updateById(id, data, senha !== undefined);
};

export const deleteById = async (input: unknown): Promise<void> => {
  const id = professoresSchemas.professorIdSchema.parse(input);
  await professoresRepository.deleteById(id);
};
