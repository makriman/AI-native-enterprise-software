export const BUILD_REQUEST_STATUSES = [
  "draft",
  "queued",
  "planning",
  "awaiting_scope_review",
  "running",
  "failed",
  "awaiting_approval",
  "approved",
  "rejected",
  "deployed"
] as const;

export type BuildRequestStatus = (typeof BUILD_REQUEST_STATUSES)[number];

export const DEPLOYMENT_STATUSES = ["queued", "running", "succeeded", "failed", "rolled_back"] as const;
export type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

export const RUNNER_AGENT_STATUSES = ["online", "offline", "busy", "disabled"] as const;
export type RunnerAgentStatus = (typeof RUNNER_AGENT_STATUSES)[number];

export const ENVIRONMENTS = ["dev", "sandbox", "staging", "production"] as const;
export type EnvironmentKind = (typeof ENVIRONMENTS)[number];

export const EXECUTION_MODES = ["managed_api", "chatgpt_edge"] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const POLICY_PROFILES = ["strict", "standard", "permissive_dev"] as const;
export type PolicyProfile = (typeof POLICY_PROFILES)[number];

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  policyProfile: PolicyProfile;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  userId: string;
  role: string;
  createdAt: string;
}

export interface Instance {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  odooUrl: string;
  odooVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentRecord {
  id: string;
  instanceId: string;
  kind: EnvironmentKind;
  branch: string;
  isProtected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BuildRequest {
  id: string;
  workspaceId: string;
  instanceId: string;
  title: string;
  prompt: string;
  attachments: string[];
  executionMode: ExecutionMode;
  deploymentPath: EnvironmentKind[];
  riskTolerance: RiskLevel;
  autoDeploySandbox: boolean;
  status: BuildRequestStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuildPlan {
  id: string;
  buildRequestId: string;
  summary: string;
  affectedModules: string[];
  changeClasses: Array<"class_0" | "class_a" | "class_b" | "class_c">;
  requiredTests: string[];
  riskLevel: RiskLevel;
  createdAt: string;
}

export interface BuildRun {
  id: string;
  buildRequestId: string;
  runnerType: "managed" | "edge";
  runnerId?: string;
  startedAt: string;
  completedAt?: string;
  status: "queued" | "running" | "failed" | "succeeded" | "cancelled";
  artifactRoot: string;
}

export interface BuildEvent {
  id: string;
  buildRunId: string;
  sequence: number;
  type:
    | "lifecycle"
    | "log"
    | "artifact"
    | "policy"
    | "test"
    | "deployment"
    | "approval";
  level: "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Artifact {
  id: string;
  buildRunId: string;
  kind:
    | "diff_bundle"
    | "log_transcript"
    | "test_report"
    | "generated_module"
    | "doc_pack"
    | "risk_report"
    | "deployment_manifest"
    | "rollback_plan"
    | "snapshot_pointer";
  storagePath: string;
  sha256?: string;
  bytes: number;
  createdAt: string;
}

export interface PolicyFinding {
  id: string;
  buildRunId: string;
  ruleId: string;
  severity: "low" | "medium" | "high" | "critical";
  summary: string;
  explanation: string;
  affectedFiles: string[];
  requiresApproval: boolean;
  createdAt: string;
}

export interface Deployment {
  id: string;
  buildRequestId: string;
  buildRunId: string;
  targetEnvironment: EnvironmentKind;
  status: DeploymentStatus;
  strategy: "rolling" | "blue_green" | "recreate";
  backupReference?: string;
  filestoreSnapshotReference?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface RollbackRecord {
  id: string;
  deploymentId: string;
  strategy: "db_restore" | "filestore_restore" | "compensating_migration";
  status: "planned" | "running" | "succeeded" | "failed";
  notes: string;
  createdAt: string;
}

export interface DriftReport {
  id: string;
  instanceId: string;
  environment: EnvironmentKind;
  generatedAt: string;
  status: "clean" | "drift_detected" | "error";
  summary: string;
  changes: Array<{
    category: "module" | "view" | "acl" | "cron" | "report" | "settings";
    key: string;
    desired?: string;
    actual?: string;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}
