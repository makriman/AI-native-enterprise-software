import type { EnvironmentKind } from "@oae/shared-types";

export interface DeploymentRequestInput {
  buildId: string;
  approvedSnapshotId: string;
  targetEnvironment: EnvironmentKind;
  strategy: "rolling" | "blue_green" | "recreate";
  requireBackup: boolean;
}

export interface DeploymentGateResult {
  allowed: boolean;
  reasons: string[];
}

export interface RollbackPlan {
  deploymentId: string;
  codeRollbackRef: string;
  databaseSnapshotRef: string;
  filestoreSnapshotRef: string;
  compensatingMigration?: string;
}

const ENV_ORDER: EnvironmentKind[] = ["dev", "sandbox", "staging", "production"];

export function validatePromotionPath(
  path: EnvironmentKind[],
  targetEnvironment: EnvironmentKind
): DeploymentGateResult {
  if (!path.includes(targetEnvironment)) {
    return {
      allowed: false,
      reasons: [`Target environment ${targetEnvironment} is not present in deployment path.`]
    };
  }

  const invalidHop = path.some((env, idx) => idx > 0 && ENV_ORDER.indexOf(env) < ENV_ORDER.indexOf(path[idx - 1]!));
  if (invalidHop) {
    return {
      allowed: false,
      reasons: ["Deployment path is not monotonic by environment criticality."]
    };
  }

  return {
    allowed: true,
    reasons: []
  };
}

export function buildRollbackPlan(
  deploymentId: string,
  refs: {
    codeRollbackRef: string;
    databaseSnapshotRef: string;
    filestoreSnapshotRef: string;
    compensatingMigration?: string;
  }
): RollbackPlan {
  return {
    deploymentId,
    codeRollbackRef: refs.codeRollbackRef,
    databaseSnapshotRef: refs.databaseSnapshotRef,
    filestoreSnapshotRef: refs.filestoreSnapshotRef,
    compensatingMigration: refs.compensatingMigration
  };
}
