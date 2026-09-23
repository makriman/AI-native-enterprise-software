import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { authorizeBearer } from "@oae/service-auth";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const ingestSchema = z.object({
  stream: z.string().min(1),
  type: z.string().min(1),
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  message: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional()
});

interface GatewayEvent {
  id: string;
  stream: string;
  type: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface LogGatewayOptions {
  token?: string;
}

function optionalSecret(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function createApp(options: LogGatewayOptions = {}): Promise<FastifyInstance> {
  const token = options.token !== undefined ? optionalSecret(options.token) : optionalSecret(process.env.LOG_GATEWAY_TOKEN);
  const events = new Map<string, GatewayEvent[]>();
  const app = Fastify({ logger: { level: process.env.LOG_LEVEL || "info" } });

  await app.register(cors, { origin: true });
  await app.register(websocket);

  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0] || request.url;
    if (request.method === "GET" && path === "/health") {
      return;
    }

    const decision = authorizeBearer(request.headers.authorization, token);
    if (!decision.ok) {
      if (decision.status === 503) {
        request.log.error({ path }, "refusing request because LOG_GATEWAY_TOKEN is not configured");
      }
      return reply.code(decision.status).send({ error: decision.error });
    }
  });

  app.get("/health", async () => ({ status: "ok", service: "log-gateway", timestamp: new Date().toISOString() }));

  app.post("/api/v1/logs/ingest", async (request, reply) => {
    const parsed = ingestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const event: GatewayEvent = {
      id: `lge_${uuidv4().replace(/-/g, "").slice(0, 12)}`,
      stream: parsed.data.stream,
      type: parsed.data.type,
      level: parsed.data.level,
      message: parsed.data.message,
      metadata: parsed.data.metadata,
      timestamp: new Date().toISOString()
    };

    const list = events.get(event.stream) ?? [];
    list.push(event);
    events.set(event.stream, list);

    return reply.code(202).send({ event_id: event.id, accepted: true });
  });

  app.get("/api/v1/logs/:stream/replay", async (request) => {
    const params = request.params as { stream: string };
    return {
      data: events.get(params.stream) ?? []
    };
  });

  app.get("/api/v1/logs/ws", { websocket: true }, (socket, request) => {
    const query = request.query as { stream?: string };
    const stream = query.stream;

    if (!stream) {
      socket.send(JSON.stringify({ error: "Missing stream query parameter" }));
      socket.close();
      return;
    }

    const replay = events.get(stream) ?? [];
    for (const event of replay) {
      socket.send(JSON.stringify(event));
    }

    const poll = setInterval(() => {
      const snapshot = events.get(stream) ?? [];
      if (!snapshot.length) {
        return;
      }

      const last = snapshot[snapshot.length - 1]!;
      socket.send(JSON.stringify({ heartbeat: true, latest: last.id, ts: new Date().toISOString() }));
    }, 10000);
    poll.unref();

    socket.on("close", () => {
      clearInterval(poll);
    });
  });

  return app;
}
