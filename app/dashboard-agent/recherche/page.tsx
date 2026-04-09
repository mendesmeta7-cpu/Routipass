"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Car, Search, User } from "lucide-react";

export default function RechercheHubPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#E6F0FC] flex flex-col font-sans pb-10 animate-fade-in relative overflow-hidden">
      {/* Decors de fond */}
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-gradient-to-br from-blue-50/40 via-transparent to-blue-100/30 blur-[100px] pointer-events-none rounded-full" />
      
      {/* En-tête */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/50 p-6 flex items-center gap-4 sticky top-0 z-50">
        <button onClick={() => router.push("/dashboard-agent")} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-black text-[#1e3b6a] uppercase tracking-tight">Recherche Globale</h1>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-10 flex flex-col gap-6 z-10 relative">
        <div className="mb-6">
           <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Que recherchez-vous ?</h2>
           <p className="text-sm font-medium text-slate-500 mt-2">Sélectionnez le type d'entité pour consulter son profil complet.</p>
        </div>

        {/* Bouton Véhicule */}
        <button 
          onClick={() => router.push("/dashboard-agent/recherche/vehicule")}
          className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center gap-5 transition-all hover:-translate-y-1 active:scale-95 group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left border border-white"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform group-hover:bg-blue-600 group-hover:text-white text-blue-600 shadow-inner">
             <Car className="w-10 h-10" strokeWidth={1.5} />
          </div>
          <div className="z-10">
             <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Véhicule</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plaque d'immatriculation</p>
          </div>
        </button>

        {/* Bouton Conducteur */}
        <button 
          onClick={() => router.push("/dashboard-agent/recherche/conducteur")}
          className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 flex items-center gap-5 transition-all hover:-translate-y-1 active:scale-95 group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-left border border-white"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform group-hover:bg-emerald-600 group-hover:text-white text-emerald-600 shadow-inner">
             <User className="w-10 h-10" strokeWidth={1.5} />
          </div>
          <div className="z-10">
             <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Conducteur</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">ID, Nom ou Prénom</p>
          </div>
        </button>
      </main>
    </div>
  );
}
