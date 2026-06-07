import { z } from "zod";
import { registerSchema, loginSchema } from "@expense/shared";

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface TokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface GitHubProfile {
  githubId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface TelegramProfile {
  telegramId: number;
  displayName: string;
}

export interface UserResponse {
  id: string;
  email: string | null;
  displayName: string;
  telegramLinked: boolean;
  currency: string;
  createdAt: Date;
}

export interface UserWithPassword {
  id: string;
  email: string | null;
  passwordHash: string | null;
  displayName: string;
  telegramId: number | null;
  currency: string | null;
  createdAt: Date;
}

export interface AuthRepository {
  createUser(data: {
    email?: string;
    passwordHash?: string;
    displayName: string;
    githubId?: string;
    telegramId?: number;
  }): Promise<UserResponse>;
  findByEmail(email: string): Promise<UserResponse | null>;
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;
  findById(id: string): Promise<UserResponse | null>;
  findByGithubId(githubId: string): Promise<UserResponse | null>;
  findByTelegramId(telegramId: number): Promise<UserResponse | null>;
  updateTelegramId(userId: string, telegramId: number): Promise<void>;
}
