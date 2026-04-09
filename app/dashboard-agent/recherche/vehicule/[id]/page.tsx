"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Car, Loader2, User, ShieldCheck, XCircle, AlertTriangle, UserCircle2, Settings } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function ResultatVehiculePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [vehicule, setVehicule] = useState<any>(null);
  const [conducteurs, setConducteurs] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Get Vehicule Details
        const { data: vehData, error: vehError } = await supabase
          .from("vehicules")
          .select("*")
          .eq("id", id)
          .single();

        if (vehError) throw vehError;
        setVehicule(vehData);

        // 2. Get Associated Drivers
        const { data: condData, error: condError } = await supabase
          .from("conducteur_vehicule")
          .select(`
            conducteurs (
              id,
              driver_id,
              photo_url,
              permis (
                nom,
                prenom,
                photo
              )
            )
          `)
          .eq("vehicule_id", id);
          
        if (condError) throw condError;
        
        if (condData) {
          const list = condData
            .map((item: any) => item.conducteurs)
            .filter(Boolean);
          setConducteurs(list);
        }
      } catch (error: any) {
        console.error(error);
        alert("Erreur lors de la récupération des données : " + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const getPastille = (dateString?: string | null) => {
    if (!dateString) return { state: 'Rouge', label: 'Invalide / Expiré' };
    const diffDays = Math.ceil((new Date(dateString).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { state: 'Rouge', label: 'Expiré' };
    if (diffDays <= 30) return { state: 'Orange', label: 'Expire bientôt' };
    return { state: 'Vert', label: 'Valide' };
  };

  if (loading || !vehicule) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest text-center">Recherche en cours...</p>
      </div>
    );
  }

  const pastilles = [
    { name: 'Assurance', ...getPastille(vehicule.date_expiration_assurance) },
    { name: 'Vignette', ...getPastille(vehicule.date_expiration_vignette) },
    { name: 'Contrôle Tech.', ...getPastille(vehicule.date_prochain_controle) },
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans pb-10">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-100 p-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600 transition-colors p-2 -ml-2 rounded-full hover:bg-slate-50">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
             <h1 className="text-lg font-black text-[#1e3b6a] uppercase tracking-tight">Fiche Véhicule</h1>
             <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Détails administratifs</p>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-xl mx-auto w-full space-y-6 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Plaque & Identité du véhicule */}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-blue-900/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 text-slate-50">
              <Car className="w-32 h-32" />
           </div>
           
           <div className="relative z-10">
             <div className="inline-flex items-center justify-center px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                Véhicule Enregistré
             </div>
             
             <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">{vehicule.plaque}</h2>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                {vehicule.marque} {vehicule.modele}
             </p>
             
             <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Settings className="w-3 h-3"/> Usage</p>
                   <p className="text-sm font-bold text-slate-900">{vehicule.usage_categorie || '-'}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Année</p>
                   <p className="text-sm font-bold text-slate-900">{vehicule.annee || '-'}</p>
                </div>
             </div>
           </div>
        </div>

        {/* Propriétaire */}
        <div className="bg-[#1e3b6a] text-white p-6 md:p-8 rounded-[3rem] shadow-lg relative overflow-hidden">
           <div className="absolute right-[-10px] top-[-10px] opacity-10 rotate-12">
              <UserCircle2 size={120} />
           </div>
           <div className="relative z-10 flex items-center gap-5">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0">
                 <User className="w-6 h-6 text-blue-200" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] mb-1">Propriétaire du véhicule</p>
                 <h3 className="text-xl font-black tracking-tight">{vehicule.nom_proprietaire || "Non renseigné"}</h3>
                 {vehicule.phone_proprietaire && (
                   <p className="text-xs font-bold text-blue-200 mt-1">{vehicule.phone_proprietaire}</p>
                 )}
                 {vehicule.adresse_proprietaire && (
                   <p className="text-[10px] text-blue-200/80 mt-1 font-medium">{vehicule.adresse_proprietaire}</p>
                 )}
              </div>
           </div>
        </div>

        {/* Statut Fiscal */}
        <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-slate-100">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Statut d'immatriculation</h3>
           <div className="space-y-3">
             {pastilles.map((doc, idx) => (
                <div key={idx} className={`p-4 rounded-2xl flex items-center justify-between border ${doc.state === 'Vert' ? 'bg-emerald-50 border-emerald-100' : doc.state === 'Orange' ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
                   <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{doc.name}</span>
                   <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase ${doc.state === 'Vert' ? 'text-emerald-600' : doc.state === 'Orange' ? 'text-amber-600' : 'text-rose-600'}`}>
                        {doc.label}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${doc.state === 'Vert' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : doc.state === 'Orange' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.5)] animate-pulse'}`} />
                   </div>
                </div>
             ))}
           </div>
        </div>

        {/* Conducteurs Associés */}
        <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-slate-100">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Conducteurs Enregistrés ({conducteurs.length})</h3>
           
           {conducteurs.length === 0 ? (
             <div className="text-center py-6">
                <p className="text-xs font-bold text-slate-400">Aucun conducteur n'a ajouté ce véhicule à son profil.</p>
             </div>
           ) : (
             <div className="space-y-4">
               {conducteurs.map((cond) => {
                 const fullName = cond.permis ? `${cond.permis.nom} ${cond.permis.prenom}` : "Conducteur Inconnu";
                 const photo = cond.photo_url || cond.permis?.photo;
                 return (
                   <button 
                     key={cond.id}
                     onClick={() => router.push(`/conducteur-public/${cond.id}`)}
                     className="w-full flex items-center p-3 hover:bg-slate-50 transition-colors rounded-2xl group text-left"
                   >
                     <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border-2 border-white shadow-sm ring-2 ring-slate-100 group-hover:ring-blue-100">
                        {photo ? (
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-slate-400" /></div>
                        )}
                     </div>
                     <div className="ml-4 flex-1">
                        <p className="text-sm font-black text-slate-900 tracking-tight">{fullName}</p>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mt-1">{cond.driver_id}</p>
                     </div>
                   </button>
                 );
               })}
             </div>
           )}
        </div>

      </main>
    </div>
  );
}
