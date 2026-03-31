"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  DollarSign,
  User,
  ShieldCheck,
  Car,
  Loader2,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

interface AmendeType {
  id: string;
  motif: string;
  montant: number;
  devise: string;
  statut: string;
  date_creation: string;
  agents: { nom: string; postnom: string };
  conducteurs: { permis: { nom: string; prenom: string } | null };
  vehicules: { plaque: string } | null;
}

export default function AmendesList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [amendes, setAmendes] = useState<AmendeType[]>([]);
  const [annualTotal, setAnnualTotal] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch total paid for the current year
    const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
    const { data: paidData } = await supabase
      .from('fines_issued')
      .select('montant')
      .eq('statut', 'PAYEE')
      .gte('date_emission', startOfYear);
    
    const total = paidData?.reduce((acc, curr) => acc + (Number(curr.montant) || 0), 0) || 0;
    setAnnualTotal(total);

    // 2. Fetch all amendes with relations
    const { data, error } = await supabase
      .from('fines_issued')
      .select(`
        id, nature_infraction, montant, devise, statut, date_emission,
        agents(nom, postnom),
        conducteurs(permis(nom, prenom)),
        vehicules(plaque)
      `)
      .order('date_emission', { ascending: false });

    if (data) {
      // Map to the existing AmendeType interface
      const mappedData = data.map((item: any) => ({
        ...item,
        motif: item.nature_infraction,
        date_creation: item.date_emission
      }));
      setAmendes(mappedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans pb-12 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0F172A] border-none shadow-xl h-20 flex items-center px-6">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/admin/dashboard")}
              className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-slate-700 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-black text-white tracking-tight">Registre des Amendes</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800 h-12 rounded-2xl px-4 gap-2 border border-slate-800">
              <Download className="w-4 h-4" />
              Exporter
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-10">
        
        {/* KPI: Chiffre d'Affaires Annuel */}
        <div className="glass-card rounded-[3rem] p-10 bg-gradient-to-br from-indigo-600 to-blue-700 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <TrendingUp className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Performance Fiscale Annuelle</span>
            </div>
            <div className="text-6xl font-black tracking-tighter mb-2">
              {annualTotal.toLocaleString()} <span className="text-2xl font-bold opacity-60">CDF</span>
            </div>
            <p className="text-sm font-bold text-blue-100 uppercase tracking-widest">Récouvrement total de l'année {new Date().getFullYear()}</p>
          </div>
          
          <div className="absolute right-[-20px] top-[-20px] opacity-10 rotate-12 scale-150">
            <DollarSign size={200} />
          </div>
        </div>

        {/* Listing */}
        <div className="glass-card rounded-[3rem] p-10 border-white/80 overflow-hidden bg-white/40 backdrop-blur-md shadow-xl border border-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-500" />
              Historique des Contraventions
            </h2>
            <div className="flex w-full md:w-auto gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  placeholder="Chercher une amende..." 
                  className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white border border-slate-100 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-0">
                <Filter className="w-5 h-5 text-slate-400" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto -mx-10 px-10">
            <table className="w-full border-separate border-spacing-y-4">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <th className="px-6 py-4 text-left">Date & Motif</th>
                  <th className="px-6 py-4 text-left">Agent</th>
                  <th className="px-6 py-4 text-left">Conducteur</th>
                  <th className="px-6 py-4 text-left">Véhicule</th>
                  <th className="px-6 py-4 text-left">Montant</th>
                  <th className="px-6 py-4 text-right">Statut</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="bg-slate-50 h-16 rounded-2xl mb-4"></td>
                    </tr>
                  ))
                ) : amendes.length > 0 ? (
                  amendes.map((amende) => (
                    <tr key={amende.id} className="group hover:scale-[1.01] transition-transform cursor-pointer">
                      <td className="px-6 py-6 bg-white rounded-l-[1.5rem] border-y border-l border-slate-100 shadow-sm first:rounded-l-[2rem]">
                        <div className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">{amende.motif}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(amende.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-6 bg-white border-y border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center text-[10px] font-bold">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div className="text-[11px] font-bold text-slate-700 uppercase">
                            {amende.agents?.nom ? `${amende.agents.nom} ${amende.agents.postnom || ''}` : 'AGENT PNC / NON SPÉCIFIÉ'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 bg-white border-y border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="text-[11px] font-bold text-slate-700">
                            {amende.conducteurs?.permis ? `${amende.conducteurs.permis.nom} ${amende.conducteurs.permis.prenom}` : 'Inconnu'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 bg-white border-y border-slate-100 shadow-sm">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-900 rounded-lg font-black text-[10px] uppercase">
                          <Car className="w-3 h-3" />
                          {amende.vehicules?.plaque || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-6 bg-white border-y border-slate-100 shadow-sm">
                        <div className="text-sm font-black text-slate-900">
                          {amende.montant.toLocaleString()} <span className="text-[10px] opacity-60 ml-0.5">{amende.devise}</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 bg-white border-y border-r border-slate-100 rounded-r-[1.5rem] shadow-sm text-right last:rounded-r-[2rem]">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          amende.statut === 'PAYEE' 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                            : 'bg-rose-50 text-rose-600 border border-rose-100 animate-pulse'
                        }`}>
                          {amende.statut}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-20 text-center glass-card rounded-[2rem] bg-white/40">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucune amende enregistrée</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
