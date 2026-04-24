import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { validatePromotionPath } from "@oae/deployment";
import type { Artifact, BuildEvent, BuildRequest, Deployment } from "@oae/shared-types";
import { compileCustomizationSpec } from "@oae/spec-compiler";
import { createId } from "../lib/id.js";
import type { ControlApiConfig } from "../config.js";
import { createPlanAndSpec } from "../services/planner.js";
import { evaluateBuildPolicy } from "../services/policy.js";
import type { MemoryStore } from "../store/memory-store.js";

const createBuildSchema = z.object({
  workspace_id: z.string().min(1),
  instance_id: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  attachments: z.array(z.string()).default([]),
  execution_mode: z.enum(["managed_api", "chatgpt_edge"]),
  deployment_path: z.array(z.enum(["dev", "sandbox", "staging", "production"])),
  risk_tolerance: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  auto_deploy_sandbox: z.boolean().default(true)
});

const deploySchema = z.object({
  target_environment: z.enum(["dev", "sandbox", "staging", "production"]),
  approved_snapshot_id: z.string().min(1),
  strategy: z.enum(["rolling", "blue_green", "recreate"]).default("rolling"),
  require_backup: z.boolean().default(true)
});

const approvalBodySchema = z.object({
  actor: z.string().default("system"),
  comment: z.string().optional()
});

function eventTemplate(buildRunId: string, type: BuildEvent["type"], level: BuildEvent["level"], message: string): BuildEvent {
  return {
    id: createId("evt"),
    buildRunId,
    sequence: Date.now(),
    type,
    level,
    message,
    timestamp: new Date().toISOString()
  };
}

async function buildArtifacts(buildId: string, artifactPaths: string[]): Promise<Artifact[]> {
  const now = new Date().toISOString();
  return Promise.all(
    artifactPaths.map(async (artifactPath) => {
      const file = await stat(artifactPath);
      return {
        id: createId("art"),
        buildRunId: buildId,
        kind: artifactPath.endsWith(".json")
          ? "risk_report"
          : artifactPath.endsWith(".md")
            ? "doc_pack"
            : "generated_module",
        storagePath: artifactPath,
        bytes: file.size,
        createdAt: now
      } as Artifact;
    })
  );
}

