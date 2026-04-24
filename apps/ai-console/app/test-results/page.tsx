import { SectionPlaceholder } from "@/components/section-placeholder";

export default function TestResultsPage() {
  return (
    <SectionPlaceholder
      title="Test Results"
      subtitle="Track install, upgrade, ACL, unit, integration, controller, and smoke test outcomes per build."
      bullets={[
        "Matrix status by test stage",
        "Machine-readable report links",
        "Gate status for promotion eligibility"
      ]}
      quickLink={{ href: "/build-history", label: "Open latest build" }}
    />
  );
}
