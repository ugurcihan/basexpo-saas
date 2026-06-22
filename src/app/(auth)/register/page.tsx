"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import {
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  Settings2,
  Building2,
  UserCircle2,
  Check,
} from "lucide-react";
import type { UserRole } from "@/types";

const ROLES: {
  id: UserRole;
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  border: string;
  activeBorder: string;
  activeBg: string;
  iconColor: string;
}[] = [
  {
    id: "organizer",
    icon: Settings2,
    label: "Organizatör",
    description: "Fuar kur, salon & stand yönet",
    color: "from-brand-indigo/20",
    border: "border-white/10",
    activeBorder: "border-brand-indigo/60",
    activeBg: "bg-brand-indigo/10",
    iconColor: "text-brand-indigo-light",
  },
  {
    id: "exhibitor",
    icon: Building2,
    label: "Katılımcı Firma",
    description: "Stand aç, lead topla, ROI gör",
    color: "from-brand-cyan/20",
    border: "border-white/10",
    activeBorder: "border-brand-cyan/60",
    activeBg: "bg-brand-cyan/10",
    iconColor: "text-brand-cyan",
  },
  {
    id: "visitor",
    icon: UserCircle2,
    label: "Ziyaretçi",
    description: "Keşfet, eşleş, networking yap",
    color: "from-brand-violet/20",
    border: "border-white/10",
    activeBorder: "border-brand-violet/60",
    activeBg: "bg-brand-violet/10",
    iconColor: "text-brand-violet-light",
  },
];

const ROLE_HOME: Record<string, string> = {
  organizer: "/organizer",
  exhibitor: "/exhibitor",
  visitor: "/visitor",
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get("role") as UserRole) ?? "visitor";

  const [step, setStep] = useState<"role" | "details">("role");
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole,
          },
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered")) {
          setError("Bu e-posta zaten kayıtlı. Giriş yapmayı dene.");
        } else {
          setError(signUpError.message);
        }
        return;
      }

      if (data.user) {
        await supabase
          .from("profiles")
          .update({ full_name: fullName, role: selectedRole })
          .eq("id", data.user.id);

        // Exhibitor kaydında otomatik boş exhibitor kaydı oluştur
        if (selectedRole === "exhibitor") {
          const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
          await supabase.from("exhibitors").insert({
            owner_id: data.user.id,
            company_name: fullName,
            qr_token: token,
          });
          router.push("/exhibitor/profile");
        } else {
          router.push(ROLE_HOME[selectedRole] ?? "/visitor");
        }
        router.refresh();
      }
    } catch {
      setError("Beklenmeyen bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg"
    >
      <div className="glass-strong rounded-2xl border border-white/10 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Hesap Oluştur
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === "role"
              ? "Rolünü seç — her rol farklı araçlar açar"
              : "Hesap bilgilerini gir"}
          </p>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {["role", "details"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    step === s
                      ? "bg-brand-indigo text-white"
                      : s === "role" && step === "details"
                      ? "bg-brand-indigo/30 text-brand-indigo-light"
                      : "bg-white/10 text-muted-foreground"
                  }`}
                >
                  {s === "role" && step === "details" ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i === 0 && (
                  <div className="w-8 h-px bg-white/15" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Role selection */}
          {step === "role" && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {ROLES.map((role) => {
                const Icon = role.icon;
                const isActive = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 text-left ${
                      isActive
                        ? `${role.activeBorder} ${role.activeBg}`
                        : `${role.border} hover:border-white/20 hover:bg-white/3`
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive ? role.activeBg : "bg-white/5"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? role.iconColor : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm ${
                          isActive ? "text-white" : "text-foreground"
                        }`}
                      >
                        {role.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {role.description}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        isActive
                          ? "border-brand-indigo bg-brand-indigo"
                          : "border-white/20"
                      }`}
                    >
                      {isActive && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                  </button>
                );
              })}

              <Button
                onClick={() => setStep("details")}
                variant="gradient"
                size="lg"
                className="w-full mt-2"
              >
                Devam Et
              </Button>
            </motion.div>
          )}

          {/* STEP 2: Account details */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Selected role badge */}
              <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-white/5 border border-white/10">
                {(() => {
                  const role = ROLES.find((r) => r.id === selectedRole)!;
                  const Icon = role.icon;
                  return (
                    <>
                      <Icon className={`w-4 h-4 ${role.iconColor}`} />
                      <span className="text-sm text-foreground">
                        {role.label} olarak kaydoluyorsun
                      </span>
                    </>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => setStep("role")}
                  className="ml-auto text-xs text-brand-indigo-light hover:text-white transition-colors"
                >
                  Değiştir
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Ad Soyad</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Ahmet Yılmaz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ornek@sirket.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="En az 8 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      Hesap oluşturuluyor...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Kayıt Ol
                    </span>
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Zaten hesabın var mı?{" "}
          <Link
            href="/login"
            className="text-brand-indigo-light hover:text-white transition-colors font-medium"
          >
            Giriş Yap
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
