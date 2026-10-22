import type { Request, Response } from "express";
import { questoesService } from "../../services";

export const list = async (_request: Request, response: Response): Promise<void> => {
  response.json(await questoesService.list(response.locals.authUser.id));
};

export const getById = async (request: Request, response: Response): Promise<void> => {
  response.json(await questoesService.getById(request.params.id, response.locals.authUser.id));
};

export const create = async (request: Request, response: Response): Promise<void> => {
  const question = await questoesService.create(request.body, response.locals.authUser.id);
  response.location(`/api/questoes/${question.id}`).status(201).json(question);
};

export const update = async (request: Request, response: Response): Promise<void> => {
  response.json(await questoesService.update(request.params.id, request.body, response.locals.authUser.id));
};

export const remove = async (request: Request, response: Response): Promise<void> => {
  await questoesService.remove(request.params.id, response.locals.authUser.id);
  response.status(204).send();
};
