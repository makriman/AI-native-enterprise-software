import { SectionPlaceholder } from "@/components/section-placeholder";

export default function SettingsRbacPage() {
  return (
    <SectionPlaceholder
      title="Settings / RBAC"
      subtitle="Configure auth modes, role definitions, permissions, usage controls, and retention defaults."
      bullets={[
        "Role and permission matrix",
        "Policy profile selection",
        "Budget and retention controls"
      ]}
      quickLink={{ href: "/connections", label: "Manage auth connections" }}
    />
  );
}
