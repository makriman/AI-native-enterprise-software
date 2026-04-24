import { z } from "zod";

const riskLevelSchema = z.enum(["low", "medium", "high", "critical"]);

const changeArraysSchema = z.object({
  settings: z.array(z.record(z.string(), z.unknown())).default([]),
  models: z.array(z.record(z.string(), z.unknown())).default([]),
  fields: z.array(z.record(z.string(), z.unknown())).default([]),
  views: z.array(z.record(z.string(), z.unknown())).default([]),
  menus: z.array(z.record(z.string(), z.unknown())).default([]),
  actions: z.array(z.record(z.string(), z.unknown())).default([]),
  security: z.array(z.record(z.string(), z.unknown())).default([]),
  automations: z.array(z.record(z.string(), z.unknown())).default([]),
  reports: z.array(z.record(z.string(), z.unknown())).default([]),
  portal: z.array(z.record(z.string(), z.unknown())).default([]),
  controllers: z.array(z.record(z.string(), z.unknown())).default([]),
  connectors: z.array(z.record(z.string(), z.unknown())).default([]),
  imports: z.array(z.record(z.string(), z.unknown())).default([]),
  migrations: z.array(z.record(z.string(), z.unknown())).default([])
});

export const customizationSpecSchema = z.object({
  kind: z.literal("odoo_customization"),
  version: z.literal("1.0"),
  workspace_id: z.string().min(1),
  instance_id: z.string().min(1),
  request: z.object({
    title: z.string().min(1),
    business_goal: z.string().min(1),
    source_prompt: z.string().min(1),
    attachments: z.array(z.string()).default([])
  }),
  scope: z.object({
    target_modules: z.array(z.string()).default([]),
    target_environments: z.array(z.enum(["dev", "sandbox", "staging", "production"]))
  }),
  changes: changeArraysSchema,
  risk: z.object({
    level: riskLevelSchema,
    reasons: z.array(z.string()).default([]),
    approval_required: z.boolean().default(true),
    elevated: z.boolean().default(false)
  }),
  tests: z.object({
    required: z.array(
      z.enum([
        "repo_lint",
        "spec_validation",
        "xml_validation",
        "manifest_validation",
        "install",
        "upgrade",
        "unit",
        "acl",
        "integration",
        "ui_smoke",
        "workflow",
        "controller",
        "import",
        "connector",
        "performance_smoke"
      ])
    )
  }),
  deliverables: z.object({
    generate_module: z.boolean().default(true),
    generate_docs: z.boolean().default(true),
    generate_uat: z.boolean().default(true),
    deploy_to_sandbox: z.boolean().default(true)
  })
});

export type CustomizationSpec = z.infer<typeof customizationSpecSchema>;

export function validateCustomizationSpec(input: unknown): {
  valid: boolean;
  errors: string[];
  spec?: CustomizationSpec;
} {
  const parsed = customizationSpecSchema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    };
  }

  return {
    valid: true,
    errors: [],
    spec: parsed.data
  };
}

export function assertCustomizationSpec(input: unknown): CustomizationSpec {
  return customizationSpecSchema.parse(input);
}
