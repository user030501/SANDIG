import { rateLimit } from "express-rate-limit";

const windowMs = 15 * 60 * 1000;

export const apiRateLimit = rateLimit({
  windowMs,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  skip: (req) => req.path === "/health",
});

export const loginRateLimit = rateLimit({
  windowMs,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

// Covers both forgot-password steps — the security answer is the only secret
// standing between an attacker and a password reset, so it gets the same
// brute-force ceiling as the login password itself.
export const forgotPasswordRateLimit = rateLimit({
  windowMs,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});
