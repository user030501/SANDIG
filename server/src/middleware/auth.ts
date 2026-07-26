// Single-Administrator authentication (manuscript Section 1.5, FR-23).
//
// The system has exactly one direct user type: the Administrator / Assigned PWD
// Coordinator. There are no other roles — the Barangay Health Center and other
// referred offices are external entities that never log in. Any account that is
// not an active Administrator is refused at the door.

import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env";

export const AUTH_COOKIE = "sandig_session";
const TOKEN_TTL_SECONDS = 60 * 60 * 8; // one working day

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, env.jwtSecret, { expiresIn: TOKEN_TTL_SECONDS });
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    maxAge: TOKEN_TTL_SECONDS * 1000,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE);
}

/** Reads the session if present, but does not reject. */
export function loadUser(req: Request, _res: Response, next: NextFunction): void {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : undefined;
  const token = req.cookies?.[AUTH_COOKIE] ?? bearer;
  if (token) {
    try {
      req.user = jwt.verify(token, env.jwtSecret) as AuthUser;
    } catch {
      // Expired or tampered token — treated as anonymous.
    }
  }
  next();
}

/** Rejects anonymous requests. Apply to every route except login and health. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
}
