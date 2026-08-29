import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionConfirmedUser } from "@/lib/auth/provision";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const destination = next?.startsWith("/") ? next : "/dashboard";
  const supabase = await createClient();

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data } = await supabase.auth.getUser();
      if (data.user) await provisionConfirmedUser(data.user);
      return NextResponse.redirect(new URL(destination, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback", requestUrl.origin));
}