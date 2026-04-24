import { mkdir } from "node:fs/promises";
import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const dispatchSchema = z.object({
  build_id: z.string().min(1),
  execution_mode: z.enum(["managed_api", "chatgpt_edge"]),
  workspace_id: z.string().min(1),
  instance_id: z.string().min(1),
  spec_path: z.string().min(1),
  timeout_seconds: z.number().int().positive().max(7200).default(1800),
  max_files_changed: z.number().int().positive().max(1000).default(300),
  max_diff_lines: z.number().int().positive().max(200000).default(20000)
});

const runs = new Map<
  string,
  {
    id: string;
    buildId: string;
    executionMode: "managed_api" | "chatgpt_edge";
    status: "queued" | "preparing" | "running" | "failed" | "succeeded" | "cancelled";
    workspacePath: string;
    logs: string[];
    createdAt: string;
    updatedAt: string;
  }
>();

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info"
  }
});

await app.register(cors, { origin: true });

app.get("/health", async () => ({ status: "ok", service: "runner-supervisor", timestamp: new Date().toISOString() }));

app.post("/api/v1/runs/dispatch", async (request, reply) => {
  const parsed = dispatchSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const runId = `run_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
  const root = process.env.RUNNER_WORKDIR_ROOT || "/tmp/oae-runner";
  const workspacePath = path.join(root, "worktrees", runId);

  await mkdir(workspacePath, { recursive: true });

  const now = new Date().toISOString();
  const run = {
    id: runId,
    buildId: parsed.data.build_id,
    executionMode: parsed.data.execution_mode,
    status: "queued" as const,
    workspacePath,
    logs: [
      `${now} queued build ${parsed.data.build_id}`,
      `${now} workspace allocated at ${workspacePath}`,
      `${now} guardrails: max_files=${parsed.data.max_files_changed} max_diff_lines=${parsed.data.max_diff_lines}`
    ],
    createdAt: now,
    updatedAt: now
  };

  runs.set(runId, run);

  setTimeout(() => {
    const current = runs.get(runId);
    if (!current || current.status === "cancelled") {
      return;
    }
    current.status = "preparing";
    current.updatedAt = new Date().toISOString();
    current.logs.push(`${current.updatedAt} preparing isolated execution context`);
    runs.set(runId, current);
  }, 250);

  setTimeout(() => {
    const current = runs.get(runId);
    if (!current || current.status === "cancelled") {
      return;
    }
    current.status = "running";
    current.updatedAt = new Date().toISOString();
    current.logs.push(`${current.updatedAt} execution started`);
    runs.set(runId, current);
  }, 800);

  setTimeout(() => {
    const current = runs.get(runId);
    if (!current || current.status === "cancelled") {
      return;
    }
    current.status = "succeeded";
    current.updatedAt = new Date().toISOString();
    current.logs.push(`${current.updatedAt} execution completed`);
    runs.set(runId, current);
  }, 1800);

  return reply.code(202).send({
    run_id: runId,
    status: run.status,
    workspace_path: workspacePath
  });
});

app.get("/api/v1/runs/:runId", async (request, reply) => {
  const params = request.params as { runId: string };
  const run = runs.get(params.runId);
  if (!run) {
    return reply.code(404).send({ error: "Run not found" });
  }

  return {
    data: run
  };
});

app.post("/api/v1/runs/:runId/cancel", async (request, reply) => {
  const params = request.params as { runId: string };
  const run = runs.get(params.runId);
  if (!run) {
    return reply.code(404).send({ error: "Run not found" });
  }

  run.status = "cancelled";
  run.updatedAt = new Date().toISOString();
  run.logs.push(`${run.updatedAt} run cancelled by operator`);
  runs.set(params.runId, run);

  return {
    run_id: params.runId,
    status: "cancelled"
  };
});

const port = Number(process.env.PORT || 4100);
const host = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port, host });
  app.log.info({ host, port }, "runner-supervisor started");
} catch (error) {
  app.log.error(error, "runner-supervisor failed to start");
  process.exit(1);
}
