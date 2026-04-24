import { SectionPlaceholder } from "@/components/section-placeholder";

export default function EnvironmentHealthPage() {
  return (
    <SectionPlaceholder
      title="Environment Health"
      subtitle="Monitor service status, runner pools, Odoo instance connectivity, and deployment readiness signals."
      bullets={[
        "Service heartbeat state",
        "Runner utilization view",
        "Deployment freeze and kill-switch visibility"
      ]}
      quickLink={{ href: "/connections", label: "Open connections" }}
    />
  );
}
