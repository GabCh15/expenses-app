import { z } from "zod";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseFiltersSchema,
} from "@gasto/shared";

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;

export interface Expense {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: string;
  description: string | null;
  expenseDate: string;
  source: "web" | "telegram";
  currency: "USD" | "COP" | "EUR";
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null;
}

export interface PaginatedExpenses {
  items: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DailyStats {
  date: string;
  total: string;
  count: number;
}

export interface WeeklyStats {
  weekStart: string;
  days: DailyStats[];
  total: string;
  count: number;
}

export interface MonthlyStats {
  month: string;
  days: DailyStats[];
  total: string;
  avgPerDay: string;
  count: number;
}

export interface CategoryBreakdown {
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  categoryIcon: string | null;
  total: string;
  count: number;
  percentage: number;
}

export interface ExpenseRepository {
  create(data: {
    userId: string;
    categoryId: string;
    amount: number;
    description?: string;
    expenseDate: Date;
    source: "web" | "telegram";
    currency: "USD" | "COP" | "EUR";
  }): Promise<Expense>;
  findMany(
    userId: string,
    filters: ExpenseFilters
  ): Promise<PaginatedExpenses>;
  findById(id: string): Promise<Expense | null>;
  update(
    id: string,
    data: Partial<{
      categoryId: string;
      amount: number;
      description: string;
      expenseDate: Date;
    }>
  ): Promise<Expense>;
  delete(id: string): Promise<void>;
  aggregateDaily(userId: string, date: Date): Promise<DailyStats>;
  aggregateWeekly(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<WeeklyStats>;
  aggregateMonthly(
    userId: string,
    monthStart: Date,
    monthEnd: Date,
    daysInMonth: number
  ): Promise<MonthlyStats>;
  aggregateByCategory(
    userId: string,
    from: Date,
    to: Date
  ): Promise<CategoryBreakdown[]>;
}
