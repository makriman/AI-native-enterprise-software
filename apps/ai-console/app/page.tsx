import { BuildsTable } from "@/components/builds-table";
import { fetchJson } from "@/lib/api";

type BuildListResponse = {
  data: Array<{
    id: string;
    title: string;
    status: string;
    executionMode: string;
    createdAt: string;
  }>;
};

export default async function DashboardPage() {
  let builds: BuildListResponse["data"] = [];

  try {
    const response = await fetchJson<BuildListResponse>("/api/v1/builds");
    builds = response.data;
  } catch {
    builds = [];
  }

  const statusCounts = builds.reduce<Record<string, number>>((acc, build) => {
    acc[build.status] = (acc[build.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <section>
      <h1 className="page-headline">Dashboard</h1>
      <p className="page-subtitle">
        Governed implementation pipeline with deterministic spec compilation, policy gates, and staged deployment controls.
      </p>

      <div className="panel-grid">
        <article className="panel">
          <h4>Total Builds</h4>
          <p>{builds.length}</p>
        </article>
        <article className="panel">
          <h4>Awaiting Approval</h4>
          <p>{statusCounts.awaiting_approval || 0}</p>
        </article>
        <article className="panel">
          <h4>Approved</h4>
          <p>{statusCounts.approved || 0}</p>
        </article>
        <article className="panel">
          <h4>Failed</h4>
          <p>{statusCounts.failed || 0}</p>
        </article>
      </div>

      <div style={{ marginTop: 16 }}>
        <BuildsTable builds={builds} />
      </div>
    </section>
  );
}
