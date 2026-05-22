import { Router, Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema } from "@gasto/shared";
import { validate } from "../../middleware/validate.js";
import { authMiddleware } from "../../middleware/auth.js";
import { env } from "../../config/env.js";
import { AuthService } from "./service.js";
import { PostgresAuthRepository } from "./repository.js";
import { getGitHubAuthURL, getGitHubAccessToken, getGitHubUser } from "./oauth-github.js";

const router = Router();
const authService = new AuthService(new PostgresAuthRepository());

function setRefreshCookie(res: Response, token: string): void {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.register(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      setRefreshCookie(res, result.refreshToken);
      res.json({ accessToken: result.accessToken, user: result.user });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) {
        res.status(401).json({ message: "Refresh token required" });
        return;
      }
      const result = await authService.refresh(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/github", (_req: Request, res: Response) => {
  res.redirect(getGitHubAuthURL());
});

router.get(
  "/github/callback",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        res.status(400).json({ message: "Missing authorization code" });
        return;
      }

      const accessToken = await getGitHubAccessToken(code);
      const profile = await getGitHubUser(accessToken);
      const result = await authService.findOrCreateFromGitHub(profile);

      setRefreshCookie(res, result.refreshToken);

      const redirectUrl = new URL(env.FRONTEND_URL);
      redirectUrl.searchParams.set("accessToken", result.accessToken);
      res.redirect(redirectUrl.toString());
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/me",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const user = await authService.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
