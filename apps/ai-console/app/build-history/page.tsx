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
  const response = await fetchJson<BuildListResponse>("/api/v1/builds");

  return (
    <section>
      <h1 className="page-headline">Build History</h1>
      <p className="page-subtitle">Review queued, running, approved, failed, and deployed build requests.</p>
      <BuildsTable builds={response.data} />
    </section>
  );
}
