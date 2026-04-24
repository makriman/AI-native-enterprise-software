import { EventEmitter } from "node:events";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
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

interface MemoryStoreOptions {
  stateFilePath?: string;
}

interface StoreSnapshot {
  buildEvents: Array<[string, BuildEvent[]]>;
  builds: Array<[string, BuildEnvelope]>;
  deployments: Array<[string, DeploymentEnvelope]>;
  approvals: ApprovalAction[];
  driftReports: Array<[string, DriftReport]>;
  connections: ConnectionRecord[];
  edgeJobs: Array<[string, EdgeJob]>;
  workspaces: Array<[string, Workspace]>;
  instances: Array<[string, Instance]>;
  environments: Array<[string, EnvironmentRecord[]]>;
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

  private readonly stateFilePath?: string;

  constructor(options: MemoryStoreOptions = {}) {
    this.stateFilePath = options.stateFilePath;

    if (!this.restoreSnapshot()) {
      this.seedDefaults();
      this.persistSnapshot();
    }
  }

  private seedDefaults(): void {
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

  private replaceMap<K, V>(target: Map<K, V>, entries: Array<[K, V]>): void {
    target.clear();
    for (const [key, value] of entries) {
      target.set(key, value);
    }
  }

  private snapshot(): StoreSnapshot {
    return {
      buildEvents: Array.from(this.buildEvents.entries()),
      builds: Array.from(this.builds.entries()),
      deployments: Array.from(this.deployments.entries()),
      approvals: this.approvals,
      driftReports: Array.from(this.driftReports.entries()),
      connections: this.connections,
      edgeJobs: Array.from(this.edgeJobs.entries()),
      workspaces: Array.from(this.workspaces.entries()),
      instances: Array.from(this.instances.entries()),
      environments: Array.from(this.environments.entries())
    };
  }

  private restoreSnapshot(): boolean {
    if (!this.stateFilePath || !existsSync(this.stateFilePath)) {
      return false;
    }

    try {
      const raw = readFileSync(this.stateFilePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<StoreSnapshot>;

      this.replaceMap(this.buildEvents, parsed.buildEvents ?? []);
      this.replaceMap(this.builds, parsed.builds ?? []);
      this.replaceMap(this.deployments, parsed.deployments ?? []);
      this.approvals.splice(0, this.approvals.length, ...(parsed.approvals ?? []));
      this.replaceMap(this.driftReports, parsed.driftReports ?? []);
      this.connections.splice(0, this.connections.length, ...(parsed.connections ?? []));
      this.replaceMap(this.edgeJobs, parsed.edgeJobs ?? []);
      this.replaceMap(this.workspaces, parsed.workspaces ?? []);
      this.replaceMap(this.instances, parsed.instances ?? []);
      this.replaceMap(this.environments, parsed.environments ?? []);

      return this.workspaces.size > 0 && this.instances.size > 0;
    } catch {
      return false;
    }
  }

  private persistSnapshot(): void {
    if (!this.stateFilePath) {
      return;
    }

    try {
      mkdirSync(dirname(this.stateFilePath), { recursive: true });
      writeFileSync(this.stateFilePath, JSON.stringify(this.snapshot(), null, 2), "utf8");
    } catch {
      // Keep runtime resilient even if snapshot persistence fails.
    }
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
    this.persistSnapshot();
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
    this.persistSnapshot();
  }

  setBuildPlan(buildId: string, plan: BuildPlan): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.plan = plan;
    this.builds.set(buildId, existing);
    this.persistSnapshot();
  }

  setBuildSpec(buildId: string, spec: unknown): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.spec = spec;
    this.builds.set(buildId, existing);
    this.persistSnapshot();
  }

  setBuildFindings(buildId: string, findings: PolicyFinding[]): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.findings = findings;
    this.builds.set(buildId, existing);
    this.persistSnapshot();
  }

  addArtifact(buildId: string, artifact: Artifact): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.artifacts.push(artifact);
    this.builds.set(buildId, existing);
    this.persistSnapshot();
  }

  setTestStatus(buildId: string, status: BuildEnvelope["testStatus"]): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.testStatus = status;
    this.builds.set(buildId, existing);
    this.persistSnapshot();
  }

  setPreviews(buildId: string, previews: BuildEnvelope["previews"]): void {
    const existing = this.builds.get(buildId);
    if (!existing) {
      return;
    }

    existing.previews = previews;
    this.builds.set(buildId, existing);
    this.persistSnapshot();
  }

  addBuildEvent(buildId: string, event: BuildEvent): void {
    const list = this.buildEvents.get(buildId) ?? [];
    list.push(event);
    this.buildEvents.set(buildId, list);
    this.eventEmitter.emit(`build:${buildId}`, event);
    this.persistSnapshot();
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
    this.persistSnapshot();
  }

  listApprovals(buildId: string): ApprovalAction[] {
    return this.approvals.filter((approval) => approval.buildId === buildId);
  }

  createDeployment(deployment: Deployment): void {
    this.deployments.set(deployment.id, {
      deployment,
      logs: []
    });
    this.persistSnapshot();
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
    this.persistSnapshot();
  }

  appendDeploymentLog(deploymentId: string, message: string): void {
    const entry = this.deployments.get(deploymentId);
    if (!entry) {
      return;
    }
    entry.logs.push(message);
    this.deployments.set(deploymentId, entry);
    this.persistSnapshot();
  }

  registerConnection(connection: ConnectionRecord): void {
    this.connections.push(connection);
    this.persistSnapshot();
  }

  listConnections(workspaceId: string): ConnectionRecord[] {
    return this.connections.filter((connection) => connection.workspaceId === workspaceId);
  }

  addDriftReport(report: DriftReport): void {
    this.driftReports.set(report.id, report);
    this.persistSnapshot();
  }

  getDriftReport(reportId: string): DriftReport | undefined {
    return this.driftReports.get(reportId);
  }

  createEdgeJob(job: EdgeJob): void {
    this.edgeJobs.set(job.id, job);
    this.persistSnapshot();
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
    this.persistSnapshot();
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
    this.persistSnapshot();
    return job;
  }
}

export type { ApprovalAction, BuildEnvelope, ConnectionRecord, DeploymentEnvelope, EdgeJob };
