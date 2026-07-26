import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { asyncHandler, HttpError } from "../middleware/errors";
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
}) => ({
  id: u.id,
  fullName: u.fullName,
  username: u.username,
  role: u.role,
  status: toApiUserStatus(u.status),
  lastLogin: toIsoDateTime(u.lastLogin),
  contactNumber: u.contactNumber,
});

authRouter.post(
  "/login",
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
