import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/error-handler.js";

export function createApp(): express.Application {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  if (process.env.NODE_ENV !== "test") {
    app.use((req, _res, next) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });
  }

  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Route placeholder — modules will mount here in later PRs
  // app.use("/api/auth", authRoutes);
  // app.use("/api/expenses", expenseRoutes);
  // app.use("/api/categories", categoryRoutes);
  // app.use("/api/users", userRoutes);

  app.use(errorHandler);

  return app;
}
