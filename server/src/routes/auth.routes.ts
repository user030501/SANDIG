import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler, HttpError } from "../middleware/errors";
import { loginRateLimit, forgotPasswordRateLimit } from "../middleware/rateLimit";
import {
  clearAuthCookie, requireAuth, setAuthCookie, signToken, type AuthUser,
} from "../middleware/auth";
import { toApiUserStatus, toIsoDateTime } from "../codecs";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

const serializeUser = (u: {
  id: string; fullName: string; username: string; role: string;
  status: "Active" | "Inactive"; lastLogin: Date | null; contactNumber: string;
  email: string; securityQuestion: string;
}) => ({
  id: u.id,
  fullName: u.fullName,
  username: u.username,
  role: u.role,
  status: toApiUserStatus(u.status),
  lastLogin: toIsoDateTime(u.lastLogin),
  contactNumber: u.contactNumber,
  email: u.email,
  hasSecurityQuestion: u.securityQuestion.length > 0,
});

/** Case/whitespace-insensitive, so "Gizmo" and " gizmo " hash the same. */
const normalizeAnswer = (answer: string): string => answer.trim().toLowerCase();

authRouter.post(
  "/login",
  loginRateLimit,
  asyncHandler(async (req, res) => {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.systemUser.findUnique({ where: { username } });

    // Uniform failure message and a constant-ish comparison path: never reveal
    // whether the username exists.
    const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
    const passwordOk = await bcrypt.compare(password, hash);

    if (!user || !passwordOk) {
      throw new HttpError(401, "Invalid username or password.");
    }
    if (user.status !== "Active") {
      throw new HttpError(403, "This account is inactive.");
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
    };
    // Populate req.user so the audit middleware attributes the login correctly.
    req.user = authUser;

    const updated = await prisma.systemUser.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    setAuthCookie(res, signToken(authUser));
    res.json({ user: serializeUser(updated) });
  })
);

authRouter.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

/** Session probe used by the frontend AuthContext on mount. */
authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated." });
      return;
    }
    const user = await prisma.systemUser.findUnique({ where: { id: req.user.id } });
    if (!user || user.status !== "Active") {
      clearAuthCookie(res);
      res.status(401).json({ error: "Not authenticated." });
      return;
    }
    res.json({ user: serializeUser(user) });
  })
);

const updateMeSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  username: z.string().min(1, "Username is required."),
  contactNumber: z.string().default(""),
  email: z.string().default(""),
});

/** Lets the Administrator edit their own account details. */
authRouter.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const input = updateMeSchema.parse(req.body);

    const clash = await prisma.systemUser.findUnique({ where: { username: input.username } });
    if (clash && clash.id !== req.user!.id) {
      throw new HttpError(409, `Username "${input.username}" is already taken.`);
    }

    const updated = await prisma.systemUser.update({
      where: { id: req.user!.id },
      data: input,
    });
    res.json({ user: serializeUser(updated) });
  })
);

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

authRouter.post(
  "/password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);
    const user = await prisma.systemUser.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new HttpError(404, "Account not found.");

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new HttpError(400, "Current password is incorrect.");
    }

    await prisma.systemUser.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    res.json({ ok: true });
  })
);

const securityQuestionSchema = z.object({
  currentPassword: z.string().min(1),
  question: z.string().min(1, "Security question is required."),
  answer: z.string().min(1, "Security answer is required."),
});

/** Sets or changes the security question used to recover a forgotten password. */
authRouter.post(
  "/security-question",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, question, answer } = securityQuestionSchema.parse(req.body);
    const user = await prisma.systemUser.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new HttpError(404, "Account not found.");

    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new HttpError(400, "Current password is incorrect.");
    }

    await prisma.systemUser.update({
      where: { id: user.id },
      data: {
        securityQuestion: question,
        securityAnswerHash: await bcrypt.hash(normalizeAnswer(answer), 10),
      },
    });
    res.json({ ok: true });
  })
);

const forgotUsernameSchema = z.object({ username: z.string().min(1) });

/**
 * Step 1 of password recovery: looks up the account's security question.
 * There is no email/SMS service to send a reset link through, so this is
 * the only recovery path — and it necessarily confirms the username exists,
 * unlike /login's deliberately uniform failure. Rate-limited to blunt
 * enumeration, and there is only ever one real account in this system anyway.
 */
authRouter.post(
  "/forgot-password/question",
  forgotPasswordRateLimit,
  asyncHandler(async (req, res) => {
    const { username } = forgotUsernameSchema.parse(req.body);
    const user = await prisma.systemUser.findUnique({ where: { username } });
    if (!user || !user.securityQuestion) {
      throw new HttpError(
        404,
        "No security question is set up for this account. Contact your system administrator."
      );
    }
    res.json({ question: user.securityQuestion });
  })
);

const forgotResetSchema = z.object({
  username: z.string().min(1),
  answer: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
});

/** Step 2 of password recovery: the security answer stands in for the current password. */
authRouter.post(
  "/forgot-password/reset",
  forgotPasswordRateLimit,
  asyncHandler(async (req, res) => {
    const { username, answer, newPassword } = forgotResetSchema.parse(req.body);
    const user = await prisma.systemUser.findUnique({ where: { username } });
    const hash = user?.securityAnswerHash || "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
    const answerOk = await bcrypt.compare(normalizeAnswer(answer), hash);

    if (!user || !user.securityQuestion || !answerOk) {
      throw new HttpError(400, "Incorrect answer.");
    }

    await prisma.systemUser.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    });
    res.json({ ok: true });
  })
);
