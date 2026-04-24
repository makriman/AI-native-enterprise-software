import { SectionPlaceholder } from "@/components/section-placeholder";

export default function DiffViewerPage() {
  return (
    <SectionPlaceholder
      title="Diff Viewer"
      subtitle="Inspect side-by-side code changes, high-risk file categories, and module-level impact before approvals."
      bullets={[
        "File-tree aware diff",
        "Python/XML/security/migration filters",
        "High-risk highlight integration with policy findings"
      ]}
      quickLink={{ href: "/build-history", label: "Open Build History" }}
    />
  );
}
