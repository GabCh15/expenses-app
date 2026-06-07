import { db } from "../../config/db.js";
import { categories } from "../../db/schema.js";
import { DEFAULT_CATEGORIES } from "@expense/shared";

export async function seedDefaultCategories(userId: string): Promise<void> {
  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map(
      (cat: { name: string; color: string; icon: string }, index: number) => ({
        userId,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        isDefault: true,
        sortOrder: index,
      })
    )
  );
}
