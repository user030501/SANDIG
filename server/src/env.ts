import fs from "node:fs";
import path from "node:path";

// Minimal .env loader — avoids pulling in dotenv for four variables.
// Resolved against the working directory (npm scripts run from /server) with a
// parent-directory fallback, so it behaves the same under tsx (ESM) and the
// compiled CommonJS build, where __dirname may or may not exist.
const candidates = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), "server", ".env"),
  path.resolve(process.cwd(), "..", ".env"),
];
const envPath = candidates.find((p) => fs.existsSync(p));
if (envPath) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: required("JWT_SECRET"),
  aiServiceUrl: process.env.AI_SERVICE_URL ?? "http://localhost:8000",
  nodeEnv: process.env.NODE_ENV ?? "development",
  isProduction: process.env.NODE_ENV === "production",
};
