import { DemoClientShell } from "@/components/demo/client-shell";
import { demoClients } from "@/lib/demo/mock-data";

export default function DemoClientLayout({ children }: { children: React.ReactNode }) {
  const client = demoClients.find((c) => c.slug === "just-burn") ?? demoClients[0];
  return (
    <DemoClientShell
      client={{
        name: client.name,
        slug: client.slug,
        brand_primary_color: client.brand_primary_color,
      }}
    >
      {children}
    </DemoClientShell>
  );
}
