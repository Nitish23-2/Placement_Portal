import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { provisionConfirmedUser } from "@/lib/auth/provision";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");
  const supabase = await createClient();

  if (code && supabase) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        const provisionResult = await provisionConfirmedUser(authData.user);
        if (!provisionResult.ok) {
          console.error("User provisioning failed:", provisionResult.reason);
          return NextResponse.redirect(
            new URL(`/login?error=provisioning_failed&reason=${encodeURIComponent(provisionResult.reason ?? "")}`, requestUrl.origin)
          );
        }

        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", authData.user.id)
          .maybeSingle();

        const role = profile?.role;
        const defaultDestination =
          role === "admin" ? "/admin/dashboard" : role === "faculty" ? "/faculty/dashboard" : "/dashboard";
        const destination = next?.startsWith("/") ? next : defaultDestination;

        return NextResponse.redirect(new URL(destination, requestUrl.origin));
      }
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback", requestUrl.origin));
}