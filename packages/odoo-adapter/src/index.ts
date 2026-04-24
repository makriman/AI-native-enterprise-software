export interface OdooModuleSnapshot {
  name: string;
  state: "installed" | "uninstalled" | "to_upgrade";
  latestVersion?: string;
  category?: string;
}

export interface OdooFieldSnapshot {
  model: string;
  name: string;
  ttype: string;
  relation?: string;
  required: boolean;
  readonly: boolean;
}

export interface OdooViewSnapshot {
  xmlId: string;
  model: string;
  type: string;
  archHash: string;
}

export interface OdooAclSnapshot {
  model: string;
  groupXmlId?: string;
  read: boolean;
  write: boolean;
  create: boolean;
  unlink: boolean;
}

export interface OdooRuleSnapshot {
  name: string;
  model: string;
  domainForce: string;
  groups: string[];
}

export interface OdooCronSnapshot {
  xmlId: string;
  model: string;
  method: string;
  intervalNumber: number;
  intervalType: string;
  active: boolean;
}

export interface OdooReportSnapshot {
  xmlId: string;
  model: string;
  reportType: string;
  reportName: string;
}

export interface OdooSnapshotBundle {
  generatedAt: string;
  odooVersion: string;
  revision?: string;
  modules: OdooModuleSnapshot[];
  fields: OdooFieldSnapshot[];
  views: OdooViewSnapshot[];
  acls: OdooAclSnapshot[];
  rules: OdooRuleSnapshot[];
  crons: OdooCronSnapshot[];
  reports: OdooReportSnapshot[];
  settingsManifest: Record<string, unknown>;
}

export interface OdooAdapterClientOptions {
  baseUrl: string;
  token: string;
}

export class OdooAdapterClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(options: OdooAdapterClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
  }

  async fetchSnapshot(): Promise<OdooSnapshotBundle> {
    const response = await fetch(`${this.baseUrl}/api/oae/snapshot`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Snapshot request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as OdooSnapshotBundle;
  }
}

export interface DriftDiff {
  category: "module" | "view" | "acl" | "cron" | "report" | "settings";
  key: string;
  desired?: string;
  actual?: string;
}

export function detectDrift(desired: OdooSnapshotBundle, actual: OdooSnapshotBundle): DriftDiff[] {
  const drift: DriftDiff[] = [];

  const desiredModules = new Map(desired.modules.map((m) => [m.name, m.state]));
  const actualModules = new Map(actual.modules.map((m) => [m.name, m.state]));

  for (const [name, expected] of desiredModules.entries()) {
    const current = actualModules.get(name);
    if (current !== expected) {
      drift.push({ category: "module", key: name, desired: expected, actual: current });
    }
  }

  const desiredViews = new Map(desired.views.map((v) => [v.xmlId, v.archHash]));
  for (const view of actual.views) {
    const expectedHash = desiredViews.get(view.xmlId);
    if (expectedHash && expectedHash !== view.archHash) {
      drift.push({ category: "view", key: view.xmlId, desired: expectedHash, actual: view.archHash });
    }
  }

  return drift;
}
