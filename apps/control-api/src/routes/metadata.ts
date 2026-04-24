import type { FastifyInstance } from "fastify";
import type { MemoryStore } from "../store/memory-store.js";

export async function metadataRoutes(app: FastifyInstance, store: MemoryStore): Promise<void> {
  app.get("/api/v1/workspaces", async () => ({
    data: store.listWorkspaces()
  }));

  app.get("/api/v1/instances", async (request) => {
    const query = request.query as { workspace_id?: string };
    return {
      data: store.listInstances(query.workspace_id)
    };
  });

  app.get("/api/v1/instances/:instanceId/environments", async (request, reply) => {
    const params = request.params as { instanceId: string };
    const data = store.listEnvironments(params.instanceId);
    if (!data.length) {
      return reply.code(404).send({ error: "Instance not found" });
    }

    return { data };
  });
}
