import { Router, Request, Response, NextFunction } from "express";
import { createCategorySchema, updateCategorySchema } from "@expense/shared";
import { validate } from "../../middleware/validate.js";
import { authMiddleware } from "../../middleware/auth.js";
import { CategoryService } from "./service.js";
import { PostgresCategoryRepository } from "./repository.js";

const router = Router();
const categoryService = new CategoryService(new PostgresCategoryRepository());

router.post(
  "/",
  authMiddleware,
  validate(createCategorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const category = await categoryService.create(req.user.userId, req.body);
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const categories = await categoryService.list(req.user.userId);
      res.json(categories);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  authMiddleware,
  validate(updateCategorySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const category = await categoryService.update(
        req.user.userId,
        req.params.id,
        req.body
      );
      res.json(category);
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
      await categoryService.softDelete(req.user.userId, req.params.id);
      res.json({ deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id/restore",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const category = await categoryService.restore(
        req.user.userId,
        req.params.id
      );
      res.json(category);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
