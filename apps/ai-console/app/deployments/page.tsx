import { SectionPlaceholder } from "@/components/section-placeholder";

export default function DeploymentsPage() {
  return (
    <SectionPlaceholder
      title="Deployments"
      subtitle="Promote approved artifacts through sandbox, staging, and production with immutable deployment records."
      bullets={[
        "Promotion history by environment",
        "Backup and snapshot references",
        "Post-deploy smoke-check status"
      ]}
      quickLink={{ href: "/rollback-center", label: "Open Rollback Center" }}
    />
  );
}
