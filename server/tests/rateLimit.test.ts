import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import express from "express";
import { apiRateLimit, loginRateLimit } from "../src/middleware/rateLimit";

test("rate limits API requests and login attempts while exempting the health probe", async () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use("/api", apiRateLimit);
  app.post("/api/auth/login", loginRateLimit, (_req, res) => {
    res.sendStatus(200);
  });
  app.get("/api/resource", (_req, res) => {
    res.sendStatus(200);
  });
  app.get("/api/health", (_req, res) => {
    res.sendStatus(200);
  });

  const server = app.listen(0);
  await once(server, "listening");

  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const loginHeaders = { "X-Forwarded-For": "198.51.100.2" };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: loginHeaders,
      });
      assert.equal(response.status, 200);
    }
    const blockedLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: loginHeaders,
    });
    assert.equal(blockedLogin.status, 429);
    assert.match((await blockedLogin.json()).error, /login attempts/i);

    const apiHeaders = { "X-Forwarded-For": "198.51.100.1" };
    for (let request = 0; request < 100; request += 1) {
      const response = await fetch(`${baseUrl}/api/resource`, {
        headers: apiHeaders,
      });
      assert.equal(response.status, 200);
    }
    const blockedRequest = await fetch(`${baseUrl}/api/resource`, {
      headers: apiHeaders,
    });
    assert.equal(blockedRequest.status, 429);
    assert.match((await blockedRequest.json()).error, /too many requests/i);
    assert.ok(blockedRequest.headers.has("ratelimit-limit"));

    const healthResponse = await fetch(`${baseUrl}/api/health`, {
      headers: apiHeaders,
    });
    assert.equal(healthResponse.status, 200);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
