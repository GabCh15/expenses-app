import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { users, categories } from "../../db/schema.js";
import { DEFAULT_CATEGORIES } from "@gasto/shared";
import { AuthRepository, UserResponse, UserWithPassword } from "./types.js";

function mapUser(user: typeof users.$inferSelect): UserResponse {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    telegramLinked: !!user.telegramId,
    currency: user.currency ?? "ARS",
    timezone: user.timezone ?? "America/Bogota",
    createdAt: user.createdAt ?? new Date(),
  };
}

export class PostgresAuthRepository implements AuthRepository {
  async createUser(
    data: Parameters<AuthRepository["createUser"]>[0]
  ): Promise<UserResponse> {
    const [user] = await db
      .insert(users)
      .values({
        email: data.email ?? null,
        passwordHash: data.passwordHash ?? null,
        displayName: data.displayName,
        githubId: data.githubId ?? null,
        telegramId: data.telegramId ?? null,
        timezone: data.timezone ?? "America/Bogota",
      })
      .returning();

    await db.insert(categories).values(
      DEFAULT_CATEGORIES.map(
        (cat: { name: string; color: string; icon: string }, index: number) => ({
          userId: user.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          isDefault: true,
          sortOrder: index,
        })
      )
    );

    return mapUser(user);
  }

  async findByEmail(email: string): Promise<UserResponse | null> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findByEmailWithPassword(
    email: string
  ): Promise<UserWithPassword | null> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!rows[0]) return null;
    const user = rows[0];
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      displayName: user.displayName,
      telegramId: user.telegramId,
      currency: user.currency,
      createdAt: user.createdAt ?? new Date(),
    };
  }

  async findById(id: string): Promise<UserResponse | null> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findByGithubId(githubId: string): Promise<UserResponse | null> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.githubId, githubId))
      .limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findByTelegramId(telegramId: number): Promise<UserResponse | null> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramId))
      .limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async updateTelegramId(
    userId: string,
    telegramId: number
  ): Promise<void> {
    await db
      .update(users)
      .set({ telegramId, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateTimezone(userId: string, timezone: string): Promise<void> {
    await db
      .update(users)
      .set({ timezone, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }
}
