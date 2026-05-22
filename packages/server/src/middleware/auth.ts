import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { unauthorized } from "../shared/errors.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
      };
    }
  }
}

const ISSUER = "gasto";
const AUDIENCE = "gasto-api";

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(unauthorized("Missing or invalid Authorization header"));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as {
      sub: string;
      email: string;
    };

    req.user = { userId: payload.sub, email: payload.email };
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}
