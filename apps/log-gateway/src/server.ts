import { createApp } from "./app.js";

const app = await createApp();
const port = Number(process.env.PORT || 4300);
const host = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port, host });
  app.log.info({ host, port }, "log-gateway started");
} catch (error) {
  app.log.error(error, "log-gateway failed to start");
  process.exit(1);
}
