import { Router, Request, Response, NextFunction } from "express";
import { updateProfileSchema, linkTokenSchema } from "@gasto/shared";
import { validate } from "../../middleware/validate.js";
import { authMiddleware } from "../../middleware/auth.js";
import { UserService } from "./service.js";
import { PostgresUserRepository } from "./repository.js";
import { LinkService } from "../link/service.js";
import { PostgresLinkRepository } from "../link/repository.js";

const router = Router();
const linkService = new LinkService(new PostgresLinkRepository());
const userService = new UserService(new PostgresUserRepository(), linkService);

router.get(
  "/me",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const user = await userService.getProfile(req.user.userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/me",
  authMiddleware,
  validate(updateProfileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const user = await userService.updateProfile(req.user.userId, req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/link-telegram",
  authMiddleware,
  validate(linkTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const displayName = await userService.linkTelegram(
        req.user.userId,
        req.body.token
      );
      res.json({ linked: true, displayName });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/link-telegram",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      await userService.unlinkTelegram(req.user.userId);
      res.json({ unlinked: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
