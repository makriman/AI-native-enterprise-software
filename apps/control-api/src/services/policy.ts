import { evaluatePolicies } from "@oae/policy-engine";
import type { PolicyFinding } from "@oae/shared-types";
import { createId } from "../lib/id.js";

export function evaluateBuildPolicy(params: {
  buildRunId: string;
  profile: "strict" | "standard" | "permissive_dev";
  files: Array<{
    path: string;
    content?: string;
  }>;
  elevatedApproval?: boolean;
}): PolicyFinding[] {
  const results = evaluatePolicies({
    profile: params.profile,
    files: params.files,
    metadata: {
      elevatedApproval: params.elevatedApproval
    }
  });

  const now = new Date().toISOString();

  return results.map((result) => ({
    id: createId("pf"),
    buildRunId: params.buildRunId,
    ruleId: result.ruleId,
    severity: result.severity,
    summary: result.ruleId,
    explanation: `${result.explanation} Remediation: ${result.remediation}`,
    affectedFiles: result.affectedFiles,
    requiresApproval: result.blocked,
    createdAt: now
  }));
}
