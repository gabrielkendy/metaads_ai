import { ClientTopbar } from "@/components/cliente/topbar";
import { requireClientAccess } from "@/lib/auth/helpers";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireClientAccess(slug);

  return (
    <div
      className="min-h-[100dvh]"
      style={
        {
          "--client-primary": ctx.client.brand_primary_color,
          "--client-secondary": ctx.client.brand_secondary_color,
        } as React.CSSProperties
      }
    >
      <ClientTopbar
        client={{
          name: ctx.client.name,
          slug: ctx.client.slug,
          logo_url: ctx.client.logo_url,
          brand_primary_color: ctx.client.brand_primary_color,
        }}
        user={{
          full_name: ctx.profile?.full_name ?? null,
          email: ctx.user.email ?? "",
          avatar_url: ctx.profile?.avatar_url ?? null,
        }}
      />
      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-[1280px] w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
