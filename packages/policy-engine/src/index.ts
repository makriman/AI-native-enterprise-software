import type { PolicyProfile } from "@oae/shared-types";

export interface PolicyInput {
  profile: PolicyProfile;
  files: Array<{
    path: string;
    content?: string;
    addedLines?: string[];
    removedLines?: string[];
  }>;
  metadata?: {
    elevatedApproval?: boolean;
  };
}

export interface PolicyFindingResult {
  severity: "low" | "medium" | "high" | "critical";
  ruleId: string;
  affectedFiles: string[];
  explanation: string;
  remediation: string;
  blocked: boolean;
}

const HIGH_RISK_SQL_PATTERNS = [/\bDROP\s+TABLE\b/i, /\bTRUNCATE\b/i, /\bDELETE\s+FROM\b/i];

export function evaluatePolicies(input: PolicyInput): PolicyFindingResult[] {
  const findings: PolicyFindingResult[] = [];

  for (const file of input.files) {
    const content = [file.content ?? "", ...(file.addedLines ?? [])].join("\n");
    const path = file.path;

    if (path.startsWith("upstream/") && !input.metadata?.elevatedApproval) {
      findings.push({
        severity: "critical",
        ruleId: "UPSTREAM_EDIT_REQUIRES_ELEVATION",
        affectedFiles: [path],
        explanation: "Detected a change inside upstream baseline source without elevated approval.",
        remediation: "Move the change to overlay add-ons or mark request as elevated_core_patch and re-review.",
        blocked: true
      });
    }

    if (/ir\.model\.access\.csv$/.test(path) && /,1,1,1,1/.test(content)) {
      findings.push({
        severity: "high",
        ruleId: "WILDCARD_ACL_GRANT",
        affectedFiles: [path],
        explanation: "ACL entry grants full CRUD and may overexpose records.",
        remediation: "Restrict permissions by role and add negative ACL tests.",
        blocked: input.profile === "strict"
      });
    }

    if (/\.py$/.test(path) && /SUPERUSER_ID/.test(content)) {
      findings.push({
        severity: "high",
        ruleId: "SUPERUSER_ID_USAGE",
        affectedFiles: [path],
        explanation: "SUPERUSER_ID usage detected; this can bypass record rules and ACL protections.",
        remediation: "Add explicit justification, scope-limiting logic, and security tests.",
        blocked: input.profile !== "permissive_dev"
      });
    }

    if (/\.py$/.test(path) && /requests\.(get|post|put|delete|patch)\(/.test(content)) {
      findings.push({
        severity: "medium",
        ruleId: "OUTBOUND_HTTP_REQUIRES_ALLOWLIST",
        affectedFiles: [path],
        explanation: "Outbound HTTP call detected in Odoo module code.",
        remediation: "Document network destination and register endpoint in egress allowlist policy.",
        blocked: input.profile === "strict"
      });
    }

    if (/\.py$/.test(path) && HIGH_RISK_SQL_PATTERNS.some((pattern) => pattern.test(content))) {
      findings.push({
        severity: "critical",
        ruleId: "DESTRUCTIVE_SQL",
        affectedFiles: [path],
        explanation: "Potentially destructive SQL operation detected.",
        remediation: "Provide explicit migration justification, rollback strategy, and elevated approval.",
        blocked: true
      });
    }

    if (/data\/.*cron.*\.xml$/.test(path) && !/README|docs|tests/.test(content)) {
      findings.push({
        severity: "medium",
        ruleId: "CRON_WITHOUT_COVERAGE",
        affectedFiles: [path],
        explanation: "Cron definition found; ensure documentation and tests cover schedule behavior.",
        remediation: "Add cron docs and workflow tests for scheduled actions.",
        blocked: false
      });
    }
  }

  return findings;
}

export function requiresEscalation(findings: PolicyFindingResult[]): boolean {
  return findings.some((finding) => finding.blocked || finding.severity === "critical");
}
