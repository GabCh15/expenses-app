import { Router, Request, Response, NextFunction } from "express";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseFiltersSchema,
} from "@gasto/shared";
import { validate, validateQuery } from "../../middleware/validate.js";
import { authMiddleware } from "../../middleware/auth.js";
import { badRequest } from "../../shared/errors.js";
import { ExpenseService } from "./service.js";
import { PostgresExpenseRepository } from "./repository.js";
import { PostgresCategoryRepository } from "../categories/repository.js";

const router = Router();
const expenseService = new ExpenseService(
  new PostgresExpenseRepository(),
  new PostgresCategoryRepository()
);

router.post(
  "/",
  authMiddleware,
  validate(createExpenseSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const expense = await expenseService.create(req.user.userId, req.body);
      res.status(201).json(expense);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/",
  authMiddleware,
  validateQuery(expenseFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const result = await expenseService.list(
        req.user.userId,
        req.query as unknown as import("./types.js").ExpenseFilters
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const expense = await expenseService.getById(
        req.user.userId,
        req.params.id
      );
      res.json(expense);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  authMiddleware,
  validate(updateExpenseSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const expense = await expenseService.update(
        req.user.userId,
        req.params.id,
        req.body
      );
      res.json(expense);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      await expenseService.delete(req.user.userId, req.params.id);
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/stats/daily",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const date = req.query.date as string;
      if (!date) {
        return next(badRequest("date query parameter is required"));
      }
      const stats = await expenseService.getDailyStats(req.user.userId, date);
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/stats/weekly",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const weekStart = req.query.weekStart as string;
      if (!weekStart) {
        return next(badRequest("weekStart query parameter is required"));
      }
      const stats = await expenseService.getWeeklyStats(
        req.user.userId,
        weekStart
      );
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/stats/monthly",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const year = parseInt(req.query.year as string, 10);
      const month = parseInt(req.query.month as string, 10);
      if (Number.isNaN(year) || Number.isNaN(month)) {
        return next(badRequest("year and month query parameters are required"));
      }
      const stats = await expenseService.getMonthlyStats(
        req.user.userId,
        year,
        month
      );
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/stats/categories",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const from = req.query.from as string;
      const to = req.query.to as string;
      if (!from || !to) {
        return next(badRequest("from and to query parameters are required"));
      }
      const stats = await expenseService.getCategoryBreakdown(
        req.user.userId,
        from,
        to
      );
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
