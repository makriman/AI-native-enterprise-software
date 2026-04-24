import { EventEmitter } from "node:events";
import type {
  Artifact,
  BuildEvent,
  BuildPlan,
  BuildRequest,
  BuildRequestStatus,
  Deployment,
  DeploymentStatus,
  DriftReport,
  EnvironmentRecord,
  Instance,
  PolicyFinding,
  Workspace
} from "@oae/shared-types";

interface BuildEnvelope {
  request: BuildRequest;
  plan?: BuildPlan;
  spec?: unknown;
  artifacts: Artifact[];
  findings: PolicyFinding[];
  testStatus:
    | "not_started"
    | "running"
    | "passed"
    | "failed";
  previews: Array<{
    label: string;
    url: string;
  }>;
}

interface DeploymentEnvelope {
  deployment: Deployment;
  logs: string[];
}

interface ApprovalAction {
  id: string;
  buildId: string;
  action: "approve" | "reject" | "request_changes";
  actor: string;
  comment?: string;
  createdAt: string;
}

interface ConnectionRecord {
  id: string;
  workspaceId: string;
  type: "openai_api" | "edge_agent" | "odoo_instance";
  name: string;
  status: "connected" | "error" | "pending";
  createdAt: string;
  updatedAt: string;
}

interface EdgeJob {
  id: string;
  workspaceId: string;
  buildId: string;
  spec: unknown;
  status: "queued" | "claimed" | "succeeded" | "failed";
  claimedBy?: string;
  claimedAt?: string;
  completedAt?: string;
  result?: Record<string, unknown>;
}

export class MemoryStore {
  private readonly eventEmitter = new EventEmitter();
  private readonly buildEvents = new Map<string, BuildEvent[]>();
  private readonly builds = new Map<string, BuildEnvelope>();
  private readonly deployments = new Map<string, DeploymentEnvelope>();
  private readonly approvals: ApprovalAction[] = [];
  private readonly driftReports = new Map<string, DriftReport>();
  private readonly connections: ConnectionRecord[] = [];
  private readonly edgeJobs = new Map<string, EdgeJob>();

  private readonly workspaces = new Map<string, Workspace>();
  private readonly instances = new Map<string, Instance>();
  private readonly environments = new Map<string, EnvironmentRecord[]>();

  constructor() {
    const now = new Date().toISOString();

    const workspace: Workspace = {
      id: "ws_default",
      name: "Default Workspace",
      slug: "default-workspace",
      policyProfile: "standard",
      createdAt: now,
      updatedAt: now
    };
    this.workspaces.set(workspace.id, workspace);

    const instance: Instance = {
      id: "inst_default",
      workspaceId: workspace.id,
      name: "Primary Odoo Instance",
      slug: "primary-odoo",
      odooUrl: "http://odoo:8069",
      odooVersion: "19.x",
      createdAt: now,
      updatedAt: now
    };
    this.instances.set(instance.id, instance);

    const envRecords: EnvironmentRecord[] = [
      {
        id: "env_dev",
        instanceId: instance.id,
        kind: "dev",
        branch: "develop",
        isProtected: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "env_sandbox",
        instanceId: instance.id,
        kind: "sandbox",
        branch: "sandbox",
        isProtected: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "env_staging",
        instanceId: instance.id,
        kind: "staging",
        branch: "staging",
        isProtected: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "env_production",
        instanceId: instance.id,
        kind: "production",
        branch: "main",
        isProtected: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    this.environments.set(instance.id, envRecords);
  }

  listWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  listInstances(workspaceId?: string): Instance[] {
    const all = Array.from(this.instances.values());
    if (!workspaceId) {
      return all;
    }
    return all.filter((instance) => instance.workspaceId === workspaceId);
  }

  listEnvironments(instanceId: string): EnvironmentRecord[] {
    return this.environments.get(instanceId) ?? [];
  }

  createBuild(envelope: BuildEnvelope): void {
    this.builds.set(envelope.request.id, envelope);
  }

  getBuild(buildId: string): BuildEnvelope | undefined {
    return this.builds.get(buildId);
  }

  listBuilds(): BuildEnvelope[] {
    return Array.from(this.builds.values()).sort((a, b) => b.request.createdAt.localeCompare(a.request.createdAt));
  }

  updateBuildStatus(buildId: string, status: BuildRequestStatus): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.request.status = status;
    existing.request.updatedAt = new Date().toISOString();
    this.builds.set(buildId, existing);
  }

  setBuildPlan(buildId: string, plan: BuildPlan): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.plan = plan;
    this.builds.set(buildId, existing);
  }

