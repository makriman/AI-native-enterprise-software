import { SectionPlaceholder } from "@/components/section-placeholder";

export default function ModuleCatalogPage() {
  return (
    <SectionPlaceholder
      title="Module Catalog"
      subtitle="Track upstream baseline modules, generated overlays, and custom add-on inventories."
      bullets={[
        "Installed module graph",
        "Generated/custom module index",
        "Dependency and ownership summaries"
      ]}
      quickLink={{ href: "/build-history", label: "Inspect generated modules" }}
    />
  );
}
