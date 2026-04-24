import { SectionPlaceholder } from "@/components/section-placeholder";

export default function DriftReportsPage() {
  return (
    <SectionPlaceholder
      title="Drift Reports"
      subtitle="Compare live Odoo state against approved desired-state artifacts and trigger reconciliation builds."
      bullets={[
        "Scheduled or on-demand drift scans",
        "Live vs desired diff classification",
        "Reconciliation build shortcuts"
      ]}
      quickLink={{ href: "/build-composer", label: "Create reconciliation build" }}
    />
  );
}
