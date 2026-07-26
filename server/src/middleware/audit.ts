// FR-22 audit trail.
//
// Deliberately centralized rather than bolted onto individual routes: this
// middleware sits in front of the whole API, so any route added later is
// covered automatically and nothing can be forgotten. It derives the module and
// a human-readable action from the request itself, then writes one AuditLog row
// after the response completes (so the recorded status code is the real one).
//
// Reads are not logged — only state-changing actions plus authentication and
// report generation, which is what FR-22 enumerates.

import type { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma";

interface ModuleRule {
  test: RegExp;
  module: string;
  /** Verbs that should be recorded for this module beyond the default writes. */
  alsoLogGet?: boolean;
}

// Order matters — first match wins.
const MODULE_RULES: ModuleRule[] = [
  { test: /^\/api\/auth\/login/, module: "Authentication", alsoLogGet: true },
  { test: /^\/api\/auth\/logout/, module: "Authentication", alsoLogGet: true },
  { test: /^\/api\/auth/, module: "Account Settings" },
  { test: /^\/api\/pwd-profiles/, module: "PWD Profiles" },
  { test: /^\/api\/assessments/, module: "Welfare Assessment" },
  { test: /^\/api\/at-risk/, module: "At-Risk Cases" },
  { test: /^\/api\/referrals/, module: "Referrals" },
  { test: /^\/api\/follow-ups/, module: "Referrals" },
  { test: /^\/api\/reports/, module: "Reports", alsoLogGet: true },
  { test: /^\/api\/predictions/, module: "Risk Prediction" },
  { test: /^\/api\/users/, module: "Account Settings" },
  { test: /^\/api\/settings/, module: "Configuration" },
  { test: /^\/api\/dashboard/, module: "Dashboard" },
];

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Human-readable action text, matching the phrasing already used in the UI.
 *
 * `path` is passed in rather than read from the request: Express strips the
 * mount prefix from req.path while a mounted router is handling the request,
 * so by the time the `finish` event fires it may read "/login" instead of
 * "/api/auth/login". The caller captures it synchronously up front.
 */
function describeAction(method: string, path: string, status: number): string {
  const ok = status < 400;
  const failed = ok ? "" : " (failed)";

  if (/^\/api\/auth\/login/.test(path)) return `Logged in${failed}`;
  if (/^\/api\/auth\/logout/.test(path)) return "Logged out";
  if (/^\/api\/auth\/password/.test(path)) return `Changed account password${failed}`;
  if (/^\/api\/reports/.test(path)) return `Generated report${failed}`;
  if (/^\/api\/assessments/.test(path) && method === "POST") return `Submitted health assessment${failed}`;
  if (/^\/api\/assessments\/.+\/confirm/.test(path)) return `Confirmed risk classification${failed}`;
  if (/^\/api\/predictions/.test(path)) return `Requested risk prediction${failed}`;
  if (/^\/api\/referrals/.test(path) && method === "POST") return `Created health referral${failed}`;
  if (/^\/api\/referrals\/.+\/status/.test(path)) return `Updated referral status${failed}`;
  if (/^\/api\/referrals\/.+\/follow-up/.test(path)) return `Recorded follow-up outcome${failed}`;
  if (/^\/api\/pwd-profiles/.test(path)) {
    if (method === "POST") return `Created PWD profile${failed}`;
    if (method === "DELETE") return `Archived PWD profile${failed}`;
    return `Updated PWD profile${failed}`;
  }
  if (/^\/api\/settings/.test(path)) return `Updated configuration${failed}`;
  if (/^\/api\/users/.test(path)) return `Updated account information${failed}`;

  return `${method} ${path}${failed}`;
}

export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  // Captured now, before any mounted router can rewrite req.url/req.path.
  const fullPath = req.path;
  const method = req.method;

  const rule = MODULE_RULES.find((r) => r.test.test(fullPath));
  const isWrite = WRITE_METHODS.has(method);
  const shouldLog = Boolean(rule) && (isWrite || rule!.alsoLogGet === true);

  if (!shouldLog) {
    next();
    return;
  }

  res.on("finish", () => {
    // The user may only be populated by the login handler itself, so read it
    // at completion time rather than up front.
    const user = req.user;
    void prisma.auditLog
      .create({
        data: {
          userId: user?.id ?? null,
          userName: user?.fullName ?? "Unauthenticated",
          action: describeAction(method, fullPath, res.statusCode),
          module: rule!.module,
          method,
          path: fullPath,
          status: res.statusCode,
          ip: req.ip ?? "",
        },
      })
      .catch((err) => {
        // An audit write must never take down the request it describes, but it
        // must be visible in the server log if it fails.
        console.error("[audit] failed to write audit row:", err);
      });
  });

  next();
}
