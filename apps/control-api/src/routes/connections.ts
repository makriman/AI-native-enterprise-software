import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createId } from "../lib/id.js";
import type { MemoryStore } from "../store/memory-store.js";

const openAiConnectionSchema = z.object({
  workspace_id: z.string().min(1),
  name: z.string().min(1),
  key_hint: z.string().optional()
});

const edgeRegisterSchema = z.object({
  workspace_id: z.string().min(1),
  name: z.string().min(1),
  host: z.string().min(1),
  token: z.string().min(1)
});

const edgeHeartbeatSchema = z.object({
  workspace_id: z.string().min(1),
  agent_id: z.string().min(1),
  status: z.enum(["online", "offline", "busy", "disabled"])
});

const odooConnectionSchema = z.object({
  workspace_id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  db_name: z.string().min(1)
});

export async function connectionRoutes(app: FastifyInstance, store: MemoryStore): Promise<void> {
  app.post("/api/v1/connections/openai-api", async (request, reply) => {
    const parsed = openAiConnectionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const now = new Date().toISOString();
    const id = createId("conn");
    store.registerConnection({
      id,
      workspaceId: parsed.data.workspace_id,
      type: "openai_api",
      name: parsed.data.name,
      status: "connected",
      createdAt: now,
      updatedAt: now
    });

    return reply.code(201).send({ connection_id: id, status: "connected" });
  });

  app.post("/api/v1/connections/edge-agent/register", async (request, reply) => {
    const parsed = edgeRegisterSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const now = new Date().toISOString();
    const id = createId("agent");
    store.registerConnection({
      id,
      workspaceId: parsed.data.workspace_id,
      type: "edge_agent",
      name: parsed.data.name,
      status: "connected",
      createdAt: now,
      updatedAt: now
    });

    return reply.code(201).send({ agent_id: id, status: "online" });
  });

  app.post("/api/v1/connections/edge-agent/heartbeat", async (request, reply) => {
    const parsed = edgeHeartbeatSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    return reply.code(200).send({
      status: "ok",
      received_at: new Date().toISOString(),
      agent_id: parsed.data.agent_id
    });
  });

  app.post("/api/v1/connections/odoo-instance", async (request, reply) => {
    const parsed = odooConnectionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const now = new Date().toISOString();
    const id = createId("conn");
    store.registerConnection({
      id,
      workspaceId: parsed.data.workspace_id,
      type: "odoo_instance",
      name: parsed.data.name,
      status: "connected",
      createdAt: now,
      updatedAt: now
    });

    return reply.code(201).send({ connection_id: id, status: "connected" });
  });

  app.get("/api/v1/workspaces/:workspaceId/connections", async (request) => {
    const params = request.params as { workspaceId: string };
    return {
      data: store.listConnections(params.workspaceId)
    };
  });
}
