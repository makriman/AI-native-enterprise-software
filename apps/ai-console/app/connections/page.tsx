import { fetchJson } from "@/lib/api";

type ConnectionListResponse = {
  data: Array<{
    id: string;
    type: string;
    name: string;
    status: string;
    updatedAt: string;
  }>;
};

export default async function ConnectionsPage() {
  let connections: ConnectionListResponse["data"] = [];

  try {
    const response = await fetchJson<ConnectionListResponse>("/api/v1/workspaces/ws_default/connections");
    connections = response.data;
  } catch {
    connections = [];
  }

  return (
    <section>
      <h1 className="page-headline">Connections and Auth Modes</h1>
      <p className="page-subtitle">
        Manage managed API credentials, edge-agent registration, and Odoo instance integrations.
      </p>
      <div className="panel">
        <h3>Registered Connections</h3>
        <table className="grid">
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {connections.map((connection) => (
              <tr key={connection.id}>
                <td>{connection.id}</td>
                <td>{connection.type}</td>
                <td>{connection.name}</td>
                <td>{connection.status}</td>
              </tr>
            ))}
            {!connections.length ? (
              <tr>
                <td colSpan={4} className="muted">
                  No connections configured yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
