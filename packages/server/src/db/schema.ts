import {
  pgTable,
  uuid,
  varchar,
  decimal,
  text,
  date,
  timestamp,
  bigint,
  boolean,
  integer,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const sourceEnum = pgEnum("source", ["web", "telegram"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  githubId: varchar("github_id", { length: 50 }).unique(),
  telegramId: bigint("telegram_id", { mode: "number" }).unique(),
  currency: varchar("currency", { length: 3 }).default("ARS"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 100 }).notNull(),
    color: varchar("color", { length: 7 }).notNull().default("#6366f1"),
    icon: varchar("icon", { length: 10 }),
    isDefault: boolean("is_default").default(false),
    isDeleted: boolean("is_deleted").default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    sortOrder: integer("sort_order").default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userDeletedSortIdx: index("categories_user_deleted_sort_idx").on(
      table.userId,
      table.isDeleted,
      table.sortOrder
    ),
    userNameUnique: uniqueIndex("categories_user_name_unique")
      .on(table.userId, table.name)
      .where(sql`${table.isDeleted} = false`),
  })
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    description: text("description"),
    expenseDate: date("expense_date").notNull().defaultNow(),
    source: sourceEnum("source").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userDateIdx: index("expenses_user_date_idx").on(
      table.userId,
      table.expenseDate
    ),
    userCategoryIdx: index("expenses_user_category_idx").on(
      table.userId,
      table.categoryId
    ),
    categoryIdx: index("expenses_category_idx").on(table.categoryId),
  })
);

export const linkTokens = pgTable(
  "link_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 6 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tokenIdx: index("link_tokens_token_idx").on(table.token),
    expiresAtIdx: index("link_tokens_expires_at_idx").on(table.expiresAt),
  })
);
