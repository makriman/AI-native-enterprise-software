import { fetchJson } from "@/lib/api";
import { LogsStreamPanel } from "@/components/logs-stream-panel";

type BuildListResponse = {
  data: Array<{
    id: string;
    title: string;
    status: string;
  }>;
};

export default async function LogsPage() {
  let builds: BuildListResponse["data"] = [];
  let loadError: string | null = null;

  try {
    const response = await fetchJson<BuildListResponse>("/api/v1/builds");
    builds = response.data;
  } catch {
    loadError = "Unable to load build list. Refresh in a few seconds.";
  }

  return (
    <section>
      <h1 className="page-headline">Logs / Terminal Stream</h1>
      <p className="page-subtitle">
        Replay and tail lifecycle logs from planning, compilation, policy, tests, and deployment.
      </p>
      {loadError ? (
        <article className="panel" role="status" style={{ marginBottom: 16 }}>
          <h4>Control API Unavailable</h4>
          <p className="muted">{loadError}</p>
        </article>
      ) : null}
      <LogsStreamPanel builds={builds} />
    </section>
  );
}
