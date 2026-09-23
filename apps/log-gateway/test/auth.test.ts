import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

test("log gateway health is public and ingest fails closed without a token", async () => {
  const app = await createApp({ token: "" });
  const health = await app.inject({ method: "GET", url: "/health" });
  assert.equal(health.statusCode, 200);

  const ingest = await app.inject({
    method: "POST",
    url: "/api/v1/logs/ingest",
    payload: { stream: "build_1", type: "log", message: "hello" }
  });
  assert.equal(ingest.statusCode, 503);
  await app.close();
});

test("log gateway rejects unauthenticated replay and accepts a valid bearer", async () => {
  const app = await createApp({ token: "log-token" });
  const denied = await app.inject({ method: "GET", url: "/api/v1/logs/build_1/replay" });
  assert.equal(denied.statusCode, 401);

  const ingested = await app.inject({
    method: "POST",
    url: "/api/v1/logs/ingest",
    headers: { authorization: "Bearer log-token" },
    payload: { stream: "build_1", type: "log", message: "hello" }
  });
  assert.equal(ingested.statusCode, 202);

  const replay = await app.inject({
    method: "GET",
    url: "/api/v1/logs/build_1/replay",
    headers: { authorization: "Bearer log-token" }
  });
  assert.equal(replay.statusCode, 200);
  assert.equal(replay.json().data.length, 1);
  await app.close();
});
