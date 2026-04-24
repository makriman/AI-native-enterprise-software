import { SectionPlaceholder } from "@/components/section-placeholder";

export default function LogsPage() {
  return (
    <SectionPlaceholder
      title="Logs / Terminal Stream"
      subtitle="Replay and tail lifecycle logs from planning, compilation, policy, tests, and deployment."
      bullets={[
        "Live stream via SSE or WebSocket",
        "Append-only event timeline per build",
        "Correlated execution identifiers"
      ]}
      quickLink={{ href: "/build-history", label: "Choose a build to stream" }}
    />
  );
}
