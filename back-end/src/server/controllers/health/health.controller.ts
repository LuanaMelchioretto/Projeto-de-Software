import type { Request, Response } from "express";
import { healthService } from "../../services";

export const api = (_request: Request, response: Response): void => {
  response.json({ status: "ok" });
};

export const database = async (_request: Request, response: Response): Promise<void> => {
  await healthService.checkDatabase();
  response.json({ status: "ok" });
};
