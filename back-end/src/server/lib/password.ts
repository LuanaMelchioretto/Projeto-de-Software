import bcrypt from "bcryptjs";

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, 12);
