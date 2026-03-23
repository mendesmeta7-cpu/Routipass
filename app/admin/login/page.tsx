"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { user } = await authService.signIn(email, password);
      if (!user) throw new Error("Accès refusé.");

      const { data: admin, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (adminError || !admin) {
        await authService.signOut();
        throw new Error("Privilèges administratifs requis.");
      }

      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Identifiants invalides.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F0F6FB] flex flex-col items-center justify-center px-4 py-12 relative font-sans overflow-hidden">
      
      {/* Logo Outside Card */}
      <div className="absolute top-6 left-6 md:top-10 md:left-12 flex flex-col items-center sm:items-start text-[#1E3A8A] select-none z-10 scale-90 md:scale-100 origin-top-left">
        <div className="relative flex justify-center w-full mb-1">
          {/* Custom Logo SVG mimicking the RoutiPass Bus Icon */}
          <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outline / Return Arrow */}
            <path d="M 80 40 C 80 20, 60 10, 40 10 C 20 10, 10 25, 10 40 L 10 65" stroke="#1E3A8A" strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M 80 40 C 80 65, 60 85, 40 85 L 30 85" stroke="#1E3A8A" strokeWidth="8" strokeLinecap="round" fill="none" />
            {/* Arrow Head */}
            <path d="M 45 65 L 25 85 L 45 105" stroke="#1E3A8A" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            
            {/* Bus Silhouette Inside */}
            <rect x="25" y="25" width="40" height="40" rx="8" fill="#1E3A8A" />
            {/* Windshield */}
            <rect x="32" y="32" width="26" height="12" rx="3" fill="#F0F6FB" />
            {/* Lights */}
            <circle cx="34" cy="55" r="3" fill="#F0F6FB" />
            <circle cx="56" cy="55" r="3" fill="#F0F6FB" />
            {/* Wheels */}
            <rect x="30" y="65" width="8" height="6" rx="2" fill="#1E3A8A" />
            <rect x="52" y="65" width="8" height="6" rx="2" fill="#1E3A8A" />
          </svg>
        </div>
        <h1 className="text-3xl font-black tracking-tighter leading-none mt-1">Routipass</h1>
        <div className="flex items-center justify-center bg-[#1E3A8A] text-white text-[10px] font-bold px-3 py-[3px] rounded-full mt-1.5 tracking-widest shadow-sm w-full">
          Kinshasa <span className="bg-white text-[#1E3A8A] px-1 rounded-sm ml-1">RDC</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-[1.5rem] shadow-[0_10px_40px_rgba(30,58,138,0.06)] w-full max-w-[420px] p-8 md:p-10 flex flex-col items-center relative z-20 animate-fade-in mt-28 md:mt-0 border border-slate-100/50">
        
        {/* Profile Icon */}
        <div className="w-20 h-20 bg-[#E2E8F0] rounded-[1rem] flex items-center justify-center mb-6">
          {/* User solid filled to match mock */}
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#0F172A" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" />
            <path d="M12.0002 14.5C7.00017 14.5 2.58017 17.5 2.05017 22C2.01017 22.33 2.27017 22.61 2.60017 22.61H21.4002C21.7302 22.61 21.9902 22.33 21.9502 22C21.4202 17.5 17.0002 14.5 12.0002 14.5Z" />
          </svg>
        </div>
        
        {/* Title */}
        <h2 className="text-[20px] font-bold text-[#0F172A] mb-8">Administration</h2>
        
        {/* Form */}
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="space-y-1">
            <div className="relative group">
              <Input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-[48px] bg-white border border-[#E2E8F0] text-[#1E293B] placeholder:text-[#94A3B8] text-[14px] rounded-[10px] focus:border-[#334155] focus:ring-[#334155] pl-11 shadow-sm transition-all focus-visible:ring-1"
                required
              />
              <Mail className="w-4 h-4 text-[#0F172A] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative group">
              <Input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[48px] bg-white border border-[#E2E8F0] text-[#1E293B] placeholder:text-[#94A3B8] text-[14px] rounded-[10px] focus:border-[#334155] focus:ring-[#334155] pl-11 shadow-sm transition-all focus-visible:ring-1"
                required
              />
              <Lock className="w-4 h-4 text-[#0F172A] absolute left-4 top-1/2 -translate-y-1/2 transition-colors" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-[10px] text-center animate-shake mt-2">
              <span className="text-sm font-medium text-red-600">{error}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-[48px] bg-[#334155] hover:bg-[#1E293B] text-white text-[15px] font-medium rounded-[10px] shadow-md transition-all mt-4"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>

        {/* Agents Illustration */}
        <div className="mt-12 flex items-center justify-center">
          <svg width="100" height="50" viewBox="0 0 100 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-95">
            {/* Left Agent (Police) */}
            <g transform="translate(10, 5)">
              <path d="M 15 15 C 10 5, 30 5, 25 15 Z" fill="#0F172A" />
              <path d="M 5 15 L 35 15" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
              <circle cx="20" cy="25" r="7" fill="#0F172A" />
              <path d="M 5 45 C 5 32, 35 32, 35 45 Z" fill="#0F172A" />
            </g>
            {/* Right Agent (Control) */}
            <g transform="translate(50, 5)">
              <path d="M 15 15 C 10 5, 30 5, 25 15 Z" fill="#0F172A" />
              <path d="M 5 15 L 35 15" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" />
              <circle cx="20" cy="10" r="2.5" fill="#F0F6FB" />
              <circle cx="20" cy="25" r="7" fill="#0F172A" />
              <path d="M 5 45 C 5 32, 35 32, 35 45 Z" fill="#0F172A" />
              <path d="M 18 34 L 22 34 L 20 40 Z" fill="#F0F6FB" />
            </g>
          </svg>
        </div>
      </div>

    </div>
  );
}
