import { SectionPlaceholder } from "@/components/section-placeholder";

export default function DataMigrationAssistantPage() {
  return (
    <SectionPlaceholder
      title="Data Migration Assistant"
      subtitle="Manage mapping definitions, dry-run validation, quarantine, and idempotent import execution."
      bullets={[
        "Mapping template management",
        "Dry-run diagnostics",
        "Error quarantine and rerun flow"
      ]}
      quickLink={{ href: "/module-catalog", label: "Open module catalog" }}
    />
  );
}
