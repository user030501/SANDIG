// Thin fetch wrapper for the SANDIG REST API.
//
// All requests go to the /api prefix, which the Vite dev server proxies to the
// Express backend on :3000 (see vite.config.ts). `credentials: "include"` is
// required so the httpOnly session cookie travels with every call.

const BASE = "/api";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Shown whenever the request never reached the Express backend. The Vite dev
 * proxy answers a refused connection with a plain 500 and no JSON body, so
 * "the API server is not running" would otherwise surface as an opaque
 * "Request failed (500)" on the login screen.
 */
const OFFLINE_MESSAGE =
  "Cannot reach the SANDIG server. Start the backend with `npm run dev` in the server folder, then try again.";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Network-level failure: no server, DNS, or the request was aborted.
    throw new ApiError(0, OFFLINE_MESSAGE);
  }

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    // A 5xx with no JSON body is the dev proxy failing to connect, not the API
    // rejecting the request — the backend always answers errors as JSON.
    const fallback =
      res.status >= 500 && !isJson ? OFFLINE_MESSAGE : `Request failed (${res.status})`;
    const message =
      (payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? fallback;
    throw new ApiError(res.status, message, (payload as { details?: unknown })?.details);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body ?? {}),
  del: <T>(path: string) => request<T>("DELETE", path),
};
