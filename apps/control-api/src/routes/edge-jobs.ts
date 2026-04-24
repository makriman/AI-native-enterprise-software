import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createId } from "../lib/id.js";
import type { MemoryStore } from "../store/memory-store.js";

const completeSchema = z.object({
  status: z.enum(["succeeded", "failed"]),
  artifact_paths: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export async function edgeJobRoutes(app: FastifyInstance, store: MemoryStore): Promise<void> {
  app.post("/api/v1/edge/jobs/enqueue", async (request, reply) => {
    const body = request.body as { workspace_id?: string; build_id?: string; spec_json?: unknown };

    if (!body.workspace_id || !body.build_id || !body.spec_json) {
      return reply.code(400).send({ error: "workspace_id, build_id and spec_json are required" });
    }

    const id = createId("edgejob");
    store.createEdgeJob({
      id,
      workspaceId: body.workspace_id,
      buildId: body.build_id,
      spec: body.spec_json,
      status: "queued"
    });

    return reply.code(201).send({ job_id: id, status: "queued" });
  });

  app.get("/api/v1/edge/jobs/next", async (request, reply) => {
    const query = request.query as { workspace_id?: string; agent_id?: string };

    if (!query.workspace_id || !query.agent_id) {
      return reply.code(400).send({ error: "workspace_id and agent_id are required" });
    }

    const job = store.claimEdgeJob(query.workspace_id, query.agent_id);
    if (!job) {
      return reply.code(204).send();
    }

    return {
      id: job.id,
      build_id: job.buildId,
      spec_json: job.spec
    };
  });

  app.post("/api/v1/edge/jobs/:jobId/complete", async (request, reply) => {
    const params = request.params as { jobId: string };
    const parsed = completeSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const completed = store.completeEdgeJob(params.jobId, {
      status: parsed.data.status,
      result: {
        artifact_paths: parsed.data.artifact_paths,
        notes: parsed.data.notes
      }
    });

    if (!completed) {
      return reply.code(404).send({ error: "Job not found" });
    }

    return {
      job_id: params.jobId,
      status: completed.status
    };
  });
}
