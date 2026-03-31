"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Home, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AmendeSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fbff] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-500">
      
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/10">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <h1 className="text-3xl font-black text-[#1e3b6a] mb-2 tracking-tight">Amende Transmise</h1>
      <p className="text-slate-500 font-bold text-sm max-w-xs mb-10">
        L'infraction a été enregistrée avec succès dans le système central de la PNC. 
        Le contrevenant recevra une notification prochainement.
      </p>

      <div className="w-full max-w-sm space-y-4">
        <Button 
          onClick={() => router.push("/dashboard-agent")}
          className="w-full h-16 bg-[#1e3b6a] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-[#152a4f] gap-3 transition-all"
        >
          <Home className="w-5 h-5" />
          Retour au Dashboard
        </Button>
        
        <Button 
          variant="ghost"
          onClick={() => router.push("/scan")}
          className="w-full h-14 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#1e3b6a] hover:bg-white gap-2 transition-all"
        >
          Lancer un nouveau Scan
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-20 flex items-center gap-2 opacity-20">
         <ShieldCheck className="w-4 h-4 text-[#1e3b6a]" />
         <span className="text-[10px] font-black uppercase tracking-widest text-[#1e3b6a]">Système Sécurisé PNC</span>
      </div>

    </div>
  );
}
