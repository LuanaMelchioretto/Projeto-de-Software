import { ApiError, hashPassword } from "../../lib";
import { usersRepository } from "../../repositories";
import { usersSchemas } from "../../schemas";

export const create = async (input: unknown) => {
  const { nome, email, senha } = usersSchemas.createUserSchema.parse(input);
  const senhaHash = await hashPassword(senha);
  return usersRepository.create({ nome, email, senhaHash });
};

export const getAll = async (input: unknown, userId: number) => {
  const { page, limit } = usersSchemas.listUsersSchema.parse(input);
  const user = await usersRepository.findById(userId);
  const data = user && page === 1 ? [user] : [];
  const total = user ? 1 : 0;
  return { data, total, page, limit };
};

export const getById = async (input: unknown) => {
  const id = usersSchemas.userIdSchema.parse(input);
  const user = await usersRepository.findById(id);
  if (!user) throw new ApiError(404, "Usuário não encontrado");
  return user;
};

export const updateById = async (idInput: unknown, input: unknown) => {
  const id = usersSchemas.userIdSchema.parse(idInput);
  const { nome, email, senha } = usersSchemas.updateUserSchema.parse(input);
  const data: { nome?: string; email?: string; senhaHash?: string } = {};
  if (nome !== undefined) data.nome = nome;
  if (email !== undefined) data.email = email;
  if (senha !== undefined) {
    data.senhaHash = await hashPassword(senha);
  }
  return usersRepository.updateById(id, data, senha !== undefined);
};

export const deleteById = async (input: unknown): Promise<void> => {
  const id = usersSchemas.userIdSchema.parse(input);
  await usersRepository.deleteById(id);
};
