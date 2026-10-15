import bcrypt from "bcryptjs";
import { ApiError, hashPassword } from "../../lib";
import { professoresRepository } from "../../repositories";
import { professoresSchemas } from "../../schemas";

const requireOwnAccount = (idInput: unknown, actorId: number): number => {
  const id = professoresSchemas.professorIdSchema.parse(idInput);
  if (id !== actorId) throw new ApiError(403, "Acesso não permitido");
  return id;
};

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

export const getById = async (input: unknown, actorId: number) => {
  const id = requireOwnAccount(input, actorId);

  const professor = await professoresRepository.findById(id);

  if (!professor) throw new ApiError(404, "Professor não encontrado");

  return professor;
};

export const updateById = async (idInput: unknown, input: unknown, actorId: number) => {
  const id = requireOwnAccount(idInput, actorId);
  const { nome, matricula } =
    professoresSchemas.updateProfessorSchema.parse(input);

  const data: {
    nome?: string;
    matricula?: string;
  } = {};

  if (nome !== undefined) data.nome = nome;
  if (matricula !== undefined) data.matricula = matricula;
  return professoresRepository.updateById(id, data);
};

export const changePassword = async (idInput: unknown, input: unknown, actorId: number): Promise<void> => {
  const id = requireOwnAccount(idInput, actorId);
  const { senhaAtual, novaSenha } = professoresSchemas.changePasswordSchema.parse(input);
  const credentials = await professoresRepository.findCredentialsById(id);
  
  if (!credentials || credentials.status !== 1 || !(await bcrypt.compare(senhaAtual, credentials.senhaHash))) {
    throw new ApiError(400, "Senha atual incorreta");
  }
  
  const changed = await professoresRepository.changePassword(id, credentials.senhaHash, await hashPassword(novaSenha));
  if (!changed) throw new ApiError(401, "Credenciais alteradas. Entre novamente");
};

export const deactivateById = async (input: unknown, actorId: number): Promise<void> => {
  const id = requireOwnAccount(input, actorId);
  await professoresRepository.updateById(id, { status: 0 }, true);
};
