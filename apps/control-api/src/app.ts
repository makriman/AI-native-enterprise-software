import Fastify from "fastify";
import cors from "@fastify/cors";
import { authorizeBearer, isEdgeAgentRoute } from "@oae/service-auth";
import type { ControlApiConfig } from "./config.js";
import { buildRoutes } from "./routes/builds.js";
import { connectionRoutes } from "./routes/connections.js";
import { deploymentRoutes } from "./routes/deployments.js";
import { driftRoutes } from "./routes/drift.js";
import { edgeJobRoutes } from "./routes/edge-jobs.js";
import { healthRoutes } from "./routes/health.js";
import { metadataRoutes } from "./routes/metadata.js";
import { MemoryStore } from "./store/memory-store.js";

export function createApp(config: ControlApiConfig, store = new MemoryStore({ stateFilePath: config.stateStorePath })) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info"
    }
  });

  app.register(cors, {
    origin: true
  });

  app.addHook("onRequest", async (request, reply) => {
    const path = request.url.split("?")[0] || request.url;
    if (request.method === "GET" && path === "/health") {
      return;
    }

    const secret = isEdgeAgentRoute(path) ? config.edgeAgentToken : config.apiToken;
    const decision = authorizeBearer(request.headers.authorization, secret);
    if (!decision.ok) {
      if (decision.status === 503) {
        request.log.error({ path }, "refusing request because the auth secret is not configured");
      }
      return reply.code(decision.status).send({ error: decision.error });
    }
  });

  app.register(async (instance) => {
    await healthRoutes(instance);
    await metadataRoutes(instance, store);
    await buildRoutes(instance, store, config);
    await deploymentRoutes(instance, store);
    await edgeJobRoutes(instance, store);
    await connectionRoutes(instance, store, config);
    await driftRoutes(instance, store);
  });

  return app;
}
