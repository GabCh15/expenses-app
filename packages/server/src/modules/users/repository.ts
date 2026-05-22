import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { users } from "../../db/schema.js";
import { User, UserRepository, UpdateProfileInput } from "./types.js";

function mapUser(row: typeof users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    telegramLinked: !!row.telegramId,
    currency: row.currency ?? "ARS",
    createdAt: row.createdAt ?? new Date(),
  };
}

export class PostgresUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ? mapUser(rows[0]) : null;
  }

  async update(id: string, data: UpdateProfileInput): Promise<User> {
    const [row] = await db
      .update(users)
      .set({
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.currency !== undefined && { currency: data.currency }),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return mapUser(row);
  }

  async unlinkTelegram(id: string): Promise<User> {
    const [row] = await db
      .update(users)
      .set({ telegramId: null, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    return mapUser(row);
  }
}
