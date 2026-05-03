import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { requireAdmin } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();
  const supabase = await createClient();

  const [{ count: pendingApprovals }, { count: unread }] = await Promise.all([
    supabase
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("read", false),
  ]);

  return (
    <div className="flex min-h-[100dvh]">
      <AdminSidebar pendingApprovals={pendingApprovals ?? 0} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopbar
          unreadNotifications={unread ?? 0}
          user={{
            full_name: profile.full_name,
            email: profile.email,
            avatar_url: profile.avatar_url,
          }}
        />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
