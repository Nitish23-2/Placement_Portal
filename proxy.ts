import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isStudentRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/drives") ||
    pathname.startsWith("/applications") ||
    pathname.startsWith("/notices");
  const isAdminRoute = pathname.startsWith("/admin");
  const isFacultyRoute = pathname.startsWith("/faculty");
  const isProtectedRoute = isStudentRoute || isAdminRoute || isFacultyRoute;

  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
    const role = profile?.role ?? "student";

    if (isAuthRoute) {
      const destination =
        role === "admin" ? "/admin/dashboard" : role === "faculty" ? "/faculty/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }

    if (isAdminRoute && role !== "admin") {
      const fallback = role === "faculty" ? "/faculty/dashboard" : "/dashboard";
      return NextResponse.redirect(new URL(fallback, request.url));
    }

    if (isFacultyRoute && role !== "faculty" && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/drives/:path*",
    "/applications/:path*",
    "/notices/:path*",
    "/admin/:path*",
    "/faculty/:path*",
    "/login",
    "/signup",
  ],
};
