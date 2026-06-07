import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { env } from "../../config/env.js";
import { unauthorized, conflict } from "../../shared/errors.js";
import {
  AuthRepository,
  RegisterInput,
  LoginInput,
  GitHubProfile,
  TelegramProfile,
  TokenPayload,
  UserResponse,
} from "./types.js";

const ISSUER = "gasto";
const AUDIENCE = "gasto-api";

export class AuthService {
  constructor(private repo: AuthRepository) {}

  async register(dto: RegisterInput): Promise<UserResponse> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw conflict("Email already registered");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.repo.createUser({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
    });
  }

  async login(
    dto: LoginInput
  ): Promise<{ accessToken: string; refreshToken: string; user: UserResponse }> {
    const rawUser = await this.repo.findByEmailWithPassword(dto.email);
    if (!rawUser || !rawUser.passwordHash) {
      throw unauthorized("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, rawUser.passwordHash);
    if (!valid) {
      throw unauthorized("Invalid credentials");
    }

    const user: UserResponse = {
      id: rawUser.id,
      email: rawUser.email,
      displayName: rawUser.displayName,
      telegramLinked: !!rawUser.telegramId,
      currency: rawUser.currency ?? "ARS",
      createdAt: rawUser.createdAt,
    };

    const tokens = this.generateTokens(user);
    return { ...tokens, user };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: jwt.JwtPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
        algorithms: ["HS256"],
        issuer: ISSUER,
        audience: AUDIENCE,
      }) as jwt.JwtPayload;
    } catch {
      throw unauthorized("Invalid or expired refresh token");
    }

    const user = await this.repo.findById(payload.sub as string);
    if (!user) {
      throw unauthorized("User not found");
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        jti: randomUUID(),
      },
      env.JWT_SECRET,
      {
        expiresIn: 900,
        issuer: ISSUER,
        audience: AUDIENCE,
      }
    );

    return { accessToken };
  }

  async findOrCreateFromGitHub(
    profile: GitHubProfile
  ): Promise<{ accessToken: string; refreshToken: string; user: UserResponse }> {
    let user = await this.repo.findByGithubId(profile.githubId);
    if (!user) {
      user = await this.repo.createUser({
        email: profile.email,
        displayName: profile.displayName,
        githubId: profile.githubId,
      });
    }

    const tokens = this.generateTokens(user);
    return { ...tokens, user };
  }

  async findOrCreateFromTelegram(
    profile: TelegramProfile
  ): Promise<UserResponse> {
    let user = await this.repo.findByTelegramId(profile.telegramId);
    if (!user) {
      user = await this.repo.createUser({
        displayName: profile.displayName,
        telegramId: profile.telegramId,
      });
    }
    return user;
  }

  generateTokens(user: UserResponse): {
    accessToken: string;
    refreshToken: string;
  } {
    const jti = randomUUID();

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        jti,
      },
      env.JWT_SECRET,
      {
        expiresIn: 900,
        issuer: ISSUER,
        audience: AUDIENCE,
      }
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        jti,
      },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
        issuer: ISSUER,
        audience: AUDIENCE,
      }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): TokenPayload {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as TokenPayload;
    return payload;
  }

  async getUserById(userId: string): Promise<UserResponse | null> {
    return this.repo.findById(userId);
  }
}
