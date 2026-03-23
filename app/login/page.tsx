"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { authService } from "@/services/auth";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (identifiant.startsWith("RP-DR")) {
        await authService.signInDriver(identifiant, motDePasse);
        router.push("/dashboard-conducteur");
        return;
      } else if (identifiant.startsWith("RP-AG")) {
        await authService.signInAgent(identifiant, motDePasse);
        router.push("/dashboard-agent");
        return;
      }

      // Fallback
      await authService.signIn(identifiant, motDePasse);
      router.push("/dashboard-conducteur");
      
    } catch (err: any) {
      console.error("Erreur Connexion:", err);
      setError(err.message || "Erreur lors de la connexion. Vérifiez vos identifiants.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F0F9FF] relative overflow-hidden animate-fade-in font-sans">
      
      {/* Background Illustration (Unifying with Landing Page) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-40">
        <Image
          src="/images/transport_isometric.jpeg"
          alt="Illustration"
          fill
          className="object-contain object-right-bottom transform scale-110 translate-x-[20%] translate-y-[10%]"
        />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="flex flex-col items-center">
          <Link href="/" className="mb-8 flex items-center gap-2 group transition-all hover:scale-105">
            <h1 className="text-4xl font-black text-[#1E3A8A] tracking-tighter">
              Routipass
            </h1>
          </Link>
        </div>

        <Card className="glass-card border-white/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#1E3A8A]"></div>
          
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-[#1E3A8A]">Connexion</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Accédez à votre espace sécurisé
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-2">
            <form onSubmit={handleLogin} className="space-y-5">
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1" htmlFor="identifiant">
                  Identifiant Officiel
                </label>
                <Input
                  id="identifiant"
                  type="text"
                  placeholder="ex: RP-DR-000001"
                  value={identifiant}
                  onChange={(e) => setIdentifiant(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-white/60 border-white/50 h-12 rounded-xl focus:ring-[#1E3A8A] focus:border-[#1E3A8A] placeholder:text-slate-300 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1" htmlFor="password">
                  {identifiant.startsWith("RP-DR") ? "Code PIN" : "Mot de Passe"}
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder={identifiant.startsWith("RP-DR") ? "Ex: 1234" : "••••••••"}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  disabled={loading}
                  required
                  className="bg-white/60 border-white/50 h-12 rounded-xl focus:ring-[#1E3A8A] focus:border-[#1E3A8A] placeholder:text-slate-300 transition-all"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 animate-fade-in text-center shadow-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-12 text-sm font-black bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white rounded-xl shadow-xl shadow-blue-900/20 premium-button mt-4" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "SE CONNECTER"}
              </Button>

            </form>

            <div className="text-center space-y-4 pt-4">
              <div className="text-xs font-bold text-slate-400">
                PAS ENCORE ENREGISTRÉ ?
              </div>
              <Link href="/inscription" className="inline-block text-sm font-black text-[#1E3A8A] hover:text-[#1E3A8A]/80 transition-colors border-b-2 border-[#1E3A8A]/10 hover:border-[#1E3A8A] pb-1">
                CRÉER UN COMPTE CONDUCTEUR
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back link */}
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#1E3A8A] transition-colors">
            <ArrowLeft className="w-3 h-3" /> RETOUR À L'ACCUEIL
          </Link>
        </div>
      </div>
    </div>
  );
}
