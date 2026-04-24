import path from "node:path";

export interface ControlApiConfig {
  port: number;
  host: string;
  repoRoot: string;
  artifactRoot: string;
  policyProfileDefault: "strict" | "standard" | "permissive_dev";
}

export function loadConfig(): ControlApiConfig {
  const repoRoot = process.env.REPO_ROOT || path.resolve(process.cwd(), "../..");
  const artifactRoot = process.env.ARTIFACT_ROOT || path.join(repoRoot, "artifacts");

  return {
    port: Number(process.env.PORT || 4000),
    host: process.env.HOST || "0.0.0.0",
    repoRoot,
    artifactRoot,
    policyProfileDefault: (process.env.POLICY_PROFILE_DEFAULT as ControlApiConfig["policyProfileDefault"]) || "standard"
  };
}
