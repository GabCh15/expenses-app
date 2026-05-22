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

/**
 * @swagger
 * /expenses:
 *   post:
 *     summary: Create a new expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               categoryId: { type: string, format: uuid }
 *               description: { type: string }
 *               expenseDate: { type: string, format: date }
 *               currency: { type: string, example: "USD" }
 *     responses:
 *       201:
 *         description: Expense created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /expenses:
 *   get:
 *     summary: List expenses with filters and pagination
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [date_desc, date_asc, amount_desc, amount_asc] }
 *     responses:
 *       200:
 *         description: Paginated list of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *                 totalPages: { type: integer }
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /expenses/{id}:
 *   get:
 *     summary: Get a single expense by ID
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string, format: uuid }
 *         required: true
 *     responses:
 *       200:
 *         description: Expense details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       404:
 *         description: Expense not found
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /expenses/{id}:
 *   patch:
 *     summary: Update an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string, format: uuid }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount: { type: number }
 *               categoryId: { type: string, format: uuid }
 *               description: { type: string }
 *               expenseDate: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Updated expense
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       404:
 *         description: Expense not found
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string, format: uuid }
 *         required: true
 *     responses:
 *       200:
 *         description: Expense deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deleted: { type: boolean }
 *       404:
 *         description: Expense not found
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /expenses/stats/daily:
 *   get:
 *     summary: Get daily spending stats
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema: { type: string, format: date }
 *         required: true
 *     responses:
 *       200:
 *         description: Daily stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 date: { type: string }
 *                 total: { type: string }
 *                 count: { type: integer }
 *       400:
 *         description: Missing date parameter
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /expenses/stats/weekly:
 *   get:
 *     summary: Get weekly spending stats
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         schema: { type: string, format: date }
 *         required: true
 *     responses:
 *       200:
 *         description: Weekly stats with daily breakdown
 *       400:
 *         description: Missing weekStart parameter
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /expenses/stats/monthly:
 *   get:
 *     summary: Get monthly spending stats
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *         required: true
 *       - in: query
 *         name: month
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: Monthly stats with daily breakdown
 *       400:
 *         description: Missing year or month parameter
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /expenses/stats/categories:
 *   get:
 *     summary: Get category breakdown for a date range
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *         required: true
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *         required: true
 *     responses:
 *       200:
 *         description: Category breakdown
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   categoryId: { type: string, nullable: true }
 *                   categoryName: { type: string, nullable: true }
 *                   categoryColor: { type: string, nullable: true }
 *                   categoryIcon: { type: string, nullable: true }
 *                   total: { type: string }
 *                   count: { type: integer }
 *                   percentage: { type: number }
 *       400:
 *         description: Missing from or to parameter
 *       401:
 *         description: Unauthorized
 */
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
