import express from "express";
import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./env";
import { prisma } from "./prisma";
import { loadUser } from "./middleware/auth";
import { auditLogger } from "./middleware/audit";
import { errorHandler, notFound } from "./middleware/errors";
import { requireAuth } from "./middleware/auth";
import { aiServiceHealthy } from "./aiClient";
import { authRouter } from "./routes/auth.routes";
import { profilesRouter } from "./routes/profiles.routes";
import { assessmentsRouter } from "./routes/assessments.routes";
import { referralsRouter } from "./routes/referrals.routes";
import { atRiskRouter } from "./routes/atrisk.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { reportsRouter } from "./routes/reports.routes";

export const app = express();

app.set("trust proxy", true);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// In development the Vite dev server proxies /api, so same-origin applies and
// CORS is only a fallback for direct calls to :3000.
app.use(
  cors({
    origin: env.isProduction ? false : ["http://localhost:5173"],
    credentials: true,
  })
);

// Order matters: identify the caller, then audit, then route.
app.use(loadUser);
app.use(auditLogger);

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: "ok",
      database: "connected",
      aiService: (await aiServiceHealthy()) ? "reachable" : "unreachable",
    });
  } catch {
    res.status(503).json({ status: "degraded", database: "unreachable" });
  }
});

app.use("/api/auth", authRouter);

// Everything below requires an authenticated Administrator session.
app.use("/api/pwd-profiles", requireAuth, profilesRouter);
app.use("/api/assessments", requireAuth, assessmentsRouter);
app.use("/api/referrals", requireAuth, referralsRouter);
app.use("/api/at-risk", requireAuth, atRiskRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/reports", requireAuth, reportsRouter);

if (env.isProduction && process.env.FRONTEND_DIST_DIR) {
  const frontendDist = path.resolve(process.env.FRONTEND_DIST_DIR);
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path === "/api" || req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[sandig-server] listening on http://localhost:${env.port}`);
});
