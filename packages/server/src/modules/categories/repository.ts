import { eq, and, asc } from "drizzle-orm";
import { db } from "../../config/db.js";
import { categories } from "../../db/schema.js";
import { Category, CategoryRepository } from "./types.js";

function mapCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    color: row.color,
    icon: row.icon,
    isDefault: row.isDefault ?? false,
    isDeleted: row.isDeleted ?? false,
    sortOrder: row.sortOrder ?? 0,
    createdAt: row.createdAt ?? new Date(),
    updatedAt: row.updatedAt ?? new Date(),
  };
}

export class PostgresCategoryRepository implements CategoryRepository {
  async create(
    data: Parameters<CategoryRepository["create"]>[0]
  ): Promise<Category> {
    const [row] = await db
      .insert(categories)
      .values({
        userId: data.userId,
        name: data.name,
        color: data.color ?? "#6366f1",
        icon: data.icon ?? null,
        isDefault: data.isDefault ?? false,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();

    return mapCategory(row);
  }

  async findByUser(userId: string): Promise<Category[]> {
    const rows = await db
      .select()
      .from(categories)
      .where(and(eq(categories.userId, userId), eq(categories.isDeleted, false)))
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return rows.map(mapCategory);
  }

  async findById(id: string): Promise<Category | null> {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    return rows[0] ? mapCategory(rows[0]) : null;
  }

  async findByName(userId: string, name: string): Promise<Category | null> {
    const rows = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          eq(categories.name, name),
          eq(categories.isDeleted, false)
        )
      )
      .limit(1);

    return rows[0] ? mapCategory(rows[0]) : null;
  }

  async update(
    id: string,
    data: Parameters<CategoryRepository["update"]>[1]
  ): Promise<Category> {
    const [row] = await db
      .update(categories)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    return mapCategory(row);
  }

  async softDelete(id: string): Promise<Category> {
    const [row] = await db
      .update(categories)
      .set({ isDeleted: true, deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    return mapCategory(row);
  }

  async restore(id: string): Promise<Category> {
    const [row] = await db
      .update(categories)
      .set({ isDeleted: false, deletedAt: null, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();

    return mapCategory(row);
  }
}
