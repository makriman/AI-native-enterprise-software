import { SectionPlaceholder } from "@/components/section-placeholder";

export default function SandboxPreviewPage() {
  return (
    <SectionPlaceholder
      title="Sandbox Preview Links"
      subtitle="Open disposable preview environments tied to validated build outputs."
      bullets={[
        "Per-build sandbox URLs",
        "Environment metadata and TTL",
        "Linked artifact and test context"
      ]}
      quickLink={{ href: "/build-history", label: "Browse build previews" }}
    />
  );
}
