export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = "APP_ERROR"
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (message = "Not found"): AppError =>
  new AppError(404, message, "NOT_FOUND");

export const unauthorized = (message = "Unauthorized"): AppError =>
  new AppError(401, message, "UNAUTHORIZED");

export const forbidden = (message = "Forbidden"): AppError =>
  new AppError(403, message, "FORBIDDEN");

export const conflict = (message = "Conflict"): AppError =>
  new AppError(409, message, "CONFLICT");

export const badRequest = (message = "Bad request"): AppError =>
  new AppError(400, message, "BAD_REQUEST");

export const tooManyRequests = (message = "Too many requests"): AppError =>
  new AppError(429, message, "TOO_MANY_REQUESTS");
