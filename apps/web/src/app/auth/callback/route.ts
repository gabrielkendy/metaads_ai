import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { pickOne } from "@/lib/utils";
import { ADMIN_ROLES } from "@base-trafego/shared/constants";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect_to = searchParams.get("redirect_to") ?? "/admin";
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/auth/error?reason=oauth&message=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error?reason=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?reason=exchange_failed&message=${encodeURIComponent(error.message)}`,
    );
  }

  // Se redirect_to é genérico, decide pelo role
  if (redirect_to === "/admin" || redirect_to === "/") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile && !ADMIN_ROLES.includes(profile.role as never)) {
        const { data: cu } = await supabase
          .from("client_users")
          .select("client:clients(slug)")
          .eq("user_id", user.id)
          .limit(1)
          .single();
        const client = pickOne(cu?.client);
        if (client?.slug) {
          return NextResponse.redirect(`${origin}/cliente/${client.slug}`);
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${redirect_to}`);
}
