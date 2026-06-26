"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MapPin, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Visitor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  interests: string[];
  bio: string | null;
  city: string | null;
}

interface Props {
  visitor: Visitor;
  viewerRole: string | null;
  viewerId: string | null;
}

export function VisitorProfileClient({ visitor, viewerRole, viewerId }: Props) {
  const isOwnProfile = viewerId === visitor.id;

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        {/* Geri butonu */}
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Ana Sayfa
        </Link>

        {/* Profil kartı */}
        <motion.div
          initial={{ y: 16 }}
          animate={{ y: 0 }}
          className="glass rounded-2xl border border-white/8 p-8 flex flex-col items-center text-center"
        >
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-brand-indigo/20 border-2 border-brand-indigo/30 flex items-center justify-center mb-4 overflow-hidden">
            {visitor.avatar_url ? (
              <img src={visitor.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-brand-indigo-light" />
            )}
          </div>

          {/* İsim */}
          <h1 className="font-display text-xl font-bold text-white mb-0.5">
            {visitor.full_name || "Ziyaretçi"}
          </h1>

          {/* Şehir */}
          {visitor.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mb-3">
              <MapPin className="w-3 h-3" /> {visitor.city}
            </p>
          )}

          {/* Bio */}
          {visitor.bio && (
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              {visitor.bio}
            </p>
          )}

          {/* İlgi alanları */}
          {visitor.interests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-6">
              {visitor.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-2.5 py-0.5 rounded-full text-xs bg-brand-violet/15 border border-brand-violet/20 text-brand-violet-light"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}

          {/* Aksiyon */}
          {isOwnProfile ? (
            <Button variant="outline" asChild className="w-full">
              <Link href="/visitor/badge">Badge&apos;ime Dön</Link>
            </Button>
          ) : viewerRole === "visitor" && viewerId ? (
            <Button variant="gradient" asChild className="w-full">
              <Link href="/visitor/connections">Bağlantı Kur</Link>
            </Button>
          ) : !viewerRole ? (
            <Button variant="gradient" asChild className="w-full">
              <Link href="/login">Giriş Yap</Link>
            </Button>
          ) : null}
        </motion.div>

        {/* BasExpo branding */}
        <p className="text-center text-xs text-muted-foreground/50">
          BasExpo üzerinden paylaşıldı
        </p>
      </div>
    </div>
  );
}
