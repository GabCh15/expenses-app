import { eq, and, gte, sql, lt } from "drizzle-orm";
import { db } from "../../config/db.js";
import { linkTokens } from "../../db/schema.js";
import { LinkToken, LinkRepository } from "./types.js";

function mapLinkToken(row: typeof linkTokens.$inferSelect): LinkToken {
  return {
    id: row.id,
    userId: row.userId,
    token: row.token,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt,
    createdAt: row.createdAt ?? new Date(),
  };
}

export class PostgresLinkRepository implements LinkRepository {
  async createToken(
    userId: string,
    token: string,
    expiresAt: Date
  ): Promise<LinkToken> {
    const [row] = await db
      .insert(linkTokens)
      .values({ userId, token, expiresAt })
      .returning();
    return mapLinkToken(row);
  }

  async findByToken(token: string): Promise<LinkToken | null> {
    const rows = await db
      .select()
      .from(linkTokens)
      .where(
        and(
          eq(linkTokens.token, token),
          sql`${linkTokens.usedAt} IS NULL`
        )
      )
      .limit(1);
    return rows[0] ? mapLinkToken(rows[0]) : null;
  }

  async markUsed(id: string): Promise<void> {
    await db
      .update(linkTokens)
      .set({ usedAt: new Date() })
      .where(eq(linkTokens.id, id));
  }

  async countRecentAttempts(userId: string): Promise<number> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(linkTokens)
      .where(
        and(
          eq(linkTokens.userId, userId),
          gte(linkTokens.createdAt, fiveMinutesAgo)
        )
      );
    return rows[0]?.count ?? 0;
  }

  async deleteExpired(): Promise<void> {
    await db
      .delete(linkTokens)
      .where(
        and(
          lt(linkTokens.expiresAt, new Date()),
          sql`${linkTokens.usedAt} IS NULL`
        )
      );
  }
}
