import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { errorHandler } from "./middleware/error-handler.js";
import { swaggerSpec } from "./config/swagger.js";
import authRoutes from "./modules/auth/routes.js";
import categoryRoutes from "./modules/categories/routes.js";
import expenseRoutes from "./modules/expenses/routes.js";
import userRoutes from "./modules/users/routes.js";

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

  app.get("/api/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: "Expense API Documentation",
    })
  );

  app.use("/api/auth", authRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/users", userRoutes);

  app.use(errorHandler);

  return app;
}