  setBuildSpec(buildId: string, spec: unknown): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.spec = spec;
    this.builds.set(buildId, existing);
  }

  setBuildFindings(buildId: string, findings: PolicyFinding[]): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.findings = findings;
    this.builds.set(buildId, existing);
  }

  addArtifact(buildId: string, artifact: Artifact): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.artifacts.push(artifact);
    this.builds.set(buildId, existing);
  }

  setTestStatus(buildId: string, status: BuildEnvelope["testStatus"]): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.testStatus = status;
    this.builds.set(buildId, existing);
  }

  setPreviews(buildId: string, previews: BuildEnvelope["previews"]): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.previews = previews;
    this.builds.set(buildId, existing);
  }

  addBuildEvent(buildId: string, event: BuildEvent): void {
    const list = this.buildEvents.get(buildId) ?? [];
    list.push(event);
    this.buildEvents.set(buildId, list);
    this.eventEmitter.emit(`build:${buildId}`, event);
  }

  listBuildEvents(buildId: string): BuildEvent[] {
    return this.buildEvents.get(buildId) ?? [];
  }

  subscribeBuildEvents(buildId: string, listener: (event: BuildEvent) => void): () => void {
    const eventName = `build:${buildId}`;
    this.eventEmitter.on(eventName, listener);
    return () => {
      this.eventEmitter.off(eventName, listener);
    };
  }

  addApproval(action: ApprovalAction): void {
    this.approvals.push(action);
  }

  listApprovals(buildId: string): ApprovalAction[] {
    return this.approvals.filter((approval) => approval.buildId === buildId);
  }

  createDeployment(deployment: Deployment): void {
    this.deployments.set(deployment.id, {
      deployment,
      logs: []
    });
  }

  getDeployment(deploymentId: string): DeploymentEnvelope | undefined {
    return this.deployments.get(deploymentId);
  }

  updateDeploymentStatus(deploymentId: string, status: DeploymentStatus): void {
    const entry = this.deployments.get(deploymentId);
    if (!entry) {
      return;
    }
    entry.deployment.status = status;
    if (status === "running" && !entry.deployment.startedAt) {
      entry.deployment.startedAt = new Date().toISOString();
    }
    if (["succeeded", "failed", "rolled_back"].includes(status)) {
      entry.deployment.completedAt = new Date().toISOString();
    }
    this.deployments.set(deploymentId, entry);
  }

  appendDeploymentLog(deploymentId: string, message: string): void {
    const entry = this.deployments.get(deploymentId);
    if (!entry) {
      return;
    }
    entry.logs.push(message);
    this.deployments.set(deploymentId, entry);
  }

  registerConnection(connection: ConnectionRecord): void {
    this.connections.push(connection);
  }

  listConnections(workspaceId: string): ConnectionRecord[] {
    return this.connections.filter((connection) => connection.workspaceId === workspaceId);
  }

  addDriftReport(report: DriftReport): void {
    this.driftReports.set(report.id, report);
  }

  getDriftReport(reportId: string): DriftReport | undefined {
    return this.driftReports.get(reportId);
  }

  createEdgeJob(job: EdgeJob): void {
    this.edgeJobs.set(job.id, job);
  }

  claimEdgeJob(workspaceId: string, agentId: string): EdgeJob | undefined {
    const candidate = Array.from(this.edgeJobs.values()).find(
      (job) => job.workspaceId === workspaceId && job.status === "queued"
    );
    if (!candidate) {
      return undefined;
    }

    candidate.status = "claimed";
    candidate.claimedBy = agentId;
    candidate.claimedAt = new Date().toISOString();
    this.edgeJobs.set(candidate.id, candidate);
    return candidate;
  }

  completeEdgeJob(
    jobId: string,
    payload: {
      status: "succeeded" | "failed";
      result: Record<string, unknown>;
    }
  ): EdgeJob | undefined {
    const job = this.edgeJobs.get(jobId);
    if (!job) {
      return undefined;
    }

    job.status = payload.status;
    job.result = payload.result;
    job.completedAt = new Date().toISOString();
    this.edgeJobs.set(jobId, job);
    return job;
  }
}

export type { ApprovalAction, BuildEnvelope, ConnectionRecord, DeploymentEnvelope, EdgeJob };
