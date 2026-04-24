import { SectionPlaceholder } from "@/components/section-placeholder";

export default function RollbackCenterPage() {
  return (
    <SectionPlaceholder
      title="Rollback Center"
      subtitle="Execute governed rollback actions with code/database/filestore strategy visibility."
      bullets={[
        "Rollback plan preview",
        "Snapshot reference lookup",
        "Audited rollback action trail"
      ]}
      quickLink={{ href: "/deployments", label: "Open deployments" }}
    />
  );
}
