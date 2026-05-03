import { DemoAdminShell } from "@/components/demo/admin-shell";

export default function DemoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DemoAdminShell>{children}</DemoAdminShell>;
}
