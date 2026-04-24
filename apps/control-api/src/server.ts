import { loadConfig } from "./config.js";
import { createApp } from "./app.js";

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const app = createApp(config);

  try {
    await app.listen({
      port: config.port,
      host: config.host
    });

    app.log.info(
      {
        port: config.port,
        host: config.host,
        repoRoot: config.repoRoot,
        artifactRoot: config.artifactRoot,
        stateStorePath: config.stateStorePath
      },
      "control-api started"
    );
  } catch (error) {
    app.log.error(error, "control-api failed to start");
    process.exit(1);
  }
}

void bootstrap();