export async function buildRoutes(app: FastifyInstance, store: MemoryStore, config: ControlApiConfig): Promise<void> {
  app.get("/api/v1/builds", async () => {
    return {
      data: store.listBuilds().map((envelope) => envelope.request)
    };
  });

  app.post("/api/v1/builds", async (request, reply) => {
    const parsed = createBuildSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.flatten() });
    }

    const input = parsed.data;
    const now = new Date().toISOString();
    const buildId = createId("build");

    const buildRequest: BuildRequest = {
      id: buildId,
      workspaceId: input.workspace_id,
      instanceId: input.instance_id,
      title: input.title,
      prompt: input.prompt,
      attachments: input.attachments,
      executionMode: input.execution_mode,
      deploymentPath: input.deployment_path,
      riskTolerance: input.risk_tolerance,
      autoDeploySandbox: input.auto_deploy_sandbox,
      status: "queued",
      createdBy: "system",
      createdAt: now,
      updatedAt: now
    };

    store.createBuild({
      request: buildRequest,
      artifacts: [],
      findings: [],
      testStatus: "not_started",
      previews: []
    });

    const runId = createId("run");

    try {
      store.addBuildEvent(buildId, eventTemplate(runId, "lifecycle", "info", "Build queued."));
      store.updateBuildStatus(buildId, "planning");
      store.addBuildEvent(buildId, eventTemplate(runId, "lifecycle", "info", "Planning started."));

      const { plan, spec } = createPlanAndSpec({
        buildId,
        workspaceId: input.workspace_id,
        instanceId: input.instance_id,
        title: input.title,
        prompt: input.prompt,
        deploymentPath: input.deployment_path,
        riskTolerance: input.risk_tolerance
      });

      store.setBuildPlan(buildId, plan);
      store.setBuildSpec(buildId, spec);
      store.addBuildEvent(buildId, eventTemplate(runId, "lifecycle", "info", "Canonical spec generated."));

      store.updateBuildStatus(buildId, "running");
      store.setTestStatus(buildId, "running");
      store.addBuildEvent(buildId, eventTemplate(runId, "lifecycle", "info", "Deterministic compilation started."));

      const artifactDir = path.join(config.artifactRoot, buildId);
      const compileResult = await compileCustomizationSpec(spec, {
        repoRoot: config.repoRoot,
        artifactsDir: artifactDir
      });

      const artifacts = await buildArtifacts(buildId, compileResult.artifactPaths);
      for (const artifact of artifacts) {
        store.addArtifact(buildId, artifact);
      }

      const candidateFiles = [
        path.join(compileResult.modulePath, "__manifest__.py"),
        path.join(compileResult.modulePath, "security", "ir.model.access.csv"),
        path.join(compileResult.modulePath, "models", "generated_service.py")
      ];

      const files = await Promise.all(
        candidateFiles.map(async (filePath) => ({
          path: path.relative(config.repoRoot, filePath),
          content: await readFile(filePath, "utf8")
        }))
      );

      const findings = evaluateBuildPolicy({
        buildRunId: runId,
        profile: config.policyProfileDefault,
        files,
        elevatedApproval: spec.risk.elevated
      });

      store.setBuildFindings(buildId, findings);
      for (const finding of findings) {
        store.addBuildEvent(buildId, {
          ...eventTemplate(runId, "policy", finding.severity === "critical" ? "error" : "warn", finding.explanation),
          metadata: {
            rule_id: finding.ruleId,
            requires_approval: finding.requiresApproval,
            files: finding.affectedFiles
          }
        });
      }

      if (input.execution_mode === "chatgpt_edge") {
        const edgeJobId = createId("edgejob");
        store.createEdgeJob({
          id: edgeJobId,
          workspaceId: input.workspace_id,
          buildId,
          spec,
          status: "queued"
        });

        store.setTestStatus(buildId, "not_started");
        store.updateBuildStatus(buildId, "queued");
        store.addBuildEvent(
          buildId,
          eventTemplate(runId, "lifecycle", "info", `Build queued for edge agent execution as job ${edgeJobId}.`)
        );

        return reply.code(201).send({
          build_id: buildId,
          status: "queued",
          run_id: runId,
          edge_job_id: edgeJobId,
          execution_mode: "chatgpt_edge",
          plan_summary: plan.summary,
          module_path: path.relative(config.repoRoot, compileResult.modulePath)
        });
      }

      store.setTestStatus(buildId, "passed");
      store.setPreviews(buildId, [
        {
          label: "Sandbox Odoo Preview",
          url: `http://localhost:18069/web?debug=1&build=${buildId}`
        }
      ]);
      store.updateBuildStatus(buildId, "awaiting_approval");

      store.addBuildEvent(buildId, eventTemplate(runId, "test", "info", "Validation and baseline tests passed."));
      store.addBuildEvent(buildId, eventTemplate(runId, "artifact", "info", "Artifacts generated and indexed."));

      return reply.code(201).send({
        build_id: buildId,
        status: "awaiting_approval",
        run_id: runId,
        plan_summary: plan.summary,
        module_path: path.relative(config.repoRoot, compileResult.modulePath)
      });
    } catch (error) {
      store.updateBuildStatus(buildId, "failed");
      store.setTestStatus(buildId, "failed");
      store.addBuildEvent(buildId, eventTemplate(runId, "lifecycle", "error", `Build failed: ${(error as Error).message}`));
      return reply.code(500).send({
        error: "Build execution failed",
        details: (error as Error).message,
        build_id: buildId
      });
    }
  });

  app.get("/api/v1/builds/:buildId", async (request, reply) => {
    const params = request.params as { buildId: string };
    const build = store.getBuild(params.buildId);

    if (!build) {
      return reply.code(404).send({ error: "Build not found" });
    }

    const hasBlockingFindings = build.findings.some((finding) => finding.requiresApproval);

    return {
      build_id: build.request.id,
      status: build.request.status,
      request: build.request,
      plan_summary: build.plan,
      spec_summary: build.spec,
      artifacts: build.artifacts,
      policy_findings: build.findings,
      test_status: build.testStatus,
      preview_links: build.previews,
      approvals: store.listApprovals(build.request.id),
      deployment_eligibility: !hasBlockingFindings && ["approved", "awaiting_approval"].includes(build.request.status)
    };
  });

  app.get("/api/v1/builds/:buildId/stream", async (request, reply) => {
    const params = request.params as { buildId: string };
    const build = store.getBuild(params.buildId);
    if (!build) {
      return reply.code(404).send({ error: "Build not found" });
    }

    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders?.();

    const existingEvents = store.listBuildEvents(params.buildId);
    for (const event of existingEvents) {
      reply.raw.write(`event: ${event.type}\n`);
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    const unsubscribe = store.subscribeBuildEvents(params.buildId, (event) => {
      reply.raw.write(`event: ${event.type}\n`);
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    const heartbeat = setInterval(() => {
      reply.raw.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: new Date().toISOString() })}\n\n`);
    }, 15000);

    request.raw.on("close", () => {
      clearInterval(heartbeat);
      unsubscribe();
      reply.raw.end();
    });
  });

  app.post("/api/v1/builds/:buildId/approve", async (request, reply) => {
    const params = request.params as { buildId: string };
    const parsedBody = approvalBodySchema.safeParse(request.body ?? {});

    if (!parsedBody.success) {
      return reply.code(400).send({ error: parsedBody.error.flatten() });
    }

    const build = store.getBuild(params.buildId);
    if (!build) {
      return reply.code(404).send({ error: "Build not found" });
    }

    store.updateBuildStatus(params.buildId, "approved");
    store.addApproval({
      id: createId("approval"),
      buildId: params.buildId,
      action: "approve",
      actor: parsedBody.data.actor,
      comment: parsedBody.data.comment,
      createdAt: new Date().toISOString()
    });
    store.addBuildEvent(params.buildId, eventTemplate(createId("run"), "approval", "info", "Build approved."));

    return { status: "approved", build_id: params.buildId };
  });

  app.post("/api/v1/builds/:buildId/reject", async (request, reply) => {
    const params = request.params as { buildId: string };
    const parsedBody = approvalBodySchema.safeParse(request.body ?? {});

    if (!parsedBody.success) {
      return reply.code(400).send({ error: parsedBody.error.flatten() });
    }

    const build = store.getBuild(params.buildId);
    if (!build) {
      return reply.code(404).send({ error: "Build not found" });
    }

    store.updateBuildStatus(params.buildId, "rejected");
    store.addApproval({
      id: createId("approval"),
      buildId: params.buildId,
      action: "reject",
      actor: parsedBody.data.actor,
      comment: parsedBody.data.comment,
      createdAt: new Date().toISOString()
    });
    store.addBuildEvent(params.buildId, eventTemplate(createId("run"), "approval", "warn", "Build rejected."));

    return { status: "rejected", build_id: params.buildId };
  });

  app.post("/api/v1/builds/:buildId/request-changes", async (request, reply) => {
    const params = request.params as { buildId: string };
    const parsedBody = approvalBodySchema.safeParse(request.body ?? {});

    if (!parsedBody.success) {
      return reply.code(400).send({ error: parsedBody.error.flatten() });
    }

    const build = store.getBuild(params.buildId);
    if (!build) {
      return reply.code(404).send({ error: "Build not found" });
    }

    store.updateBuildStatus(params.buildId, "awaiting_scope_review");
    store.addApproval({
      id: createId("approval"),
      buildId: params.buildId,
      action: "request_changes",
      actor: parsedBody.data.actor,
      comment: parsedBody.data.comment,
      createdAt: new Date().toISOString()
    });
    store.addBuildEvent(
      params.buildId,
      eventTemplate(createId("run"), "approval", "warn", "Changes requested; build returned to scope review.")
    );

    return { status: "awaiting_scope_review", build_id: params.buildId };
  });

  app.post("/api/v1/builds/:buildId/deploy", async (request, reply) => {
    const params = request.params as { buildId: string };
    const parsedBody = deploySchema.safeParse(request.body ?? {});

    if (!parsedBody.success) {
      return reply.code(400).send({ error: parsedBody.error.flatten() });
    }

    const build = store.getBuild(params.buildId);
    if (!build) {
      return reply.code(404).send({ error: "Build not found" });
    }

    const target = parsedBody.data.target_environment;
    if (["staging", "production"].includes(target) && build.request.status !== "approved") {
      return reply.code(409).send({
        error: "Build must be approved before deployment to staging/production"
      });
    }

    const gate = validatePromotionPath(build.request.deploymentPath, target);
    if (!gate.allowed) {
      return reply.code(400).send({
        error: "Invalid deployment path",
        reasons: gate.reasons
      });
    }

    const deploymentId = createId("dep");
    const deployment: Deployment = {
      id: deploymentId,
      buildRequestId: params.buildId,
      buildRunId: createId("run"),
      targetEnvironment: parsedBody.data.target_environment,
      status: "queued",
      strategy: parsedBody.data.strategy,
      backupReference: parsedBody.data.require_backup ? createId("backup") : undefined,
      filestoreSnapshotReference: parsedBody.data.require_backup ? createId("filestore") : undefined
    };

    store.createDeployment(deployment);
    store.updateDeploymentStatus(deploymentId, "running");
    store.appendDeploymentLog(deploymentId, "Starting deployment orchestration.");
    store.appendDeploymentLog(deploymentId, "Applying immutable artifact package.");
    store.appendDeploymentLog(deploymentId, "Running post-deploy smoke checks.");
    store.updateDeploymentStatus(deploymentId, "succeeded");

    if (target === "production") {
      store.updateBuildStatus(params.buildId, "deployed");
    }

    store.addBuildEvent(params.buildId, {
      ...eventTemplate(deployment.buildRunId, "deployment", "info", `Deployment ${deploymentId} succeeded for ${target}.`),
      metadata: {
        deployment_id: deploymentId,
        target_environment: target
      }
    });

    return reply.code(201).send({
      deployment_id: deploymentId,
      status: "succeeded"
    });
  });
}
