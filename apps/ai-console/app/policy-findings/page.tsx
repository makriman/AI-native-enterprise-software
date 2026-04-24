import { SectionPlaceholder } from "@/components/section-placeholder";

export default function PolicyFindingsPage() {
  return (
    <SectionPlaceholder
      title="Policy Findings"
      subtitle="Review policy-engine outcomes with severity, rule IDs, file impact, and remediation guidance."
      bullets={[
        "Severity-ranked findings",
        "Blocking vs advisory classification",
        "Approval path and remediation tracking"
      ]}
      quickLink={{ href: "/build-history", label: "Open build list" }}
    />
  );
}
