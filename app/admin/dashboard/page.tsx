"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Users, Car, ShieldAlert, FileText, Activity, PlusCircle, Loader2, Zap, LayoutDashboard, ShieldCheck, ChevronRight, Clock, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";
import { authService } from "@/services/auth";
import { adminService } from "@/services/admin";
import { AddPermitModal } from "./AddPermitModal";
import { AddVehicleModal } from "./AddVehicleModal";
import { AddAgentModal } from "./AddAgentModal";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    conducteurs: 0,
    vehicules: 0,
    agents: 0,
    amendes: 0
  });

  const [isPermitModalOpen, setIsPermitModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('stats_admin')
        .select('*')
        .single();

      if (data) {
        setStats({
          conducteurs: data.total_conducteurs || 0,
          vehicules: data.total_vehicules || 0,
          agents: data.total_agents || 0,
          amendes: data.total_amendes || 0
        });
      }
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        router.push("/admin/login");
        return;
      }
      setLoading(false);
      fetchStats();
    };

    checkUser();
  }, [router]);

  const logout = async () => {
    await authService.signOut();
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce">
          <Activity className="w-8 h-8 text-[#1E3A8A]" />
        </div>
        <p className="text-xs font-black text-[#1E3A8A] tracking-[0.3em] animate-pulse uppercase">Système Central en chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans animate-fade-in pb-12">
      {/* Header Central Command */}
      <header className="sticky top-0 z-50 glass-card bg-[#0F172A]/95 border-none rounded-none shadow-xl h-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          <div className="flex items-center gap-3 group translate-y-[-2px]">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-white tracking-tighter">
              RoutiPass <span className="text-blue-400">HQ</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:inline-block">Accès Super-Administrateur</span>
            <Button 
              variant="ghost" 
              className="h-10 px-4 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-400/5 font-bold transition-all"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-10">
        
        {/* En-tête de bienvenue */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Opérations en Temps Réel</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Tableau de Supervision</h2>
          </div>
        </div>

        {/* KPIs Centralisés */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Conducteurs', val: stats.conducteurs, icon: Users, color: 'indigo', bg: 'bg-indigo-50', text: 'text-indigo-600', link: '#' },
            { label: 'Véhicules', val: stats.vehicules, icon: Car, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', link: '#' },
            { label: 'Agents PNC', val: stats.agents, icon: ShieldCheck, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-600', link: '#' },
            { label: 'Amendes', val: stats.amendes, icon: FileText, color: 'rose', bg: 'bg-rose-50', text: 'text-rose-600', link: '/admin/dashboard/amendes' },
          ].map((kpi, i) => (
            <div 
              key={i} 
              onClick={() => kpi.link !== '#' && router.push(kpi.link)}
              className={`glass-card rounded-[2.5rem] p-8 border-white/80 hover:scale-[1.02] transition-all animate-fade-in group ${kpi.link !== '#' ? 'cursor-pointer' : ''}`} 
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${kpi.bg} ${kpi.text} rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform`}>
                  <kpi.icon className="w-6 h-6" />
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{kpi.label}</div>
              </div>
              <div className="text-4xl font-black text-slate-900 tracking-tighter">{kpi.val.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Panneaux d'actions et Activités */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Actions Administratives */}
          <div className="lg:col-span-2 glass-card rounded-[3rem] p-10 border-white/80">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Zap className="w-5 h-5 text-blue-500" />
                Commandes Rapides
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Nouveau Permis', sub: 'Enregistrement ID', icon: UserPlus, click: () => setIsPermitModalOpen(true), color: 'bg-indigo-600' },
                { label: 'Unité Véhicule', sub: 'Certification Technique', icon: Car, click: () => setIsVehicleModalOpen(true), color: 'bg-blue-600' },
                { label: 'Enrôler Agent', sub: 'Accès Terrain', icon: ShieldCheck, click: () => setIsAgentModalOpen(true), color: 'bg-amber-500' },
                { label: 'Types d\'Infraction', sub: 'Paramètres Sanctions', icon: FileText, click: () => router.push('/admin/dashboard/types-infractions'), color: 'bg-rose-600' },
              ].map((action, i) => (
                <div 
                  key={i}
                  onClick={action.click}
                  className="p-8 bg-[#F8FAFC] border border-slate-100 rounded-[2rem] flex flex-col items-center text-center hover:bg-white hover:shadow-2xl hover:shadow-blue-900/5 transition-all cursor-pointer group"
                >
                  <div className={`w-14 h-14 ${action.color} text-white rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-blue-900/10 group-hover:scale-110 transition-all`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{action.label}</span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{action.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flux d'Activités */}
          <div className="glass-card rounded-[3rem] p-10 border-white/80 flex flex-col">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 mb-8">
              <Clock className="w-5 h-5 text-slate-400" />
              Journal HQ
            </h3>
            
            <div className="space-y-6 flex-1">
              {[
                { title: 'Amende #3200 émise', time: 'Il y a 5 min', icon: FileText, color: 'rose' },
                { title: 'Nouveau Conducteur', time: 'Il y a 12 min', icon: Users, color: 'indigo' },
                { title: 'Liaison Véhicule', time: 'Il y a 1h', icon: Zap, color: 'blue' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-1 px-[1px] bg-slate-100 rounded-full group-hover:bg-blue-200 transition-colors"></div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{activity.title}</div>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="ghost" className="w-full mt-8 h-12 rounded-2xl text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:bg-blue-50">
              Voir l'historique complet
            </Button>
          </div>
        </div>

      </main>

      <AddPermitModal 
        isOpen={isPermitModalOpen} 
        onClose={() => setIsPermitModalOpen(false)} 
        onSuccess={fetchStats} 
      />
      <AddVehicleModal 
        isOpen={isVehicleModalOpen} 
        onClose={() => setIsVehicleModalOpen(false)} 
        onSuccess={fetchStats} 
      />
      <AddAgentModal 
        isOpen={isAgentModalOpen} 
        onClose={() => setIsAgentModalOpen(false)} 
        onSuccess={fetchStats} 
      />
    </div>
  );
}
