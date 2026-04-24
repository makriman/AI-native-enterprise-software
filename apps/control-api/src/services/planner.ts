import type { BuildPlan, RiskLevel } from "@oae/shared-types";
import type { CustomizationSpec } from "@oae/spec-schema";
import { createId } from "../lib/id.js";

interface BuildInput {
  buildId: string;
  workspaceId: string;
  instanceId: string;
  title: string;
  prompt: string;
  deploymentPath: Array<"dev" | "sandbox" | "staging" | "production">;
  riskTolerance: RiskLevel;
}

interface PlanAndSpec {
  plan: BuildPlan;
  spec: CustomizationSpec;
}

function inferModules(prompt: string): string[] {
  const lower = prompt.toLowerCase();
  const modules = new Set<string>(["base", "mail"]);

  if (lower.includes("crm") || lower.includes("lead") || lower.includes("pipeline")) {
    modules.add("crm");
  }
  if (lower.includes("sale") || lower.includes("quotation")) {
    modules.add("sale_management");
  }
  if (lower.includes("portal") || lower.includes("website")) {
    modules.add("portal");
    modules.add("website");
  }
  if (lower.includes("contact") || lower.includes("partner")) {
    modules.add("contacts");
  }
  if (lower.includes("inventory") || lower.includes("warehouse")) {
    modules.add("stock");
  }
  if (lower.includes("purchase") || lower.includes("procurement")) {
    modules.add("purchase");
  }
  if (lower.includes("project") || lower.includes("service")) {
    modules.add("project");
  }

  return Array.from(modules);
}

function inferChangeClasses(prompt: string): Array<"class_0" | "class_a" | "class_b" | "class_c"> {
  const lower = prompt.toLowerCase();
  const changeClasses: Array<"class_0" | "class_a" | "class_b" | "class_c"> = [];

  changeClasses.push("class_a");
  if (/(logic|controller|connector|python|api|oauth|migration|compute)/.test(lower)) {
    changeClasses.push("class_b");
  }
  if (/(settings|users|company|currency|warehouse|tax|email server)/.test(lower)) {
    changeClasses.push("class_0");
  }
  if (/(patch core|monkey patch|superuser|destructive|drop|truncate|production emergency)/.test(lower)) {
    changeClasses.push("class_c");
  }

  return Array.from(new Set(changeClasses));
}

export function createPlanAndSpec(input: BuildInput): PlanAndSpec {
  const now = new Date().toISOString();
  const modules = inferModules(input.prompt);
  const changeClasses = inferChangeClasses(input.prompt);
  const elevated = changeClasses.includes("class_c");

  const plan: BuildPlan = {
    id: createId("plan"),
    buildRequestId: input.buildId,
    summary: `Implement request \"${input.title}\" across ${modules.join(", ")} with governed pipeline artifacts and tests.`,
    affectedModules: modules,
    changeClasses,
    requiredTests: ["install", "upgrade", "acl", "workflow", "integration"],
    riskLevel: elevated ? "high" : input.riskTolerance,
    createdAt: now
  };

  const spec: CustomizationSpec = {
    kind: "odoo_customization",
    version: "1.0",
    workspace_id: input.workspaceId,
    instance_id: input.instanceId,
    request: {
      title: input.title,
      business_goal: input.prompt,
      source_prompt: input.prompt,
      attachments: []
    },
    scope: {
      target_modules: modules,
      target_environments: input.deploymentPath
    },
    changes: {
      settings: [],
      models: [],
      fields: [],
      views: [],
      menus: [],
      actions: [],
      security: [],
      automations: [],
      reports: [],
      portal: [],
      controllers: [],
      connectors: [],
      imports: [],
      migrations: []
    },
    risk: {
      level: elevated ? "high" : input.riskTolerance,
      reasons: elevated ? ["Class C indicators detected from request text."] : [],
      approval_required: true,
      elevated
    },
    tests: {
      required: ["install", "upgrade", "unit", "acl", "integration", "ui_smoke"]
    },
    deliverables: {
      generate_module: true,
      generate_docs: true,
      generate_uat: true,
      deploy_to_sandbox: true
    }
  };

  return { plan, spec };
}
