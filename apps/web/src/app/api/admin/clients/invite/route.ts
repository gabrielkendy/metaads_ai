import { NextResponse } from "next/server";
import { inviteClientUserAction } from "@/lib/actions/clients";

export async function POST(request: Request) {
  const fd = await request.formData();
  const result = await inviteClientUserAction(fd);
  if (!result?.ok) {
    const msg = result?.error ?? "Falha ao convidar";
    return NextResponse.redirect(
      new URL(`/admin/clients/${fd.get("client_id")}?invite_error=${encodeURIComponent(msg)}`, request.url),
    );
  }
  return NextResponse.redirect(
    new URL(`/admin/clients/${fd.get("client_id")}?invite_success=1`, request.url),
  );
}
