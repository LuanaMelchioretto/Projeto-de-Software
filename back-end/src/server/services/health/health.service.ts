import { ApiError } from "../../lib";
import { healthRepository } from "../../repositories";

export const checkDatabase = async (): Promise<void> => {
  try {
    await healthRepository.checkDatabaseConnection();
  } catch {
    throw new ApiError(503, "Banco de dados indisponível");
  }
};
