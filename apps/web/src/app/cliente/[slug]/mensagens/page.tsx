import type { Metadata } from "next";
import { GlassCard } from "@/components/glass/glass-card";
import { ChatPanel } from "@/components/cliente/chat-panel";
import { createClient } from "@/lib/supabase/server";
import { requireClientAccess } from "@/lib/auth/helpers";

export const metadata: Metadata = { title: "Mensagens" };
export const dynamic = "force-dynamic";

export default async function MensagensPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await requireClientAccess(slug);
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, content, sender_id, sender_role, created_at, sender:profiles(full_name, avatar_url)")
    .eq("client_id", ctx.client.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-label mb-1">Comunicação</p>
        <h1 className="text-h1">Mensagens</h1>
        <p className="text-body text-text-secondary mt-1">
          Chat direto com a equipe da Agência BASE.
        </p>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <ChatPanel
          clientId={ctx.client.id}
          currentUserId={ctx.user.id}
          initialMessages={(messages ?? []) as never}
        />
      </GlassCard>
    </div>
  );
}
