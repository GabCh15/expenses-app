import { notFound } from "../../shared/errors.js";
import { CategoryRepository } from "../categories/types.js";
import {
  ExpenseRepository,
  Expense,
  ExpenseFilters,
  DailyStats,
  WeeklyStats,
  MonthlyStats,
  CategoryBreakdown,
  CreateExpenseInput,
  UpdateExpenseInput,
} from "./types.js";

export class ExpenseService {
  constructor(
    private repo: ExpenseRepository,
    private categoryRepo: CategoryRepository
  ) {}

  async create(
    userId: string,
    dto: CreateExpenseInput,
    source: "web" | "telegram" = "web"
  ): Promise<Expense> {
    const category = await this.categoryRepo.findById(dto.categoryId);
    if (!category || category.userId !== userId) {
      throw notFound("Category not found");
    }

    return this.repo.create({
      userId,
      categoryId: dto.categoryId,
      amount: dto.amount,
      description: dto.description,
      expenseDate: new Date(dto.expenseDate),
      source,
    });
  }

  async list(
    userId: string,
    filters: ExpenseFilters
  ): Promise<{
    items: Expense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.repo.findMany(userId, filters);
  }

  async getById(userId: string, id: string): Promise<Expense> {
    const expense = await this.repo.findById(id);
    if (!expense || expense.userId !== userId) {
      throw notFound("Expense not found");
    }
    return expense;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateExpenseInput
  ): Promise<Expense> {
    const expense = await this.repo.findById(id);
    if (!expense || expense.userId !== userId) {
      throw notFound("Expense not found");
    }

    if (dto.categoryId) {
      const category = await this.categoryRepo.findById(dto.categoryId);
      if (!category || category.userId !== userId) {
        throw notFound("Category not found");
      }
    }

    return this.repo.update(id, {
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.expenseDate !== undefined && {
        expenseDate: new Date(dto.expenseDate),
      }),
    });
  }

  async delete(userId: string, id: string): Promise<void> {
    const expense = await this.repo.findById(id);
    if (!expense || expense.userId !== userId) {
      throw notFound("Expense not found");
    }

    await this.repo.delete(id);
  }

  async getDailyStats(userId: string, date: string): Promise<DailyStats> {
    return this.repo.aggregateDaily(userId, new Date(date));
  }

  async getWeeklyStats(userId: string, weekStart: string): Promise<WeeklyStats> {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return this.repo.aggregateWeekly(userId, start, end);
  }

  async getMonthlyStats(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyStats> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    const daysInMonth = monthEnd.getDate();
    return this.repo.aggregateMonthly(
      userId,
      monthStart,
      monthEnd,
      daysInMonth
    );
  }

  async getCategoryBreakdown(
    userId: string,
    from: string,
    to: string
  ): Promise<CategoryBreakdown[]> {
    return this.repo.aggregateByCategory(userId, new Date(from), new Date(to));
  }
}
