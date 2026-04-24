import type { FastifyInstance } from "fastify";
import { createId } from "../lib/id.js";
import type { MemoryStore } from "../store/memory-store.js";

export async function driftRoutes(app: FastifyInstance, store: MemoryStore): Promise<void> {
  app.post("/api/v1/instances/:instanceId/drift/scan", async (request) => {
    const params = request.params as { instanceId: string };
    const driftId = createId("drift");

    const report = {
      id: driftId,
      instanceId: params.instanceId,
      environment: "production" as const,
      generatedAt: new Date().toISOString(),
      status: "clean" as const,
      summary: "No drift detected against latest approved baseline.",
      changes: []
    };

    store.addDriftReport(report);

    return {
      drift_report_id: driftId,
      status: report.status
    };
  });

  app.get("/api/v1/drift/:driftReportId", async (request, reply) => {
    const params = request.params as { driftReportId: string };
    const report = store.getDriftReport(params.driftReportId);
    if (!report) {
      return reply.code(404).send({ error: "Drift report not found" });
    }

    return {
      data: report
    };
  });
}
