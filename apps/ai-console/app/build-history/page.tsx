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

export default async function BuildHistoryPage() {
  let builds: BuildListResponse["data"] = [];
  let loadError: string | null = null;

  try {
    const response = await fetchJson<BuildListResponse>("/api/v1/builds");
    builds = response.data;
  } catch {
    loadError = "Build list is temporarily unavailable. Refresh in a few seconds.";
  }

  return (
    <section>
      <h1 className="page-headline">Build History</h1>
      <p className="page-subtitle">Review queued, running, approved, failed, and deployed build requests.</p>
      {loadError ? (
        <article className="panel" role="status" style={{ marginBottom: 16 }}>
          <h4>Control API Unavailable</h4>
          <p className="muted">{loadError}</p>
        </article>
      ) : null}
      <BuildsTable builds={builds} />
    </section>
  );
}
