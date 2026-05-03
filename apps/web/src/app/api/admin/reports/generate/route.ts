import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const profile = await requireAdmin();
  const fd = await request.formData();
  const client_id = fd.get("client_id") as string;
  const type = (fd.get("type") as string) ?? "weekly";
  const format = (fd.get("format") as string) ?? "pdf";

  if (!client_id) {
    return NextResponse.redirect(new URL("/admin/reports?error=client_id", request.url));
  }

  const sb = createAdminClient();
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setDate(
    periodEnd.getDate() - (type === "monthly" ? 30 : type === "executive" ? 90 : 7),
  );

  const { data: client } = await sb.from("clients").select("name").eq("id", client_id).single();
  const { data: summary } = await sb.rpc("client_performance_summary", {
    p_client_id: client_id,
    p_start: periodStart.toISOString(),
    p_end: periodEnd.toISOString(),
  });

  const { data: report } = await sb
    .from("reports")
    .insert({
      client_id,
      title: `${type.toUpperCase()} — ${client?.name ?? "Cliente"}`,
      type,
      format,
      period_start: periodStart.toISOString().split("T")[0],
      period_end: periodEnd.toISOString().split("T")[0],
      data_snapshot: { summary: summary?.[0] ?? null } as never,
      generated_by: profile.id,
    })
    .select()
    .single();

  return NextResponse.redirect(
    new URL(`/admin/reports?generated=${report?.id ?? ""}`, request.url),
  );
}
