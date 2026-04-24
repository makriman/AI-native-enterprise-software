import Fastify from "fastify";
import cors from "@fastify/cors";
import type { ControlApiConfig } from "./config.js";
import { buildRoutes } from "./routes/builds.js";
import { connectionRoutes } from "./routes/connections.js";
import { deploymentRoutes } from "./routes/deployments.js";
import { driftRoutes } from "./routes/drift.js";
import { edgeJobRoutes } from "./routes/edge-jobs.js";
import { healthRoutes } from "./routes/health.js";
import { metadataRoutes } from "./routes/metadata.js";
import { MemoryStore } from "./store/memory-store.js";

export function createApp(config: ControlApiConfig) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info"
    }
  });

  const store = new MemoryStore();

  app.register(cors, {
    origin: true
  });

  app.register(async (instance) => {
    await healthRoutes(instance);
    await metadataRoutes(instance, store);
    await buildRoutes(instance, store, config);
    await deploymentRoutes(instance, store);
    await edgeJobRoutes(instance, store);
    await connectionRoutes(instance, store);
    await driftRoutes(instance, store);
  });

  return app;
}
