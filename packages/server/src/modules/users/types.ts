import { z } from "zod";
import { updateProfileSchema } from "@gasto/shared";

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface User {
  id: string;
  email: string | null;
  displayName: string;
  telegramLinked: boolean;
  currency: string;
  createdAt: Date;
}

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  update(id: string, data: UpdateProfileInput): Promise<User>;
  unlinkTelegram(id: string): Promise<User>;
}
