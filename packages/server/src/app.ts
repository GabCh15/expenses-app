import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/error-handler.js";
import authRoutes from "./modules/auth/routes.js";

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(cookieParser());

  if (process.env.NODE_ENV !== "test") {
    app.use((req, _res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRoutes);

  // Route placeholders — modules will mount here in later PRs
  // app.use("/api/expenses", expenseRoutes);
  // app.use("/api/categories", categoryRoutes);
  // app.use("/api/users", userRoutes);

  app.use(errorHandler);

  return app;
}
