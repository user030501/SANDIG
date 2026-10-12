import { rateLimit } from "express-rate-limit";

const windowMs = 15 * 60 * 1000;

// A single admin's session fires many small GETs per page (dashboard widgets,
// at-risk filters, profile + assessment + referral lookups, etc.), so a cap
// meant to blunt runaway scripts was instead tripping during ordinary use —
// the session would read as logged out and even block the next login attempt
// (see AuthContext's 401-only check). 600/15min gives normal use a wide
// margin while still bounding abuse; the brute-force-sensitive endpoints have
// their own much tighter limits below.
export const apiRateLimit = rateLimit({
  windowMs,
  limit: 600,
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
