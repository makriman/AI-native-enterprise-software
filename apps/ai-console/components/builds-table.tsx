import Link from "next/link";

type BuildSummary = {
  id: string;
  title: string;
  status: string;
  executionMode: string;
  createdAt: string;
};

export function BuildsTable({ builds }: { builds: BuildSummary[] }) {
  return (
    <div className="panel">
      <h3>Build History</h3>
      <table className="grid">
        <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Status</th>
            <th>Mode</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {builds.map((build) => (
            <tr key={build.id}>
              <td>
                <Link className="inline-link" href={`/builds/${build.id}`}>
                  {build.id}
                </Link>
              </td>
              <td>{build.title}</td>
              <td>{build.status}</td>
              <td>{build.executionMode}</td>
              <td>{new Date(build.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {!builds.length ? (
            <tr>
              <td colSpan={5} className="muted">
                No builds yet. Start from Build Composer.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
