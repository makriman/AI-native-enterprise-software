import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { MemoryStore } from "../store/memory-store.js";

const rollbackSchema = z.object({
  actor: z.string().default("system"),
  reason: z.string().optional()
});

export async function deploymentRoutes(app: FastifyInstance, store: MemoryStore): Promise<void> {
  app.get("/api/v1/deployments/:deploymentId", async (request, reply) => {
    const params = request.params as { deploymentId: string };
    const deployment = store.getDeployment(params.deploymentId);
    if (!deployment) {
      return reply.code(404).send({ error: "Deployment not found" });
    }

    return {
      data: deployment
    };
  });

  app.post("/api/v1/deployments/:deploymentId/rollback", async (request, reply) => {
    const params = request.params as { deploymentId: string };
    const parsed = rollbackSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const deployment = store.getDeployment(params.deploymentId);
    if (!deployment) {
      return reply.code(404).send({ error: "Deployment not found" });
    }

    store.appendDeploymentLog(params.deploymentId, `Rollback initiated by ${parsed.data.actor}.`);
    if (parsed.data.reason) {
      store.appendDeploymentLog(params.deploymentId, `Reason: ${parsed.data.reason}`);
    }

    store.updateDeploymentStatus(params.deploymentId, "rolled_back");

    return reply.code(200).send({
      deployment_id: params.deploymentId,
      status: "rolled_back"
    });
  });
}
