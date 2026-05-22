import { Context } from "telegraf";
import { AuthService } from "../modules/auth/service.js";
import { ExpenseService } from "../modules/expenses/service.js";
import { CategoryService } from "../modules/categories/service.js";
import { LinkService } from "../modules/link/service.js";

export interface BotContext extends Context {
  services: {
    authService: AuthService;
    expenseService: ExpenseService;
    categoryService: CategoryService;
    linkService: LinkService;
  };
}

export interface ParsedExpense {
  amount: number;
  categoryId: string | null;
  description: string | null;
}
