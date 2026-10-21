import type { Request, Response } from "express";
import { professoresService } from "../../services";

export const create = async (request: Request, response: Response): Promise<void> => {
  const professor = await professoresService.create(request.body);
  response.location(`/api/professores/${professor.id}`).status(201).json(professor);
};

export const getAll = async (request: Request, response: Response): Promise<void> => {
  response.json(await professoresService.getAll(request.query, response.locals.authUser.id));
};

export const getById = async (request: Request, response: Response): Promise<void> => {
  response.json(await professoresService.getById(request.params.id, response.locals.authUser.id));
};

export const updateById = async (request: Request, response: Response): Promise<void> => {
  response.json(await professoresService.updateById(request.params.id, request.body, response.locals.authUser.id));
};

export const changePassword = async (request: Request, response: Response): Promise<void> => {
  await professoresService.changePassword(request.params.id, request.body, response.locals.authUser.id);
  response.status(204).send();
};

export const deactivateById = async (request: Request, response: Response): Promise<void> => {
  await professoresService.deactivateById(request.params.id, response.locals.authUser.id);
  response.status(204).send();
};
