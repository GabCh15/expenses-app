import { eq, and, asc, desc, gte, lte, SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "../../config/db.js";
import { expenses, categories } from "../../db/schema.js";
import {
  Expense,
  ExpenseRepository,
  ExpenseFilters,
  PaginatedExpenses,
  DailyStats,
  WeeklyStats,
  MonthlyStats,
  CategoryBreakdown,
  CurrencyTotal,
  LifetimeStats,
} from "./types.js";

function normalizeDate(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  return String(value).split("T")[0];
}

function mapExpenseRow(
  row: {
    id: string;
    userId: string;
    categoryId: string | null;
    amount: string;
    description: string | null;
    expenseDate: string;
    source: "web" | "telegram";
    currency: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    categoryId_joined: string | null;
    categoryName: string | null;
    categoryColor: string | null;
    categoryIcon: string | null;
  }
): Expense {
  return {
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    amount: String(row.amount),
    description: row.description,
    expenseDate: normalizeDate(row.expenseDate),
    source: row.source,
    currency: row.currency as "USD" | "COP" | "EUR",
    createdAt: row.createdAt ?? new Date(),
    updatedAt: row.updatedAt ?? new Date(),
    category: row.categoryId_joined
      ? {
          id: row.categoryId_joined,
          name: row.categoryName ?? "",
          color: row.categoryColor ?? "",
          icon: row.categoryIcon ?? null,
        }
      : null,
  };
}

const expenseSelectColumns = {
  id: expenses.id,
  userId: expenses.userId,
  categoryId: expenses.categoryId,
  amount: expenses.amount,
  description: expenses.description,
  expenseDate: expenses.expenseDate,
  source: expenses.source,
  currency: expenses.currency,
  createdAt: expenses.createdAt,
  updatedAt: expenses.updatedAt,
  categoryId_joined: categories.id,
  categoryName: categories.name,
  categoryColor: categories.color,
  categoryIcon: categories.icon,
};

export class PostgresExpenseRepository implements ExpenseRepository {
  async create(
    data: Parameters<ExpenseRepository["create"]>[0]
  ): Promise<Expense> {
    const [row] = await db
      .insert(expenses)
      .values({
        userId: data.userId,
        categoryId: data.categoryId,
        amount: String(data.amount),
        description: data.description ?? null,
        expenseDate: normalizeDate(data.expenseDate),
        source: data.source,
        currency: data.currency,
      })
      .returning();

    const expense = await this.findById(row.id);
    if (!expense) {
      throw new Error("Expense not found after insert");
    }
    return expense;
  }

  async findMany(
    userId: string,
    filters: ExpenseFilters
  ): Promise<PaginatedExpenses> {
    const conditions: SQL<unknown>[] = [eq(expenses.userId, userId)];

    if (filters.categoryId) {
      conditions.push(eq(expenses.categoryId, filters.categoryId));
    }
    if (filters.from) {
      conditions.push(gte(expenses.expenseDate, filters.from));
    }
    if (filters.to) {
      conditions.push(lte(expenses.expenseDate, filters.to));
    }

    const sort = filters.sort ?? "date_desc";
    const orderBy = (() => {
      switch (sort) {
        case "date_asc":
          return asc(expenses.expenseDate);
        case "amount_desc":
          return desc(expenses.amount);
        case "amount_asc":
          return asc(expenses.amount);
        default:
          return desc(expenses.expenseDate);
      }
    })();

    const page = filters.page;
    const limit = filters.limit;
    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(and(...conditions));

    const total = countResult?.count ?? 0;

    const rows = await db
      .select(expenseSelectColumns)
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const items = rows.map(mapExpenseRow);
    const totalPages = Math.ceil(total / limit);

    return { items, total, page, limit, totalPages };
  }

  async findById(id: string): Promise<Expense | null> {
    const rows = await db
      .select(expenseSelectColumns)
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(eq(expenses.id, id))
      .limit(1);

    if (!rows[0]) return null;
    return mapExpenseRow(rows[0]);
  }

  async update(
    id: string,
    data: Parameters<ExpenseRepository["update"]>[1]
  ): Promise<Expense> {
    await db
      .update(expenses)
      .set({
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.amount !== undefined && { amount: String(data.amount) }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.expenseDate !== undefined && {
        expenseDate: normalizeDate(data.expenseDate),
        }),
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id));

    const expense = await this.findById(id);
    if (!expense) {
      throw new Error("Expense not found after update");
    }
    return expense;
  }

  async delete(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async aggregateDaily(userId: string, date: string): Promise<DailyStats> {
    const rows = await db
      .select({
        currency: expenses.currency,
        total: sql<string>`sum(${expenses.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(
        and(eq(expenses.userId, userId), eq(expenses.expenseDate, date))
      )
      .groupBy(expenses.currency);
    console.log(`[aggregateDaily] rows.length=${rows.length}`, JSON.stringify(rows));

    const currencies: CurrencyTotal[] = rows
      .filter((r) => r.currency)
      .map((r) => ({
        currency: r.currency! as "USD" | "COP" | "EUR",
        total: r.total ?? "0",
        count: Number(r.count ?? 0),
      }));

    const grandTotal = currencies.reduce(
      (s, c) => s + parseFloat(c.total), 0
    );
    const totalCount = currencies.reduce((s, c) => s + c.count, 0);

    return {
      date,
      total: grandTotal.toFixed(2),
      count: totalCount,
      currencies,
    };
  }

  async aggregateWeekly(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<WeeklyStats> {
    const rows = await db
      .select({
        date: expenses.expenseDate,
        currency: expenses.currency,
        total: sql<string>`sum(${expenses.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.expenseDate, normalizeDate(weekStart)),
          lte(expenses.expenseDate, normalizeDate(weekEnd))
        )
      )
      .groupBy(expenses.expenseDate, expenses.currency)
      .orderBy(asc(expenses.expenseDate));

    const currencyTotals = new Map<string, { total: number; count: number }>();
    const days: DailyStats[] = [];
    let totalCount = 0;
    let totalSum = 0;

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = normalizeDate(d);
      const dayRows = rows.filter((r) => normalizeDate(r.date) === dateStr);

      const dayCurrencies: CurrencyTotal[] = dayRows
        .filter((r) => r.currency)
        .map((r) => {
          const curr = r.currency! as "USD" | "COP" | "EUR";
          const c = Number(r.count ?? 0);
          const t = r.total ?? "0";
          // accumulate global per-currency
          const prev = currencyTotals.get(curr) ?? { total: 0, count: 0 };
          currencyTotals.set(curr, {
            total: prev.total + parseFloat(t),
            count: prev.count + c,
          });
          return { currency: curr, total: t, count: c };
        });

      const dayTotal = dayCurrencies
        .reduce((s, c) => s + parseFloat(c.total), 0)
        .toFixed(2);
      const dayCount = dayCurrencies.reduce((s, c) => s + c.count, 0);

      days.push({
        date: dateStr,
        total: dayTotal,
        count: dayCount,
        currencies: dayCurrencies,
      });
      totalCount += dayCount;
      totalSum += parseFloat(dayTotal);
    }

    const currencies: CurrencyTotal[] = Array.from(currencyTotals.entries())
      .map(([currency, data]) => ({
        currency: currency as "USD" | "COP" | "EUR",
        total: data.total.toFixed(2),
        count: data.count,
      }));

    return {
      weekStart: normalizeDate(weekStart),
      days,
      total: totalSum.toFixed(2),
      count: totalCount,
      currencies,
    };
  }

  async aggregateMonthly(
    userId: string,
    monthStart: Date,
    monthEnd: Date,
    daysInMonth: number
  ): Promise<MonthlyStats> {
    const rows = await db
      .select({
        date: expenses.expenseDate,
        currency: expenses.currency,
        total: sql<string>`sum(${expenses.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.expenseDate, normalizeDate(monthStart)),
          lte(expenses.expenseDate, normalizeDate(monthEnd))
        )
      )
      .groupBy(expenses.expenseDate, expenses.currency)
      .orderBy(asc(expenses.expenseDate));

    const currencyTotals = new Map<string, { total: number; count: number }>();
    const days: DailyStats[] = [];
    let totalCount = 0;
    let totalSum = 0;

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(monthStart);
      d.setDate(i);
      const dateStr = normalizeDate(d);
      const dayRows = rows.filter((r) => normalizeDate(r.date) === dateStr);

      const dayCurrencies: CurrencyTotal[] = dayRows
        .filter((r) => r.currency)
        .map((r) => {
          const curr = r.currency! as "USD" | "COP" | "EUR";
          const c = Number(r.count ?? 0);
          const t = r.total ?? "0";
          const prev = currencyTotals.get(curr) ?? { total: 0, count: 0 };
          currencyTotals.set(curr, {
            total: prev.total + parseFloat(t),
            count: prev.count + c,
          });
          return { currency: curr, total: t, count: c };
        });

      const dayTotal = dayCurrencies
        .reduce((s, c) => s + parseFloat(c.total), 0)
        .toFixed(2);
      const dayCount = dayCurrencies.reduce((s, c) => s + c.count, 0);

      days.push({
        date: dateStr,
        total: dayTotal,
        count: dayCount,
        currencies: dayCurrencies,
      });
      totalCount += dayCount;
      totalSum += parseFloat(dayTotal);
    }

    const avgPerDay =
      daysInMonth > 0 ? (totalSum / daysInMonth).toFixed(2) : "0";

    const currencies: CurrencyTotal[] = Array.from(currencyTotals.entries())
      .map(([currency, data]) => ({
        currency: currency as "USD" | "COP" | "EUR",
        total: data.total.toFixed(2),
        count: data.count,
      }));

    return {
      month: normalizeDate(monthStart).slice(0, 7),
      days,
      total: totalSum.toFixed(2),
      avgPerDay,
      count: totalCount,
      currencies,
    };
  }

  async aggregateByCategory(
    userId: string,
    from: Date,
    to: Date
  ): Promise<CategoryBreakdown[]> {
    const rows = await db
      .select({
        categoryId: expenses.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIcon: categories.icon,
        total: sql<string>`sum(${expenses.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .leftJoin(categories, eq(expenses.categoryId, categories.id))
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.expenseDate, normalizeDate(from)),
          lte(expenses.expenseDate, normalizeDate(to))
        )
      )
      .groupBy(
        expenses.categoryId,
        categories.name,
        categories.color,
        categories.icon
      );

    const [grandTotalRow] = await db
      .select({ total: sql<string>`sum(${expenses.amount})` })
      .from(expenses)
      .where(
        and(
          eq(expenses.userId, userId),
          gte(expenses.expenseDate, normalizeDate(from)),
          lte(expenses.expenseDate, normalizeDate(to))
        )
      );

    const grandTotal = parseFloat(grandTotalRow?.total ?? "0") || 1;

    return rows.map((row) => {
      const rowTotal = parseFloat(row.total ?? "0");
      return {
        categoryId: row.categoryId,
        categoryName: row.categoryName ?? "Uncategorized",
        categoryColor: row.categoryColor ?? "#94a3b8",
        categoryIcon: row.categoryIcon ?? null,
        total: row.total ?? "0",
        count: row.count ?? 0,
        percentage:
          grandTotal > 0 ? Math.round((rowTotal / grandTotal) * 10000) / 100 : 0,
      };
    });
  }

  async aggregateLifetime(userId: string): Promise<LifetimeStats> {
    const currencyRows = await db
      .select({
        currency: expenses.currency,
        total: sql<string>`sum(${expenses.amount})`,
        count: sql<number>`count(*)`,
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .groupBy(expenses.currency);

    const currencies: CurrencyTotal[] = currencyRows
      .filter((r) => r.currency)
      .map((r) => ({
        currency: r.currency! as "USD" | "COP" | "EUR",
        total: r.total ?? "0",
        count: Number(r.count ?? 0),
      }));

    const totalCount = currencies.reduce((s, c) => s + c.count, 0);

    const allCategories = await this.aggregateByCategory(
      userId,
      new Date("2000-01-01"),
      new Date("2099-12-31")
    );

    const topCategories = allCategories
      .sort((a, b) => parseFloat(b.total) - parseFloat(a.total))
      .slice(0, 3);

    return { currencies, totalCount, topCategories };
  }
}
