import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { badRequest } from "../shared/errors.js";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(formatZodError(result.error));
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      next(formatZodError(result.error));
      return;
    }

    req.query = result.data;
    next();
  };
}

function formatZodError(error: ZodError): Error {
  const fieldErrors = error.errors.map((e) => ({
    path: e.path.join("."),
    message: e.message,
  }));

  const err = badRequest("Validation failed");
  (err as unknown as Error & { errors: typeof fieldErrors }).errors = fieldErrors;
  return err;
}
