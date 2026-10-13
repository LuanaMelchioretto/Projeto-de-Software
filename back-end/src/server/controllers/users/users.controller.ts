import type { Request, Response } from "express";
import { usersService } from "../../services";

export const create = async (request: Request, response: Response): Promise<void> => {
  const user = await usersService.create(request.body);
  response.location(`/api/users/${user.id}`).status(201).json(user);
};

export const getAll = async (request: Request, response: Response): Promise<void> => {
  response.json(await usersService.getAll(request.query, response.locals.authUser.id));
};

export const getById = async (request: Request, response: Response): Promise<void> => {
  response.json(await usersService.getById(request.params.id));
};

export const updateById = async (request: Request, response: Response): Promise<void> => {
  response.json(await usersService.updateById(request.params.id, request.body));
};

export const deleteById = async (request: Request, response: Response): Promise<void> => {
  await usersService.deleteById(request.params.id);
  response.status(204).send();
};
