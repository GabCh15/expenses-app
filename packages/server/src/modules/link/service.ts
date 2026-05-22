import { randomInt } from "crypto";
import { eq } from "drizzle-orm";
import { badRequest, tooManyRequests } from "../../shared/errors.js";
import { LinkRepository } from "./types.js";
import { db } from "../../config/db.js";
import { users, expenses, categories } from "../../db/schema.js";

const TOKEN_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function generateRandomToken(): string {
  let token = "";
  for (let i = 0; i < 6; i++) {
    token += TOKEN_CHARSET[randomInt(0, TOKEN_CHARSET.length)];
  }
  return token;
}

export class LinkService {
  constructor(private repo: LinkRepository) {}

  async generateToken(telegramUserId: number): Promise<string> {
    // Find the Telegram user by their telegram_id to get the internal UUID
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.telegramId, telegramUserId))
      .limit(1);

    if (!userRows[0]) {
      throw badRequest("Telegram user not found");
    }

    const user = userRows[0];

    const recentCount = await this.repo.countRecentAttempts(user.id);
    if (recentCount >= 5) {
      throw tooManyRequests("Too many attempts, try again later");
    }

    const token = generateRandomToken();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.repo.createToken(user.id, token, expiresAt);
    return token;
  }

  async verifyToken(webUserId: string, token: string): Promise<string> {
    const linkToken = await this.repo.findByToken(token);
    if (!linkToken) {
      throw badRequest("Invalid or expired token");
    }

    if (linkToken.expiresAt < new Date()) {
      throw badRequest("Invalid or expired token");
    }

    if (linkToken.usedAt) {
      throw badRequest("Invalid or expired token");
    }

    await this.repo.markUsed(linkToken.id);

    // Get the Telegram user who created the token
    const telegramUserRows = await db
      .select()
      .from(users)
      .where(eq(users.id, linkToken.userId))
      .limit(1);

    if (!telegramUserRows[0] || !telegramUserRows[0].telegramId) {
      throw badRequest("Invalid or expired token");
    }

    const telegramUser = telegramUserRows[0];
    const telegramUserId = telegramUser.id;
    const telegramIdNumber = telegramUser.telegramId!;

    // Link the web user to the Telegram account
    await db
      .update(users)
      .set({ telegramId: telegramIdNumber, updatedAt: new Date() })
      .where(eq(users.id, webUserId));

    // Reassign expenses from the Telegram-only user to the web user
    await db
      .update(expenses)
      .set({ userId: webUserId })
      .where(eq(expenses.userId, telegramUserId));

    // Reassign categories from the Telegram-only user to the web user
    await db
      .update(categories)
      .set({ userId: webUserId })
      .where(eq(categories.userId, telegramUserId));

    // Delete the old Telegram-only user account
    await db.delete(users).where(eq(users.id, telegramUserId));

    return telegramUser.displayName;
  }

  async cleanupExpired(): Promise<void> {
    await this.repo.deleteExpired();
  }
}
