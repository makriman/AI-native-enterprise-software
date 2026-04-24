import { SectionPlaceholder } from "@/components/section-placeholder";

export default function AuditTrailPage() {
  return (
    <SectionPlaceholder
      title="Audit Trail"
      subtitle="Search and export immutable records for requests, plans, specs, approvals, deployments, and rollbacks."
      bullets={[
        "Actor and action timeline",
        "Artifact and policy linkage",
        "Export for compliance workflows"
      ]}
      quickLink={{ href: "/build-history", label: "Open build history" }}
    />
  );
}
