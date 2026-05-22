import { AuthService } from "../modules/auth/service.js";
import { PostgresAuthRepository } from "../modules/auth/repository.js";
import { ExpenseService } from "../modules/expenses/service.js";
import { PostgresExpenseRepository } from "../modules/expenses/repository.js";
import { CategoryService } from "../modules/categories/service.js";
import { PostgresCategoryRepository } from "../modules/categories/repository.js";
import { LinkService } from "../modules/link/service.js";
import { PostgresLinkRepository } from "../modules/link/repository.js";

export const authService = new AuthService(new PostgresAuthRepository());
export const expenseService = new ExpenseService(
  new PostgresExpenseRepository(),
  new PostgresCategoryRepository()
);
export const categoryService = new CategoryService(new PostgresCategoryRepository());
export const linkService = new LinkService(new PostgresLinkRepository());
