"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { authService } from "@/services/auth";

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
    <div className="kinetic-bg min-h-screen w-full flex items-center justify-center p-6 relative font-body text-on-background bg-background overflow-hidden animate-fade-in">
      {/* Organic Background Shapes */}
      <div className="organic-shape bg-on-primary-container w-[300px] h-[300px] md:w-[500px] md:h-[500px] -top-20 -left-10 md:-top-40 md:-left-20 rounded-full animate-pulse opacity-30"></div>
      <div className="organic-shape bg-secondary w-[400px] h-[400px] md:w-[600px] md:h-[600px] -bottom-30 -right-10 md:-bottom-60 md:-right-20 rounded-full animate-float opacity-20"></div>
      <div className="organic-shape bg-primary-fixed w-[200px] h-[200px] md:w-[300px] md:h-[300px] top-1/2 right-0 md:right-10 rounded-full opacity-30"></div>
      
      {/* Sprinkled Icons */}
      <div className="floating-icon top-10 left-[15%] hidden md:block select-none pointer-events-none">
        <span className="material-symbols-outlined !text-6xl">local_taxi</span>
      </div>
      <div className="floating-icon bottom-20 left-[10%] hidden md:block select-none pointer-events-none">
        <span className="material-symbols-outlined !text-7xl">motorcycle</span>
      </div>
      <div className="floating-icon top-[20%] right-[15%] hidden md:block select-none pointer-events-none">
        <span className="material-symbols-outlined !text-5xl">person</span>
      </div>
      <div className="floating-icon bottom-[30%] right-[25%] hidden md:block select-none pointer-events-none">
        <span className="material-symbols-outlined !text-6xl">hail</span>
      </div>
      <div className="floating-icon top-[45%] left-[5%] hidden md:block select-none pointer-events-none">
        <span className="material-symbols-outlined !text-4xl">directions_car</span>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[480px] bg-surface-container-lowest rounded-lg shadow-[0_20px_50px_rgba(15,29,37,0.08)] p-8 md:p-12 border border-outline-variant/15 glass-card">
        {/* Header Section */}
        <div className="mb-8 md:mb-10 text-center">
          <div className="inline-flex items-center justify-center size-16 bg-on-primary-container rounded-full mb-6 shadow-lg shadow-on-primary-container/20">
            <svg className="size-8 text-on-primary-fixed" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path clipRule="evenodd" d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z" fill="currentColor" fillRule="evenodd"></path>
              <path clipRule="evenodd" d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z" fill="currentColor" fillRule="evenodd"></path>
            </svg>
          </div>
          <h1 className="font-headline text-2xl md:text-3xl font-extrabold text-on-background tracking-tight">Votre identifiant</h1>
          <p className="text-on-surface-variant font-medium mt-2">Accédez à votre espace sécurisé</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* ID Input */}
          <div className="space-y-2">
            <label className="text-on-background font-label font-bold text-sm px-1 ml-4" htmlFor="identifiant">
              ID Chauffeur / Agent
            </label>
            <div className="relative group">
              <input 
                id="identifiant"
                className="w-full bg-surface-container border-none focus:ring-2 focus:ring-secondary/20 rounded-full h-14 px-6 text-on-surface font-medium transition-all placeholder:text-outline/60 shadow-inner" 
                placeholder="ex: RP-DR-000001" 
                type="text"
                value={identifiant}
                onChange={(e) => setIdentifiant(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* PIN/Password Input */}
          <div className="space-y-2">
            <label className="text-on-background font-label font-bold text-sm px-1 ml-4" htmlFor="password">
              {identifiant.startsWith("RP-DR") ? "Code PIN" : "Mot de Passe"}
            </label>
            <div className="relative group">
              <input 
                id="password"
                className={`w-full bg-surface-container border-none focus:ring-2 focus:ring-secondary/20 rounded-full h-14 px-6 text-on-surface font-medium transition-all placeholder:text-outline/60 shadow-inner ${identifiant.startsWith("RP-DR") ? "tracking-[0.5em]" : ""}`} 
                placeholder={identifiant.startsWith("RP-DR") ? "••••" : "••••••••"} 
                type="password"
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 animate-fade-in text-center shadow-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button 
            className="w-full bg-on-primary-container hover:bg-primary-container hover:text-on-primary-container text-on-primary-fixed h-14 rounded-full font-headline font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-on-primary-container/20 group premium-button" 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin text-on-primary-fixed" />
            ) : (
              <>
                Se connecter
                <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Secondary Links */}
        <div className="mt-8 text-center space-y-6">
          <div className="text-on-surface-variant font-medium">
            Pas encore enregistré ? 
            <Link className="text-secondary font-bold hover:underline transition-all ml-1" href="/inscription">
              Crée un compte conducteur
            </Link>
          </div>
          <div className="pt-4 border-t border-outline-variant/20">
            <Link className="inline-flex items-center gap-2 text-on-surface-variant font-bold hover:text-on-surface transition-all group" href="/">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative Branding Layer */}
      <div className="fixed bottom-10 right-10 text-on-surface-variant/20 pointer-events-none select-none hidden md:block">
        <h2 className="font-headline font-black text-8xl tracking-tighter opacity-10 uppercase">
          {identifiant.startsWith("RP-AG") ? "AGENT" : "DRIVER"}
        </h2>
      </div>
    </div>
  );
}
