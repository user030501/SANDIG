import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env } from "./env";
import { prisma } from "./prisma";
import { loadUser } from "./middleware/auth";
import { auditLogger } from "./middleware/audit";
import { errorHandler, notFound } from "./middleware/errors";
import { authRouter } from "./routes/auth.routes";

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
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "degraded", database: "unreachable" });
  }
});

app.use("/api/auth", authRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[sandig-server] listening on http://localhost:${env.port}`);
});
