"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Target, 
  FileText, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  ShieldAlert,
  Calendar,
  User,
  ShieldCheck,
  Car
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { supabase } from "@/lib/supabaseClient";

interface FineType {
  id: string;
  nature: string;
  montant: number;
  devise: string;
  delai_paiement: number;
}

function AmendeFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const driverIdStr = searchParams.get("driver_id");
  const vehiculeIdStr = searchParams.get("vehicule_id");

  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);
  const [driver, setDriver] = useState<any>(null);
  const [vehicule, setVehicule] = useState<any>(null);
  const [fineTypes, setFineTypes] = useState<FineType[]>([]);
  
  // Form State
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [lieu, setLieu] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  
  const [currentType, setCurrentType] = useState<FineType | null>(null);

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      // 1. Get Agent Session
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Find agent by Auth ID OR Email
        const { data: agentData } = await supabase
          .from('agents')
          .select('*')
          .or(`id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();
        
        if (agentData) {
          setAgent(agentData);
        } else {
          // Fallback to metadata with multiple possible keys
          setAgent({
            id: user.id, // Ensure we have a UUID for the DB
            nom: user.user_metadata?.nom || user.user_metadata?.full_name || "Officier PNC",
            matricule: user.user_metadata?.matricule || user.user_metadata?.agent_id || "ID-ACTIVE",
            agent_id: user.user_metadata?.agent_id || user.user_metadata?.matricule || user.id
          });
        }
      }

      // 2. Get Driver
      if (driverIdStr) {
        const { data: driverData } = await supabase
          .from('conducteurs')
          .select('*, permis(*)')
          .eq('id', driverIdStr)
          .single();
        setDriver(driverData);
      }

      // 3. Get Vehicle
      if (vehiculeIdStr) {
        const { data: vehiculeData } = await supabase
          .from('vehicules')
          .select('*')
          .eq('id', vehiculeIdStr)
          .single();
        setVehicule(vehiculeData);
      }

      // 4. Get Fine Types
      const { data: types } = await supabase
        .from('fine_types')
        .select('*')
        .order('nature');
      if (types) setFineTypes(types);

      setLoading(false);
    };

    initData();
  }, [driverIdStr, vehiculeIdStr]);

  const handleTypeChange = (id: string) => {
    setSelectedTypeId(id);
    const type = fineTypes.find(t => t.id === id);
    setCurrentType(type || null);
  };

  const captureLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLieu(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
          setIsLocating(false);
        },
        (error) => {
          console.error("Geo error:", error);
          setLieu("Localisation indisponible");
          setIsLocating(false);
        }
      );
    } else {
      alert("Géolocalisation non supportée par votre navigateur.");
      setIsLocating(false);
    }
  };

  const handleNext = () => {
    if (!selectedTypeId || !lieu) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const amendeData = {
      agent_id: agent?.id,
      agent_nom: agent?.nom ? `${agent.nom} ${agent.postnom || ''}`.trim() : 'Officier PNC',
      agent_matricule: agent?.matricule || agent?.agent_id || agent?.agentId || 'ID-ACTIVE',
      conducteur_id: driver?.id,
      conducteur_nom: driver?.permis ? `${driver.permis.nom} ${driver.permis.prenom}` : "Conducteur Inconnu",
      vehicule_id: vehicule?.id,
      vehicule_plaque: vehicule?.plaque,
      type_id: currentType?.id,
      nature_infraction: currentType?.nature,
      montant: currentType?.montant,
      devise: currentType?.devise,
      delai_paiement: currentType?.delai_paiement,
      lieu_gps: lieu,
      date_emission: new Date().toISOString()
    };

    // Storing in localStorage for the recap page
    localStorage.setItem("pending_fine", JSON.stringify(amendeData));
    router.push("/dashboard-agent/amende/recap");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[#1e3b6a] animate-spin" />
        <p className="text-[10px] font-black text-[#1e3b6a] uppercase tracking-widest">Initialisation PNC...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans pb-10">
      <header className="bg-white border-b border-slate-100 p-6 flex items-center gap-4 sticky top-0 z-50 shadow-sm">
        <button onClick={() => router.back()} className="text-slate-400">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black text-[#1e3b6a] uppercase tracking-tight">Nouvelle Amende</h1>
      </header>

      <main className="p-6 space-y-6 max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom duration-500">
        
        {/* Rappel des données automatiques */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
               <ShieldCheck className="w-5 h-5" />
             </div>
             <div className="min-w-0">
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Agent / Matricule</p>
               <p className="text-xs font-black text-slate-900 truncate uppercase">{agent?.nom || 'Officier PNC'}</p>
               <p className="text-[10px] font-bold text-blue-600 truncate">{agent?.matricule || agent?.agent_id || agent?.agentId || 'ID Actif'}</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
             <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0">
               <Calendar className="w-5 h-5" />
             </div>
             <div>
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Date & Heure</p>
               <p className="text-xs font-black text-slate-900">{new Date().toLocaleDateString()}</p>
             </div>
          </div>
        </div>

        {/* Cible du Scan */}
        <div className="bg-[#1e3b6a] text-white p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden">
           <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                 <User className="w-6 h-6 text-white" />
              </div>
              <div>
                 <h2 className="text-lg font-black tracking-tight">{driver?.permis?.nom} {driver?.permis?.prenom}</h2>
                 <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mt-1">
                   <Car className="w-3.5 h-3.5" />
                   {vehicule?.plaque} • {vehicule?.marque}
                 </p>
              </div>
           </div>
           <div className="absolute right-[-10px] bottom-[-10px] opacity-10 rotate-12">
              <ShieldAlert size={120} />
           </div>
        </div>

        {/* Formulaire de saisie */}
        <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 space-y-8">
           
           {/* Nature de l'infraction */}
            <div className="space-y-1">
               <CustomSelect
                 label="Nature de l'infraction"
                 options={fineTypes.map(ft => ({ label: ft.nature, value: ft.id }))}
                 value={selectedTypeId}
                 onChange={handleTypeChange}
                 placeholder="Sélectionner une infraction..."
               />
            </div>

           {/* Montant et Délai (Auto) */}
           {currentType && (
             <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95">
                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                   <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">Montant imposé</p>
                   <p className="text-lg font-black text-rose-700">{currentType.montant.toLocaleString()} <span className="text-xs opacity-60">{currentType.devise}</span></p>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                   <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Délai Légal</p>
                   <p className="text-lg font-black text-blue-700">{currentType.delai_paiement} <span className="text-xs opacity-60 uppercase">Jours</span></p>
                </div>
             </div>
           )}

           {/* Lieu / GPS */}
           <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-1">Lieu de l'infraction</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input 
                    value={lieu}
                    readOnly
                    placeholder="Capture GPS requise"
                    className="h-14 pl-12 rounded-2xl bg-slate-50 border-slate-100 text-xs font-black uppercase tracking-wider"
                  />
                </div>
                <button 
                  onClick={captureLocation}
                  disabled={isLocating}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isLocating ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white shadow-blue-500/20 active:scale-95'}`}
                >
                  {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-6 h-6" />}
                </button>
              </div>
              <p className="text-[9px] font-bold text-slate-400 italic">Capturer les coordonnées GPS exactes pour preuve d'intervention.</p>
           </div>

           <Button 
            onClick={handleNext}
            className="w-full h-16 bg-[#1e3b6a] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl shadow-blue-900/10 hover:bg-[#152a4f] gap-2 transition-all mt-4"
           >
             Continuer <ChevronRight className="w-5 h-5" />
           </Button>
        </div>

      </main>
    </div>
  );
}

export default function AmendeFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <AmendeFormContent />
    </Suspense>
  );
}
