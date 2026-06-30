import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { email, password, full_name } = await req.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: "Tüm alanlar zorunlu." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Şifre en az 6 karakter olmalı." }, { status: 400 });
    }

    // Create user with email pre-confirmed (no email confirmation required)
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { full_name, role: "visitor" },
    });

    if (createErr) {
      // If user already exists, try to sign in with provided credentials
      if (createErr.message?.includes("already been registered") || createErr.code === "email_exists") {
        const { data: signed, error: signErr } = await adminClient.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (signErr) {
          return NextResponse.json({ error: "Bu e-posta zaten kayıtlı. Giriş yapmayı deneyin." }, { status: 409 });
        }
        return NextResponse.json({
          access_token: signed.session!.access_token,
          refresh_token: signed.session!.refresh_token,
        });
      }
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    // Sign in to get tokens
    const { data: signed, error: signErr } = await adminClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (signErr || !signed.session) {
      return NextResponse.json({ error: "Hesap oluşturuldu ancak giriş yapılamadı. Lütfen giriş ekranından deneyin." }, { status: 500 });
    }

    return NextResponse.json({
      access_token: signed.session.access_token,
      refresh_token: signed.session.refresh_token,
    });
  } catch {
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
