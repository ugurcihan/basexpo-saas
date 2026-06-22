import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

type CookieToSet = { name: string; value: string; options?: Partial<ResponseCookie> };

const ROLE_HOME: Record<string, string> = {
  organizer: "/organizer",
  exhibitor: "/exhibitor",
  visitor: "/visitor",
  admin: "/admin",
};

const PROTECTED_PREFIXES = ["/organizer", "/exhibitor", "/visitor", "/admin"];
const AUTH_PATHS = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some((p) => path.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => path.startsWith(p));

  // Not logged in → redirect to login
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Logged in on auth page → redirect to role dashboard
  if (user && isAuthPath) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "visitor";
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[role] ?? "/visitor";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Logged in but accessing wrong role's section
  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "visitor";
    const allowedPrefix = ROLE_HOME[role];

    if (allowedPrefix && !path.startsWith(allowedPrefix) && !path.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = allowedPrefix;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/healthz|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
