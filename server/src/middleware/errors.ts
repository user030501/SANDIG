import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ error: "Not found." });
};

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed.",
      details: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
    return;
  }

  const status =
    err instanceof HttpError
      ? err.status
      : typeof (err as { status?: number })?.status === "number"
      ? (err as { status: number }).status
      : 500;

  const message = err instanceof Error ? err.message : "Unexpected error.";
  if (status >= 500) console.error("[error]", err);

  res.status(status).json({ error: message });
}

/** Wraps an async handler so rejections reach the error middleware. */
export const asyncHandler =
  <T extends Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void fn(req as T, res, next).catch(next);
  };
