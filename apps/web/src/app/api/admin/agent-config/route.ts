import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/helpers";

export async function POST(request: Request) {
  await requireAdmin();
  const fd = await request.formData();
  const client_id = fd.get("client_id") as string;
  if (!client_id) return NextResponse.json({ error: "client_id ausente" }, { status: 400 });

  const updates = {
    system_prompt: (fd.get("system_prompt") as string) || null,
    tone_of_voice: (fd.get("tone_of_voice") as string) || "profissional",
    brand_guidelines: (fd.get("brand_guidelines") as string) || null,
    max_daily_actions: Number(fd.get("max_daily_actions") ?? 50),
    auto_pause_underperforming: fd.get("auto_pause_underperforming") === "on",
    auto_optimize_budget: fd.get("auto_optimize_budget") === "on",
    auto_create_variations: fd.get("auto_create_variations") === "on",
  };

  const sb = createAdminClient();
  await sb.from("agent_configs").update(updates).eq("client_id", client_id);

  return NextResponse.redirect(
    new URL(`/admin/agent-config?client=${client_id}&saved=1`, request.url),
  );
}
