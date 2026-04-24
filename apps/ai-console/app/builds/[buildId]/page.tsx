import Link from "next/link";
import { fetchJson } from "@/lib/api";

type BuildDetail = {
  build_id: string;
  status: string;
  request: {
    id: string;
    title: string;
    prompt: string;
    executionMode: string;
    deploymentPath: string[];
    riskTolerance: string;
    createdAt: string;
  };
  plan_summary?: {
    summary: string;
    affectedModules: string[];
    changeClasses: string[];
    requiredTests: string[];
    riskLevel: string;
  };
  policy_findings: Array<{
    id: string;
    ruleId: string;
    severity: string;
    explanation: string;
    requiresApproval: boolean;
    affectedFiles: string[];
  }>;
  artifacts: Array<{
    id: string;
    kind: string;
    storagePath: string;
  }>;
  test_status: string;
  preview_links: Array<{ label: string; url: string }>;
};

export default async function BuildDetailPage({ params }: { params: Promise<{ buildId: string }> }) {
  const { buildId } = await params;
  const detail = await fetchJson<BuildDetail>(`/api/v1/builds/${buildId}`);

  return (
    <section>
      <h1 className="page-headline">Build Detail: {detail.build_id}</h1>
      <p className="page-subtitle">Inspect plan, policy findings, artifacts, tests, and preview links before approval.</p>

      <div className="panel-grid">
        <article className="panel">
          <h4>Status</h4>
          <p>{detail.status}</p>
          <p className="muted">Mode: {detail.request.executionMode}</p>
        </article>
        <article className="panel">
          <h4>Risk</h4>
          <p>{detail.request.riskTolerance}</p>
          <p className="muted">Tests: {detail.test_status}</p>
        </article>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Request</h3>
        <p>{detail.request.prompt}</p>
        <p className="muted">Deployment path: {detail.request.deploymentPath.join(" → ")}</p>
      </div>

      {detail.plan_summary ? (
        <div className="panel" style={{ marginTop: 16 }}>
          <h3>Plan Summary</h3>
          <p>{detail.plan_summary.summary}</p>
          <p className="muted">Modules: {detail.plan_summary.affectedModules.join(", ")}</p>
        </div>
      ) : null}

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Policy Findings</h3>
        <ul>
          {detail.policy_findings.map((finding) => (
            <li key={finding.id}>
              <strong>{finding.ruleId}</strong> ({finding.severity}) - {finding.explanation}
            </li>
          ))}
          {!detail.policy_findings.length ? <li>No findings.</li> : null}
        </ul>
        <p>
          <Link href="/policy-findings" className="inline-link">
            Open policy findings workspace view
          </Link>
        </p>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Artifacts</h3>
        <ul>
          {detail.artifacts.map((artifact) => (
            <li key={artifact.id}>
              {artifact.kind}: <code>{artifact.storagePath}</code>
            </li>
          ))}
          {!detail.artifacts.length ? <li>No artifacts yet.</li> : null}
        </ul>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Preview Links</h3>
        <ul>
          {detail.preview_links.map((preview) => (
            <li key={preview.url}>
              <a href={preview.url} className="inline-link" target="_blank" rel="noreferrer">
                {preview.label}
              </a>
            </li>
          ))}
          {!detail.preview_links.length ? <li>No preview yet.</li> : null}
        </ul>
      </div>
    </section>
  );
}
